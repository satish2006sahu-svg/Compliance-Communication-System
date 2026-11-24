import os
import ipaddress
import re
import socket
from urllib.parse import urlparse
from typing import Dict, Any, Optional
import httpx
from fastapi import HTTPException
from app.config import settings

try:
    from firecrawl import FirecrawlApp
except ImportError:
    FirecrawlApp = None

class FirecrawlService:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.FIRECRAWL_API_KEY
        self.base_url = (base_url or settings.FIRECRAWL_BASE_URL).rstrip("/")

    @property
    def active_api_key(self) -> str:
        return (os.getenv("FIRECRAWL_API_KEY") or self.api_key or settings.FIRECRAWL_API_KEY or "").strip()
        
    def validate_url_security(self, url: str) -> None:
        """
        Validates URL format and blocks SSRF risks:
        - Blocks non-HTTP/HTTPS schemes
        - Blocks localhost, loopbacks, link-local, and private RFC-1918 IPs
        """
        if not url or not isinstance(url, str):
            raise HTTPException(status_code=400, detail="A valid regulatory website URL is required.")
        
        parsed = urlparse(url.strip())
        if parsed.scheme.lower() not in ("http", "https"):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid URL scheme '{parsed.scheme}'. Only 'http://' and 'https://' URLs are permitted."
            )
        
        hostname = parsed.hostname
        if not hostname:
            raise HTTPException(status_code=400, detail="Invalid URL: Hostname could not be determined.")
        
        # Block literal localhost
        if hostname.lower() in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
            raise HTTPException(status_code=400, detail="Access to localhost / loopback addresses is blocked for security.")
        
        # Resolve hostname to check for private or reserved IPs
        try:
            ip_str = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip_str)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Security alert: The target host '{hostname}' ({ip_str}) resolves to a private or internal network address, which is prohibited."
                )
        except socket.gaierror:
            # Let Firecrawl attempt resolution or report failure if DNS lookup fails locally
            pass

    def scrape_url(self, url: str) -> Dict[str, Any]:
        """
        Scrapes a regulatory website using the actual Firecrawl API.
        Extracts markdown content, page title, and relevant metadata.
        """
        self.validate_url_security(url)
        
        api_key = self.active_api_key
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Firecrawl API Key is missing. "
                    "Please obtain an API key from https://firecrawl.dev and configure "
                    "FIRECRAWL_API_KEY in your backend/.env file."
                )
            )

        # 1. Try official FirecrawlApp SDK first
        content = ""
        title = ""
        meta_dict = {}
        error_msg = None

        if FirecrawlApp is not None:
            try:
                app = FirecrawlApp(api_key=api_key)
                result = None
                if hasattr(app, "scrape_url"):
                    try:
                        result = app.scrape_url(url, params={"formats": ["markdown", "html"]})
                    except Exception as ex1:
                        error_msg = str(ex1)
                elif hasattr(app, "scrape"):
                    try:
                        result = app.scrape(url, formats=["markdown"])
                    except Exception as ex2:
                        error_msg = str(ex2)

                if result is not None:
                    if isinstance(result, dict):
                        data = result.get("data", result)
                        content = data.get("markdown") or data.get("content") or ""
                        meta = data.get("metadata", {})
                        title = meta.get("title") or meta.get("ogTitle") or ""
                        meta_dict = meta if isinstance(meta, dict) else (meta.__dict__ if hasattr(meta, "__dict__") else {})
                    else:
                        content = getattr(result, "markdown", "") or getattr(result, "content", "") or ""
                        meta = getattr(result, "metadata", None)
                        if meta:
                            title = getattr(meta, "title", "") or getattr(meta, "og_title", "") or ""
                            meta_dict = meta if isinstance(meta, dict) else (meta.__dict__ if hasattr(meta, "__dict__") else {})
            except Exception as e:
                error_msg = str(e)

        # 2. If SDK did not return content or failed, use direct REST API
        if not content:
            endpoint = f"{self.base_url}/v1/scrape"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "url": url,
                "formats": ["markdown", "html"],
                "onlyMainContent": True
            }
            try:
                with httpx.Client(timeout=45.0) as client:
                    resp = client.post(endpoint, json=payload, headers=headers)
                    if resp.status_code == 401 or resp.status_code == 403:
                        raise HTTPException(
                            status_code=401,
                            detail="Firecrawl API authentication failed. Please verify that FIRECRAWL_API_KEY is valid."
                        )
                    elif resp.status_code == 429:
                        raise HTTPException(
                            status_code=429,
                            detail="Firecrawl API rate limit exceeded or credit quota exhausted. Please check your Firecrawl account."
                        )
                    elif resp.status_code != 200:
                        detail_text = resp.text
                        try:
                            err_json = resp.json()
                            detail_text = err_json.get("error", detail_text)
                        except Exception:
                            pass
                        raise HTTPException(
                            status_code=resp.status_code,
                            detail=f"Firecrawl scraping error ({resp.status_code}): {detail_text}"
                        )
                    
                    data = resp.json()
                    scraped_data = data.get("data", {})
                    content = scraped_data.get("markdown", "") or scraped_data.get("html", "")
                    meta = scraped_data.get("metadata", {})
                    title = meta.get("title") or meta.get("ogTitle") or ""
                    meta_dict = meta
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=502,
                    detail=f"Network error while connecting to Firecrawl service: {str(exc)}"
                )

        if not content or len(content.strip()) < 20:
            raise HTTPException(
                status_code=422,
                detail="Scraping completed, but the extracted content from this URL was empty or insufficient for regulatory analysis."
            )

        # Fallback title if empty
        if not title:
            first_line = content.strip().split("\n")[0].strip("# ").strip()
            title = first_line[:150] if first_line else f"Regulatory Update: {urlparse(url).netloc}"

        return {
            "title": title,
            "source_url": url,
            "extracted_content": content.strip(),
            "metadata": meta_dict
        }

firecrawl_service = FirecrawlService()

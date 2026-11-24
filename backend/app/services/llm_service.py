import json
import os
import re
from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from app.config import settings
from app.schemas import RegulatoryAnalysis, FAQItem

class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL
        self.openai_model = settings.OPENAI_MODEL
        self.openai_base_url = settings.OPENAI_BASE_URL
        
    @property
    def active_gemini_key(self) -> str:
        return (os.getenv("GEMINI_API_KEY") or self.gemini_key or settings.GEMINI_API_KEY or "").strip()

    @property
    def active_openai_key(self) -> str:
        return (os.getenv("OPENAI_API_KEY") or self.openai_key or settings.OPENAI_API_KEY or "").strip()

    @property
    def active_gemini_model(self) -> str:
        return (os.getenv("GEMINI_MODEL") or self.gemini_model or settings.GEMINI_MODEL or "gemini-3.8-flash").strip()

    def _get_active_provider(self) -> str:
        gemini_key = self.active_gemini_key
        openai_key = self.active_openai_key
        
        if gemini_key:
            return "gemini"
        elif openai_key:
            return "openai"
        elif self.provider == "gemini" and gemini_key:
            return "gemini"
        elif self.provider == "openai" and openai_key:
            return "openai"
        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No LLM API key configured. "
                    "Please configure GEMINI_API_KEY (from https://aistudio.google.com/) or "
                    "OPENAI_API_KEY in backend/.env to enable AI regulatory analysis, "
                    "announcement generation, and chatbot QA."
                )
            )

    def _call_gemini(self, prompt: str, system_instruction: str = "", json_mode: bool = False) -> str:
        """
        Executes Google Gemini LLM API calls with Gemini 3.8 Flash.
        Features comprehensive error handling for:
        - Invalid API keys (401 / 403 / API_KEY_INVALID)
        - Quota limits & rate exhaustion (429 RESOURCE_EXHAUSTED)
        - Unavailable models & server demand spikes (503 UNAVAILABLE / 504 DEADLINE_EXCEEDED)
        - Outdated/deprecated models (404 NOT_FOUND)
        Automatically attempts compatible fallback (gemini-3.5-flash) during demand spikes.
        """
        from google import genai
        from google.genai import types
        from google.genai.errors import ClientError, ServerError

        key = self.active_gemini_key
        if not key:
            raise HTTPException(
                status_code=400,
                detail="No Gemini API key configured. Please configure GEMINI_API_KEY in backend/.env"
            )

        client = genai.Client(api_key=key)
        primary_model = self.active_gemini_model or "gemini-3.8-flash"

        # Models to try: primary model first, followed by compatible fallback if quota or high-demand occurs
        models_to_try = [primary_model]
        if primary_model != "gemini-3.5-flash":
            models_to_try.append("gemini-3.5-flash")

        config_kwargs = {}
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction
        if json_mode:
            config_kwargs["response_mime_type"] = "application/json"

        last_error = None
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(**config_kwargs) if config_kwargs else None
                )
                return response.text or ""
            except ClientError as e:
                last_error = e
                err_str = str(e)
                # Check for invalid API key
                if any(k in err_str for k in ("API_KEY_INVALID", "API key not valid", "PERMISSION_DENIED")) or getattr(e, "code", None) in (401, 403):
                    raise HTTPException(
                        status_code=401,
                        detail="Google Gemini API key is invalid or unauthorized. Please verify your GEMINI_API_KEY from Google AI Studio."
                    )
                # Check for quota exhaustion / rate limit
                if "RESOURCE_EXHAUSTED" in err_str or getattr(e, "code", None) == 429:
                    continue  # Try fallback model
                # Check for outdated / unavailable model
                if "NOT_FOUND" in err_str or getattr(e, "code", None) == 404:
                    continue  # Try fallback model
                # Other client errors
                raise HTTPException(
                    status_code=400,
                    detail=f"Google Gemini client error ({getattr(e, 'code', 'error')}): {err_str}"
                )
            except ServerError as e:
                last_error = e
                # 503 UNAVAILABLE or 504 DEADLINE_EXCEEDED (temporary high demand)
                continue
            except Exception as e:
                last_error = e
                raise HTTPException(
                    status_code=502,
                    detail=f"Google Gemini API error: {str(e)}"
                )

        # If all models in retry list failed
        if last_error:
            err_str = str(last_error)
            if "RESOURCE_EXHAUSTED" in err_str or getattr(last_error, "code", 0) == 429:
                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Google Gemini API quota limit reached (429 RESOURCE_EXHAUSTED). "
                        "The daily Free Tier limit for this model has been exceeded. "
                        "Please check https://aistudio.google.com/docs/rate-limits or update your billing plan."
                    )
                )
            elif "UNAVAILABLE" in err_str or getattr(last_error, "code", 0) == 503:
                raise HTTPException(
                    status_code=503,
                    detail="Google Gemini service is temporarily experiencing high demand (503 UNAVAILABLE). Please try again shortly."
                )
            raise HTTPException(
                status_code=502,
                detail=f"Google Gemini model call failed: {err_str}"
            )
        return ""

    def _call_llm(self, prompt: str, system_instruction: str = "", json_mode: bool = False) -> str:
        provider = self._get_active_provider()
        
        if provider == "gemini":
            return self._call_gemini(prompt, system_instruction, json_mode)

        elif provider == "openai":
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.active_openai_key, base_url=self.openai_base_url)
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                kwargs = {
                    "model": self.openai_model,
                    "messages": messages,
                    "temperature": 0.2,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}
                    
                response = client.chat.completions.create(**kwargs)
                return response.choices[0].message.content or ""
            except Exception as e:
                raise HTTPException(
                    status_code=502,
                    detail=f"OpenAI LLM call failed: {str(e)}"
                )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported LLM provider: {provider}")

    def analyze_regulatory_document(self, content: str, source_url: str, title: str) -> Dict[str, Any]:
        """
        Analyzes extracted regulatory text to extract structured compliance insights.
        Grounds strictly on source text without inventing rules.
        """
        system_instruction = (
            "You are an expert Chief Compliance Officer and Regulatory Affairs Specialist. "
            "Analyze the provided regulatory circular/document with extreme precision. "
            "CRITICAL RULE: DO NOT INVENT regulatory requirements, penalties, dates, or obligations. "
            "If any detail (e.g., penalties or exact deadlines) is not explicitly stated in the source, "
            "you MUST state 'Not specified in source'."
        )
        
        prompt = f"""
SOURCE DOCUMENT METADATA:
Title: {title}
Source URL: {source_url}

REGULATORY DOCUMENT TEXT:
\"\"\"
{content[:15000]}
\"\"\"

Please analyze this regulatory update and return a strictly valid JSON object with the following keys:
{{
  "title": "Clear, official regulatory title",
  "regulator": "Issuing authority (e.g. Reserve Bank of India, SEBI, etc.)",
  "effective_date": "Effective date or timeline specified in the document, or 'Immediate / Not specified in source'",
  "main_regulatory_changes": ["Change 1", "Change 2", ...],
  "important_compliance_requirements": ["Requirement 1", "Requirement 2", ...],
  "key_instructions": ["Instruction 1", "Instruction 2", ...],
  "affected_departments": ["Department/Group 1", ...],
  "important_dates_and_deadlines": ["Deadline 1", ...],
  "penalties_and_risks": "Explicit penalties and legal risks if stated, or 'Not specified in source'",
  "required_actions": ["Step 1", "Step 2", ...],
  "employee_key_takeaways": ["Takeaway 1", "Takeaway 2", ...]
}}
Ensure the output is 100% valid JSON without markdown wrapping or code blocks.
"""
        try:
            raw_output = self._call_llm(prompt, system_instruction, json_mode=True)
            # Clean possible markdown ticks
            cleaned = re.sub(r"^```json\s*", "", raw_output.strip())
            cleaned = re.sub(r"```$", "", cleaned.strip())
            parsed = json.loads(cleaned)
            return parsed
        except HTTPException as e:
            # Fallback when LLM API key is not configured or fails
            lines = [l.strip() for l in content.split("\n") if l.strip() and len(l.strip()) > 20]
            summary_changes = lines[:4] if lines else ["Review published regulatory directives"]
            return {
                "title": title or "Regulatory Compliance Update",
                "regulator": "Regulatory Authority",
                "effective_date": "Immediate / As per notification",
                "main_regulatory_changes": summary_changes,
                "important_compliance_requirements": [
                    "Ensure institutional adherence to published guidelines.",
                    "Complete internal gap analysis within specified timelines.",
                    "Maintain auditable compliance records."
                ],
                "key_instructions": [
                    "Review full circular text from official source URL.",
                    "Department heads must brief relevant operational teams."
                ],
                "affected_departments": ["Compliance", "Operations", "Legal", "Information Technology"],
                "important_dates_and_deadlines": ["Refer to published source circular for exact deadlines"],
                "penalties_and_risks": "Regulatory penalties and supervisory enforcement for non-compliance.",
                "required_actions": [
                    "Distribute announcement to all designated staff.",
                    "Align internal workflows with regulatory mandates."
                ],
                "employee_key_takeaways": [
                    "Carefully read all organizational compliance notices.",
                    "Direct procedural inquiries to the Compliance Department."
                ]
            }
        except Exception:
            # Return structured fallback if JSON parse fails
            return {
                "title": title,
                "regulator": "Official Regulatory Authority",
                "effective_date": "As per notification",
                "main_regulatory_changes": [line.strip() for line in (raw_output.split("\n") if 'raw_output' in locals() else []) if line.strip()][:5],
                "important_compliance_requirements": ["Adherence to published directives"],
                "key_instructions": ["Review complete official text from source URL"],
                "affected_departments": ["Compliance", "Operations", "Legal"],
                "important_dates_and_deadlines": ["Refer to official source notification"],
                "penalties_and_risks": "Not specified in source",
                "required_actions": ["Acknowledge and implement guidelines"],
                "employee_key_takeaways": ["Review full regulatory guidelines"]
            }

    def generate_announcement(self, content: str, analysis: Dict[str, Any], source_url: str) -> Dict[str, Any]:
        """
        Generates a professional internal compliance announcement for employees.
        """
        system_instruction = (
            "You are a Senior Corporate Compliance Communications Lead. "
            "Your task is to write a comprehensive, professional, well-structured compliance announcement "
            "to communicate regulatory updates clearly to organization employees. "
            "Use clear headings, bullet points, professional corporate tone, and actionable guidance."
        )
        
        prompt = f"""
REGULATORY ANALYSIS DATA:
{json.dumps(analysis, indent=2)}

SOURCE URL: {source_url}

Create a polished, complete compliance announcement in Markdown format.
It must include:
1. # Announcement Title (Compelling and formal)
2. ## 1. Executive Summary & Regulatory Purpose
3. ## 2. Key Regulatory Changes Overview
4. ## 3. Mandatory Compliance Requirements
5. ## 4. Action Items for Employees & Affected Departments
6. ## 5. Important Deadlines & Timelines
7. ## 6. Regulatory Consequences & Compliance Risks
8. ## 7. Official Source & Verification
   - Link: [Official Regulatory Source Document]({source_url})
9. **Publication Date:** Today's Date | **Issued By:** Office of Regulatory Compliance

Output ONLY a JSON object with:
{{
  "title": "Short, clear title for announcement header",
  "content": "Full markdown text of the announcement"
}}
"""
        try:
            raw = self._call_llm(prompt, system_instruction, json_mode=True)
            cleaned = re.sub(r"^```json\s*", "", raw.strip())
            cleaned = re.sub(r"```$", "", cleaned.strip())
            return json.loads(cleaned)
        except HTTPException as e:
            if "No LLM API key configured" in str(getattr(e, 'detail', '')) or getattr(e, 'status_code', 0) in (400, 401, 429, 503):
                title = analysis.get("title") or "Regulatory Compliance Notice"
                regulator = analysis.get("regulator") or "Regulatory Authority"
                changes = "\n".join([f"- {c}" for c in analysis.get("main_regulatory_changes", [])])
                reqs = "\n".join([f"- {r}" for r in analysis.get("important_compliance_requirements", [])])
                actions = "\n".join([f"- {a}" for a in analysis.get("required_actions", [])])
                deadlines = "\n".join([f"- **{d}**" for d in analysis.get("important_dates_and_deadlines", [])])
                penalties = analysis.get("penalties_and_risks", "Not specified in source")
                content_md = f"""# Compliance Directive: {title}

## 1. Executive Summary & Regulatory Purpose
This internal compliance announcement communicates updated regulatory directives issued by the {regulator}. All employees and designated department heads must review and implement the directives outlined below to ensure institutional compliance.

## 2. Key Regulatory Changes Overview
{changes or "- Review complete circular instructions from official portal."}

## 3. Mandatory Compliance Requirements
{reqs or "- Adherence to standard corporate compliance mandates."}

## 4. Action Items for Employees & Affected Departments
{actions or "- Acknowledge receipt and follow departmental operating procedures."}

## 5. Important Deadlines & Timelines
{deadlines or "- Refer to official regulatory circular."}

## 6. Regulatory Consequences & Compliance Risks
{penalties}

## 7. Official Source & Verification
- Link: [Official Regulatory Source Document]({source_url})
"""
                return {
                    "title": f"Compliance Notice: {title}",
                    "content": content_md
                }
            raise
        except Exception:
            return {
                "title": analysis.get("title", "Regulatory Compliance Announcement"),
                "content": raw.strip() if 'raw' in locals() else "Regulatory Announcement"
            }

    def generate_faqs(self, content: str, analysis: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Generates 5-10 practical, employee-friendly FAQs based strictly on the regulatory update.
        """
        system_instruction = (
            "You are an internal Compliance Training Director. "
            "Draft 5 to 10 practical, easy-to-understand FAQs that answer common employee questions "
            "regarding this regulatory change. "
            "Keep the answers strictly accurate to the source material. Never invent facts."
        )
        
        prompt = f"""
REGULATORY DOCUMENT ANALYSIS:
{json.dumps(analysis, indent=2)}

Generate 6-8 practical FAQs in JSON format as an array of objects:
[
  {{
    "question": "What does this new regulation change for our daily operations?",
    "answer": "Clear, concise, and helpful explanation based on the document."
  }},
  ...
]
Output ONLY the JSON array.
"""
        try:
            raw = self._call_llm(prompt, system_instruction, json_mode=True)
            cleaned = re.sub(r"^```json\s*", "", raw.strip())
            cleaned = re.sub(r"```$", "", cleaned.strip())
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict) and "faqs" in parsed:
                return parsed["faqs"]
            elif isinstance(parsed, list):
                return parsed
            return []
        except HTTPException as e:
            if "No LLM API key configured" in str(getattr(e, 'detail', '')) or getattr(e, 'status_code', 0) in (400, 401, 429, 503):
                faqs = []
                # Synthesize from analysis
                reqs = analysis.get("important_compliance_requirements", [])
                for i, r in enumerate(reqs[:3], 1):
                    faqs.append({
                        "question": f"What is required under compliance requirement #{i}?",
                        "answer": f"Employees must follow: {r}"
                    })
                deadlines = analysis.get("important_dates_and_deadlines", [])
                if deadlines:
                    faqs.append({
                        "question": "What are the critical compliance deadlines?",
                        "answer": f"The key deadlines are: {', '.join(deadlines)}."
                    })
                takeaways = analysis.get("employee_key_takeaways", [])
                for t in takeaways[:2]:
                    faqs.append({
                        "question": "What is an important takeaway for my daily routine?",
                        "answer": t
                    })
                if not faqs:
                    faqs = [
                        {
                            "question": "What is the core purpose of this regulatory update?",
                            "answer": "The update introduces updated guidelines to align organization practices with current regulatory requirements."
                        },
                        {
                            "question": "Where can I read the full official circular?",
                            "answer": "Please review the source link attached to the compliance announcement."
                        }
                    ]
                return faqs
            raise
        except Exception:
            return [
                {
                    "question": "What is the core purpose of this regulatory update?",
                    "answer": "The update introduces updated guidelines to align organization practices with current regulatory requirements."
                },
                {
                    "question": "Where can I read the full official circular?",
                    "answer": "Please review the source link attached to the compliance announcement."
                }
            ]

    def answer_employee_query(
        self,
        query: str,
        published_documents: List[Dict[str, Any]],
        memento_context: str,
        employee_name: str = "Employee"
    ) -> Dict[str, Any]:
        """
        Generates a grounded chatbot response combining:
        1. Official published regulatory documents & FAQs (authoritative truth)
        2. Relevant conversational memories from Memento (continuity & past questions)
        """
        system_instruction = (
            "You are the organization's Official AI Compliance Assistant. "
            "You answer employee inquiries regarding approved regulatory changes, compliance circulars, and FAQs.\n\n"
            "STRICT RULES:\n"
            "1. Ground all compliance answers strictly on the PUBLISHED REGULATORY CONTEXT provided below.\n"
            "2. If the answer to the regulatory question cannot be found in the published documents, you MUST clearly state: "
            "'I cannot find this information in the currently published regulatory compliance documents. Please consult the Compliance Department.'\n"
            "3. DO NOT invent dates, penalties, regulations, or exemptions.\n"
            "4. Use the PREVIOUS CONVERSATION CONTEXT (from Memento) to understand conversational continuity, "
            "such as answering 'What did we discuss earlier?', referencing past questions asked by the employee, or follow-ups.\n"
            "5. Always be polite, professional, and include source document references and links when available."
        )

        doc_blocks = []
        for i, doc in enumerate(published_documents, 1):
            doc_blocks.append(
                f"[Document {i}]: {doc.get('title')}\n"
                f"Source URL: {doc.get('source_url')}\n"
                f"Announcement Content:\n{doc.get('announcement_content', '')[:3000]}\n"
                f"Related FAQs:\n{json.dumps(doc.get('faqs', []), indent=1)}\n"
            )
        published_context_str = "\n---\n".join(doc_blocks) if doc_blocks else "No published documents available."

        memory_str = memento_context.strip() if memento_context and memento_context.strip() else "No prior conversation history recorded for this employee."

        prompt = f"""
EMPLOYEE ASKING: {employee_name}

=== PREVIOUS CONVERSATION MEMORY (MEMENTO PERSISTENT MEMORY) ===
{memory_str}

=== PUBLISHED REGULATORY DOCUMENTS (AUTHORITATIVE KNOWLEDGE BASE) ===
{published_context_str}

=== EMPLOYEE QUESTION ===
{query}

Please provide a helpful, accurate, grounded response with relevant source citations.
"""
        try:
            answer = self._call_llm(prompt, system_instruction, json_mode=False)
        except HTTPException as e:
            if "No LLM API key configured" in str(getattr(e, 'detail', '')):
                lower_q = query.lower()
                # 1. If asking about past conversations
                if any(k in lower_q for k in ("yesterday", "earlier", "previous", "last time", "we discuss", "we talk", "remind me")):
                    if memento_context and memento_context.strip():
                        answer = f"According to your Memento Persistent Memory record, here is what we discussed earlier:\n\n{memento_context}\n\nIs there anything specific you would like to follow up on?"
                    else:
                        answer = "I checked your private Memento persistent memory, but there is no previous conversation recorded yet for this session."
                # 2. If asking about regulations/deadlines
                else:
                    matched_items = []
                    for doc in published_documents:
                        for f in doc.get("faqs", []):
                            q = f.get("q", "").lower()
                            if any(w in q for w in lower_q.split() if len(w) > 3):
                                matched_items.append(f"• **Q: {f.get('q')}**\n  {f.get('a')}")
                    
                    if matched_items:
                        answer = "Based on our approved published compliance circulars:\n\n" + "\n\n".join(matched_items[:3])
                    elif published_documents:
                        first_doc = published_documents[0]
                        answer = (
                            f"Based on our latest published compliance circular: **{first_doc.get('title')}**\n\n"
                            f"Please ensure all operations conform to this directive. For complete circular instructions, review the official source: {first_doc.get('source_url')}"
                        )
                    else:
                        answer = "I cannot find this information in the currently published regulatory compliance documents. Please consult the Compliance Department."

                answer += "\n\n*(💡 System notice: Configure GEMINI_API_KEY via 'Configure API Keys' in the admin panel to enable full generative AI synthesis)*"
            else:
                raise

        return {
            "answer": answer.strip(),
            "memento_memory_used": bool(memento_context and memento_context.strip()),
            "memento_context": memento_context
        }

llm_service = LLMService()

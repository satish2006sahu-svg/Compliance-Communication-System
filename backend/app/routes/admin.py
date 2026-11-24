import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, RegulatoryDocument, Announcement, FAQ
from app.schemas import (
    ScrapeUrlRequest,
    RegulatoryDocumentResponse,
    AnnouncementResponse,
    AnnouncementUpdate,
    FAQItem
)
from app.security import require_admin
from app.services.firecrawl_service import firecrawl_service
from app.services.llm_service import llm_service

router = APIRouter(prefix="/admin", tags=["Administrator Module"])

@router.post("/scrape")
def scrape_regulatory_url(
    payload: ScrapeUrlRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Administrator endpoint:
    1. Validates regulatory website URL (including SSRF blocks)
    2. Scrapes website using actual Firecrawl API
    3. Saves extracted content to database
    4. Analyzes regulatory content using LLM
    """
    url = payload.url.strip()
    
    # 1. Scrape with Firecrawl
    scraped_data = firecrawl_service.scrape_url(url)
    
    # Check for duplicate document
    existing = db.query(RegulatoryDocument).filter(RegulatoryDocument.source_url == url).first()
    if existing:
        doc = existing
        doc.extracted_content = scraped_data["extracted_content"]
        doc.title = scraped_data["title"]
        doc.metadata_json = json.dumps(scraped_data["metadata"])
    else:
        doc = RegulatoryDocument(
            title=scraped_data["title"],
            source_url=url,
            extracted_content=scraped_data["extracted_content"],
            metadata_json=json.dumps(scraped_data["metadata"])
        )
        db.add(doc)
    
    db.commit()
    db.refresh(doc)
    
    # 2. Analyze with LLM
    analysis = llm_service.analyze_regulatory_document(
        content=doc.extracted_content,
        source_url=doc.source_url,
        title=doc.title
    )
    
    doc.summary = json.dumps(analysis)
    db.commit()
    db.refresh(doc)
    
    return {
        "message": "Regulatory update successfully scraped and analyzed.",
        "document": RegulatoryDocumentResponse.model_validate(doc),
        "analysis": analysis
    }

@router.post("/load-sample-seed")
def load_sample_seed(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Loads a clearly labelled sample regulatory record for initial UI testing,
    enabling full demonstration of the announcement editor, FAQ generator,
    approval lifecycle, and Memento persistent memory even before live API keys are added.
    """
    doc = db.query(RegulatoryDocument).filter(
        RegulatoryDocument.source_url == "https://www.rbi.org.in/scripts/BS_CircularIndexDisplay.aspx?Id=12345"
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Sample seed circular not found. Please restart backend to initialize seed.")

    analysis = {}
    if doc.summary:
        try:
            analysis = json.loads(doc.summary)
        except Exception:
            pass

    return {
        "message": "Sample seed regulatory circular loaded successfully for UI testing.",
        "is_sample_seed": True,
        "document": RegulatoryDocumentResponse.model_validate(doc),
        "analysis": analysis
    }

@router.post("/documents/{doc_id}/generate-announcement")
def generate_announcement(
    doc_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Generates a professional compliance announcement using the scraped regulatory content.
    Saves as 'draft' in the database.
    """
    doc = db.query(RegulatoryDocument).filter(RegulatoryDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Regulatory document not found")
        
    analysis = {}
    if doc.summary:
        try:
            analysis = json.loads(doc.summary)
        except Exception:
            pass
            
    announcement_data = llm_service.generate_announcement(
        content=doc.extracted_content,
        analysis=analysis,
        source_url=doc.source_url
    )
    
    # Create or update draft announcement
    announcement = db.query(Announcement).filter(
        Announcement.document_id == doc.id,
        Announcement.status.in_(["draft", "pending"])
    ).first()
    
    if not announcement:
        announcement = Announcement(
            document_id=doc.id,
            title=announcement_data.get("title", f"Compliance Directive: {doc.title}"),
            content=announcement_data.get("content", ""),
            status="draft"
        )
        db.add(announcement)
    else:
        announcement.title = announcement_data.get("title", announcement.title)
        announcement.content = announcement_data.get("content", announcement.content)
        
    db.commit()
    db.refresh(announcement)
    
    return {
        "message": "Compliance announcement generated successfully.",
        "announcement": AnnouncementResponse.model_validate(announcement)
    }

@router.post("/announcements/{announcement_id}/generate-faqs")
def generate_faqs(
    announcement_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Generates 5-10 useful FAQs for employees based on the regulatory content.
    """
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    doc = announcement.document
    analysis = {}
    if doc.summary:
        try:
            analysis = json.loads(doc.summary)
        except Exception:
            pass
            
    faqs_data = llm_service.generate_faqs(doc.extracted_content, analysis)
    
    # Remove older unapproved FAQs for this announcement
    db.query(FAQ).filter(FAQ.announcement_id == announcement.id).delete()
    
    created_faqs = []
    for item in faqs_data:
        q_text = item.get("question", "").strip()
        a_text = item.get("answer", "").strip()
        if q_text and a_text:
            faq_obj = FAQ(
                announcement_id=announcement.id,
                question=q_text,
                answer=a_text
            )
            db.add(faq_obj)
            created_faqs.append(faq_obj)
            
    db.commit()
    
    return {
        "message": f"Generated {len(created_faqs)} FAQs successfully.",
        "faqs": [{"id": f.id, "question": f.question, "answer": f.answer} for f in created_faqs]
    }

@router.put("/announcements/{announcement_id}")
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Allows the administrator to edit announcement title, markdown content, status, and FAQs.
    """
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    if payload.title is not None:
        announcement.title = payload.title
    if payload.content is not None:
        announcement.content = payload.content
    if payload.status is not None:
        valid_statuses = ["draft", "pending", "published"]
        if payload.status.lower() not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        announcement.status = payload.status.lower()
        if announcement.status == "published":
            announcement.published_at = datetime.utcnow()
            announcement.approved_by = current_admin.id

    # Update FAQs if provided
    if payload.faqs is not None:
        db.query(FAQ).filter(FAQ.announcement_id == announcement.id).delete()
        for f in payload.faqs:
            db.add(FAQ(
                announcement_id=announcement.id,
                question=f.question,
                answer=f.answer
            ))
            
    db.commit()
    db.refresh(announcement)
    
    return {
        "message": "Announcement updated successfully.",
        "announcement": AnnouncementResponse.model_validate(announcement)
    }

@router.post("/announcements/{announcement_id}/publish")
def approve_and_publish(
    announcement_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Approve and Publish action.
    Transitions status to 'published' and records the approver.
    Only approved & published announcements are visible to employees.
    """
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    announcement.status = "published"
    announcement.published_at = datetime.utcnow()
    announcement.approved_by = current_admin.id
    
    db.commit()
    db.refresh(announcement)
    
    return {
        "message": "Announcement successfully approved and published for all employees.",
        "announcement": AnnouncementResponse.model_validate(announcement)
    }

@router.get("/documents")
def list_regulatory_documents(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Lists all regulatory documents with their publication status.
    """
    docs = db.query(RegulatoryDocument).order_by(RegulatoryDocument.created_at.desc()).all()
    results = []
    for d in docs:
        ann = db.query(Announcement).filter(Announcement.document_id == d.id).order_by(Announcement.id.desc()).first()
        results.append({
            "id": d.id,
            "title": d.title,
            "source_url": d.source_url,
            "created_at": d.created_at,
            "announcement_id": ann.id if ann else None,
            "status": ann.status if ann else "pending_generation",
            "published_at": ann.published_at if ann else None,
            "has_faqs": len(ann.faqs) > 0 if ann else False
        })
    return results

@router.get("/documents/{doc_id}")
def get_document_detail(
    doc_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns full details for a regulatory document, its analysis, announcements, and FAQs.
    """
    doc = db.query(RegulatoryDocument).filter(RegulatoryDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Regulatory document not found")
        
    analysis = {}
    if doc.summary:
        try:
            analysis = json.loads(doc.summary)
        except Exception:
            pass
            
    announcements = db.query(Announcement).filter(Announcement.document_id == doc.id).all()
    
    return {
        "document": RegulatoryDocumentResponse.model_validate(doc),
        "analysis": analysis,
        "announcements": [AnnouncementResponse.model_validate(a) for a in announcements]
    }

@router.delete("/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Administrator endpoint:
    Deletes an announcement (draft, pending, or published) and its associated FAQs.
    If the announcement was published, it is immediately revoked from the Employee Portal.
    """
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db.delete(announcement)
    db.commit()
    
    return {
        "message": f"Announcement #{announcement_id} successfully deleted.",
        "deleted_id": announcement_id
    }

@router.delete("/documents/{doc_id}")
def delete_regulatory_document(
    doc_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Administrator endpoint:
    Deletes a processed regulatory document, including all of its generated announcements,
    drafts, and attached FAQs (via database cascade).
    """
    doc = db.query(RegulatoryDocument).filter(RegulatoryDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Regulatory document not found")
        
    doc_title = doc.title
    db.delete(doc)
    db.commit()
    
    return {
        "message": f"Regulatory document #{doc_id} ('{doc_title}') and all associated updates successfully deleted.",
        "deleted_id": doc_id
    }

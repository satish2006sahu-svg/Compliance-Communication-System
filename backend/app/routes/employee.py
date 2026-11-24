from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Announcement, FAQ, RegulatoryDocument
from app.schemas import (
    AnnouncementResponse,
    ChatQueryRequest,
    ChatQueryResponse
)
from app.security import require_employee
from app.services.llm_service import llm_service
from app.services.memento_service import memento_service

router = APIRouter(prefix="/employee", tags=["Employee Module"])

@router.get("/dashboard")
def get_employee_dashboard(
    current_employee: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """
    Employee dashboard endpoint:
    Displays ONLY approved and published announcements (`status == 'published'`).
    Drafts and pending announcements are strictly hidden.
    """
    published_announcements = db.query(Announcement).filter(
        Announcement.status == "published"
    ).order_by(Announcement.published_at.desc()).all()
    
    latest_announcement = published_announcements[0] if published_announcements else None
    
    # Extract all FAQs from published announcements
    published_faqs = []
    for ann in published_announcements:
        for f in ann.faqs:
            published_faqs.append({
                "id": f.id,
                "announcement_id": ann.id,
                "announcement_title": ann.title,
                "question": f.question,
                "answer": f.answer
            })
            
    return {
        "employee_name": current_employee.name,
        "employee_email": current_employee.email,
        "latest_announcement": AnnouncementResponse.model_validate(latest_announcement) if latest_announcement else None,
        "all_announcements": [AnnouncementResponse.model_validate(a) for a in published_announcements],
        "faqs": published_faqs,
        "total_published": len(published_announcements)
    }

@router.get("/announcements/{announcement_id}", response_model=AnnouncementResponse)
def get_published_announcement_detail(
    announcement_id: int,
    current_employee: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """
    Returns details of a published announcement.
    Rejects any request for unapproved or draft announcements with a 404.
    """
    announcement = db.query(Announcement).filter(
        Announcement.id == announcement_id,
        Announcement.status == "published"
    ).first()
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regulatory announcement not found or has not been published yet."
        )
    return AnnouncementResponse.model_validate(announcement)

@router.post("/chat", response_model=ChatQueryResponse)
def employee_compliance_chat(
    payload: ChatQueryRequest,
    current_employee: User = Depends(require_employee),
    db: Session = Depends(get_db)
):
    """
    AI Compliance Chatbot with Memento Persistent Memory:
    1. Receives employee question.
    2. Retrieves published regulatory documents and FAQs from database.
    3. Retrieves relevant conversational memories from Memento (isolated to current_employee.id).
    4. Sends question, published regulatory documents, and Memento context to LLM.
    5. Generates grounded answer with source citations.
    6. Persists conversation turn in Memento.
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    conversation_id = payload.conversation_id or "default"
    
    # 1. Retrieve ONLY published regulatory documents and FAQs
    published_records = db.query(Announcement).filter(
        Announcement.status == "published"
    ).all()
    
    docs_context = []
    sources = []
    for ann in published_records:
        doc = ann.document
        sources.append({
            "title": ann.title,
            "source_url": doc.source_url if doc else "#",
            "published_at": str(ann.published_at) if ann.published_at else ""
        })
        docs_context.append({
            "title": ann.title,
            "source_url": doc.source_url if doc else "",
            "announcement_content": ann.content,
            "faqs": [{"q": f.question, "a": f.answer} for f in ann.faqs]
        })

    # 2. Retrieve employee-specific persistent memories from Memento
    memento_memory = memento_service.recall_memories(
        employee_id=current_employee.id,
        query=query,
        conversation_id=conversation_id
    )

    # 3. Call LLM with published documents and Memento memory
    # Wrapped in try/except so chatbot always returns a helpful response
    try:
        llm_result = llm_service.answer_employee_query(
            query=query,
            published_documents=docs_context,
            memento_context=memento_memory,
            employee_name=current_employee.name
        )
        answer_text = llm_result["answer"]
        memento_used = llm_result["memento_memory_used"]
    except HTTPException as exc:
        # Graceful fallback: generate FAQ-based response without LLM
        lower_q = query.lower()
        answer_text = _fallback_chat_response(
            query=lower_q,
            published_documents=docs_context,
            memento_context=memento_memory,
            employee_name=current_employee.name
        )
        memento_used = bool(memento_memory and memento_memory.strip())
    except Exception as exc:
        answer_text = (
            "I'm sorry, I encountered an unexpected error processing your question. "
            "Please try again or contact the Compliance Department for assistance.\n\n"
            f"*(Technical: {str(exc)[:200]})*"
        )
        memento_used = False

    # 4. Save interaction into Memento persistent memory
    try:
        memento_service.save_conversation_turn(
            employee_id=current_employee.id,
            user_message=query,
            assistant_message=answer_text,
            conversation_id=conversation_id
        )
    except Exception:
        pass  # Never fail the response due to memory save failure

    return ChatQueryResponse(
        answer=answer_text,
        sources=sources,
        memento_memory_used=memento_used,
        memento_context=memento_memory if memento_memory else None,
        conversation_id=conversation_id
    )


def _fallback_chat_response(
    query: str,
    published_documents: list,
    memento_context: str,
    employee_name: str
) -> str:
    """
    Generates a helpful offline response grounded on published FAQs
    when no LLM API key is configured. Never invents regulatory facts.
    """
    # Handle memory/history queries
    if any(k in query for k in ("yesterday", "earlier", "previous", "last time", "we discuss", "we talk", "remind me", "what did")):
        if memento_context and memento_context.strip():
            return (
                f"According to your **Memento Persistent Memory** record, here is what we discussed earlier:\n\n"
                f"{memento_context}\n\n"
                f"Is there anything specific you would like to follow up on?\n\n"
                "*(💡 Configure GEMINI_API_KEY via '⚙️ Configure API Keys' in the navbar for full AI synthesis)*"
            )
        else:
            return (
                "I checked your private Memento persistent memory, but there is no previous conversation recorded yet. "
                "Start by asking me any regulatory compliance question!\n\n"
                "*(💡 Configure GEMINI_API_KEY via '⚙️ Configure API Keys' in the navbar for full AI synthesis)*"
            )

    # Try to match from published FAQs
    query_words = [w for w in query.split() if len(w) > 3]
    matched_faqs = []
    for doc in published_documents:
        for faq in doc.get("faqs", []):
            faq_text = (faq.get("q", "") + " " + faq.get("a", "")).lower()
            if any(w in faq_text for w in query_words):
                matched_faqs.append(f"**Q: {faq.get('q')}**\n{faq.get('a')}")

    if matched_faqs:
        response = f"Based on our published compliance circulars, here is what I found:\n\n"
        response += "\n\n".join(matched_faqs[:3])
        if published_documents:
            doc = published_documents[0]
            response += f"\n\n📋 **Source:** [{doc.get('title')}]({doc.get('source_url', '#')})"
        response += "\n\n*(💡 Configure GEMINI_API_KEY via '⚙️ Configure API Keys' in the navbar for full AI synthesis)*"
        return response

    # General summary from published docs
    if published_documents:
        first = published_documents[0]
        content_preview = (first.get("announcement_content") or "")[:600]
        return (
            f"Hello **{employee_name}**! Based on our latest published compliance directive:\n\n"
            f"**{first.get('title')}**\n\n"
            f"{content_preview}...\n\n"
            f"📋 **Source:** [{first.get('source_url', '#')}]({first.get('source_url', '#')})\n\n"
            "For more specific information, please review the full announcement or contact the Compliance Department.\n\n"
            "*(💡 Configure GEMINI_API_KEY via '⚙️ Configure API Keys' in the navbar for full AI synthesis)*"
        )

    return (
        "I cannot find this information in the currently published regulatory compliance documents. "
        "Please consult the Compliance Department for guidance.\n\n"
        "*(💡 Configure GEMINI_API_KEY via '⚙️ Configure API Keys' in the navbar for full AI synthesis)*"
    )


@router.get("/chat/history")
def get_chat_history(
    current_employee: User = Depends(require_employee)
):
    """
    Returns past conversation history loaded from the employee's isolated Memento database.
    """
    history = memento_service.get_conversation_history(employee_id=current_employee.id)
    return {"history": history, "employee_id": current_employee.id}

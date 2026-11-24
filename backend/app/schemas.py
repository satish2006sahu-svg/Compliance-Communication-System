from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, HttpUrl, Field

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

# Regulatory Document & Scraping Schemas
class ScrapeUrlRequest(BaseModel):
    url: str

class RegulatoryAnalysis(BaseModel):
    title: str = Field(description="Formal regulatory title or subject")
    regulator: str = Field(description="Name of regulatory body, e.g., RBI, SEBI, etc.")
    effective_date: str = Field(description="Effective date or important deadlines")
    main_regulatory_changes: List[str] = Field(description="List of main changes introduced")
    important_compliance_requirements: List[str] = Field(description="Mandatory compliance rules")
    key_instructions: List[str] = Field(description="Specific instructions for organizations")
    affected_departments: List[str] = Field(description="Target departments or roles affected")
    important_dates_and_deadlines: List[str] = Field(description="Key milestones and deadline dates")
    penalties_and_risks: str = Field(description="Explicitly mentioned penalties or risks, or 'Not specified in source'")
    required_actions: List[str] = Field(description="Step-by-step required compliance actions")
    employee_key_takeaways: List[str] = Field(description="Crucial takeaways employees must understand")

class RegulatoryDocumentResponse(BaseModel):
    id: int
    title: str
    source_url: str
    extracted_content: str
    summary: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# FAQ Schemas
class FAQItem(BaseModel):
    question: str
    answer: str

class FAQResponse(FAQItem):
    id: int
    announcement_id: int
    
    class Config:
        from_attributes = True

# Announcement Schemas
class AnnouncementCreate(BaseModel):
    document_id: int
    title: str
    content: str
    status: str = "draft"  # draft, pending, published
    faqs: Optional[List[FAQItem]] = []

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None  # 'draft', 'pending', 'published'
    faqs: Optional[List[FAQItem]] = None

class AnnouncementResponse(BaseModel):
    id: int
    document_id: int
    title: str
    content: str
    status: str
    created_at: datetime
    published_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    document: Optional[RegulatoryDocumentResponse] = None
    faqs: List[FAQResponse] = []
    
    class Config:
        from_attributes = True

# AI Chatbot Schemas
class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None

class ChatQueryRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = "default"

class ChatQueryResponse(BaseModel):
    answer: str
    sources: List[dict] = []
    memento_memory_used: bool = False
    memento_context: Optional[str] = None
    conversation_id: str

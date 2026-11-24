import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="employee")  # ONLY 'admin' or 'employee'
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    # Relationships
    approved_announcements = relationship("Announcement", back_populates="approver")
    conversations = relationship("ConversationMetadata", back_populates="employee")

class RegulatoryDocument(Base):
    __tablename__ = "regulatory_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    source_url = Column(String(1024), nullable=False, index=True)
    extracted_content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)  # AI Structured regulatory analysis
    metadata_json = Column(Text, nullable=True)  # Additional scraped metadata
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    # Relationships
    announcements = relationship("Announcement", back_populates="document", cascade="all, delete-orphan")

class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("regulatory_documents.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="draft")  # 'draft', 'pending', 'published'
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    document = relationship("RegulatoryDocument", back_populates="announcements")
    approver = relationship("User", back_populates="approved_announcements")
    faqs = relationship("FAQ", back_populates="announcement", cascade="all, delete-orphan")

class FAQ(Base):
    __tablename__ = "faqs"
    
    id = Column(Integer, primary_key=True, index=True)
    announcement_id = Column(Integer, ForeignKey("announcements.id"), nullable=False)
    question = Column(String(500), nullable=False)
    answer = Column(Text, nullable=False)
    
    # Relationships
    announcement = relationship("Announcement", back_populates="faqs")

class ConversationMetadata(Base):
    __tablename__ = "conversation_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    conversation_identifier = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    
    # Relationships
    employee = relationship("User", back_populates="conversations")

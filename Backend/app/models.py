from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

def generate_scan_id():
    return f"SCAN-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

class Rule(Base):
    __tablename__ = "rules"

    id = Column(String, primary_key=True, index=True)
    description = Column(String)
    is_active = Column(Boolean, default=True)
    config = Column(JSON, default=dict) # E.g., font size thresholds, regex patterns

class ProductScan(Base):
    __tablename__ = "product_scans"

    id = Column(String, primary_key=True, index=True, default=generate_scan_id)
    scan_mode = Column(String, index=True) # "live" or "ecommerce"
    timestamp = Column(DateTime, default=datetime.utcnow)
    compliance_score = Column(Float, default=0.0)
    status = Column(String, index=True) # "COMPLIANT" or "NON_COMPLIANT"
    
    # Image evidence hash or URL
    evidence_image_url = Column(String, nullable=True)
    evidence_hash = Column(String, nullable=True)

    extracted_fields = Column(JSON, default=dict) 
    exemption_status = Column(JSON, default=dict) 
    
    violations = relationship("Violation", back_populates="scan", cascade="all, delete-orphan")
    font_checks = relationship("FontCheck", back_populates="scan", cascade="all, delete-orphan")
    format_checks = relationship("FormatCheck", back_populates="scan", cascade="all, delete-orphan")

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("product_scans.id", ondelete="CASCADE"))
    rule_id = Column(String, index=True)
    severity = Column(String) # HIGH, MEDIUM, LOW
    description = Column(String)
    observed_value = Column(String, nullable=True)
    expected_value = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    
    scan = relationship("ProductScan", back_populates="violations")

class FontCheck(Base):
    __tablename__ = "font_checks"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("product_scans.id", ondelete="CASCADE"))
    field_name = Column(String)
    estimated_size_mm = Column(Float, nullable=True)
    minimum_required_mm = Column(Float, nullable=True)
    status = Column(String) # PASS, FAIL, UNABLE_TO_MEASURE
    
    scan = relationship("ProductScan", back_populates="font_checks")

class FormatCheck(Base):
    __tablename__ = "format_checks"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String, ForeignKey("product_scans.id", ondelete="CASCADE"))
    field_name = Column(String)
    status = Column(String) # VALID, INVALID
    reason = Column(String, nullable=True)
    
    scan = relationship("ProductScan", back_populates="format_checks")

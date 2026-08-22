import json
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.types import TypeDecorator, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

class JSONType(TypeDecorator):
    impl = Text

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return json.dumps({})

    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except Exception:
                return {}
        return {}

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
    rule_name = Column(String, nullable=True)
    act_reference = Column(String, nullable=True)
    category = Column(String, default="ALL")
    field = Column(String, nullable=True)
    check = Column(String, nullable=True)
    severity = Column(String, default="HIGH")
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    config = Column(JSONType)

class ProductScan(Base):
    __tablename__ = "product_scans"

    id = Column(String, primary_key=True, index=True, default=generate_scan_id)
    product_id = Column(String, index=True, nullable=True)
    platform = Column(String, index=True, nullable=True) # amazon | flipkart | meesho
    url = Column(String, nullable=True)
    title = Column(String, nullable=True)
    category = Column(String, index=True, nullable=True)
    seller_id = Column(String, index=True, nullable=True)
    scraped_at = Column(String, nullable=True)
    raw_html_sha256 = Column(String, nullable=True)
    images = Column(JSONType) # List of {url, sha256}
    extracted_fields = Column(JSONType)
    listing_price = Column(Float, nullable=True)
    compliance_score = Column(Float, default=0.0)
    exemption_status = Column(JSONType) # {exempted: bool, reason: str}
    status = Column(String, index=True, default="COMPLIANT") # COMPLIANT | NON_COMPLIANT
    timestamp = Column(DateTime, default=lambda: datetime.utcnow())

    violations = relationship("Violation", back_populates="scan", cascade="all, delete-orphan")

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    violation_id = Column(String, index=True, nullable=True)
    scan_id = Column(String, ForeignKey("product_scans.id", ondelete="CASCADE"))
    product_id = Column(String, nullable=True)
    rule_id = Column(String, index=True)
    clause = Column(String, nullable=True)
    issue = Column(String, nullable=True)
    severity = Column(String) # HIGH | MEDIUM | LOW
    message = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    bounding_box = Column(JSONType, nullable=True) # {ymin, xmin, ymax, xmax}
    detected_at = Column(String, nullable=True)

    scan = relationship("ProductScan", back_populates="violations")

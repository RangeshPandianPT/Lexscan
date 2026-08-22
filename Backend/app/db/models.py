from sqlalchemy import Column, String, Float, Integer, ForeignKey, JSON, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="officer")  # officer or admin


class Seller(Base):
    __tablename__ = "sellers"

    seller_id = Column(String, primary_key=True, index=True)
    seller_name = Column(String)
    platform = Column(String, index=True)
    total_listings_scanned = Column(Integer, default=0)
    total_violations = Column(Integer, default=0)
    compliance_rate = Column(Float, default=100.0)
    state = Column(String, index=True)

    products = relationship("Product", back_populates="seller")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(String, primary_key=True, index=True)
    platform = Column(String, index=True)
    url = Column(String)
    title = Column(String)
    category = Column(String, index=True)
    seller_id = Column(String, ForeignKey("sellers.seller_id"))
    scraped_at = Column(DateTime, default=datetime.utcnow)
    raw_html_sha256 = Column(String)
    images = Column(JSON)  # List of dicts {url, sha256}
    extracted_fields = Column(JSON)
    listing_price = Column(Float)
    compliance_score = Column(Float)
    exemption_status = Column(JSON)

    seller = relationship("Seller", back_populates="products")
    violations = relationship("Violation", back_populates="product")


class Rule(Base):
    __tablename__ = "rules"

    rule_id = Column(String, primary_key=True, index=True)
    rule_name = Column(String)
    act_reference = Column(String)
    category = Column(String)
    field = Column(String)
    check = Column(String)
    severity = Column(String)
    active = Column(Boolean, default=True)

    violations = relationship("Violation", back_populates="rule")


class Violation(Base):
    __tablename__ = "violations"

    violation_id = Column(String, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.product_id"))
    rule_id = Column(String, ForeignKey("rules.rule_id"))
    clause = Column(String)
    issue = Column(String, index=True)
    severity = Column(String, index=True)
    message = Column(Text)
    confidence = Column(Float)
    bounding_box = Column(JSON)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)

    product = relationship("Product", back_populates="violations")
    rule = relationship("Rule", back_populates="violations")

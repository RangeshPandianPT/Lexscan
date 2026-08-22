from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool

    model_config = ConfigDict(from_attributes=True)

class RuleBase(BaseModel):
    rule_name: Optional[str] = None
    act_reference: Optional[str] = None
    category: str = "ALL"
    field: Optional[str] = None
    check: Optional[str] = None
    severity: str = "HIGH"
    description: Optional[str] = None
    is_active: bool = True
    config: Dict[str, Any] = {}

class RuleResponse(RuleBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class ViolationBase(BaseModel):
    violation_id: Optional[str] = None
    product_id: Optional[str] = None
    rule_id: str
    clause: Optional[str] = None
    issue: Optional[str] = None
    severity: str # HIGH | MEDIUM | LOW
    message: Optional[str] = None
    confidence: Optional[float] = None
    bounding_box: Optional[Dict[str, Any]] = None # {ymin, xmin, ymax, xmax}
    detected_at: Optional[str] = None

class ViolationCreate(ViolationBase):
    pass

class ViolationResponse(ViolationBase):
    id: int
    scan_id: str
    
    model_config = ConfigDict(from_attributes=True)

class ProductScanBase(BaseModel):
    product_id: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    seller_id: Optional[str] = None
    scraped_at: Optional[str] = None
    raw_html_sha256: Optional[str] = None
    images: List[Dict[str, Any]] = []
    extracted_fields: Dict[str, Any] = {}
    listing_price: Optional[float] = None
    compliance_score: float = 0.0
    exemption_status: Dict[str, Any] = {}
    status: str = "COMPLIANT"

class ProductScanCreate(ProductScanBase):
    violations: List[ViolationCreate] = []

class ProductScanResponse(ProductScanBase):
    id: str
    timestamp: datetime
    violations: List[ViolationResponse] = []

    model_config = ConfigDict(from_attributes=True)

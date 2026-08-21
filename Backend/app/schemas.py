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
    description: str
    is_active: bool = True
    config: Dict[str, Any] = {}

class RuleResponse(RuleBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class ViolationBase(BaseModel):
    rule_id: str
    severity: str
    description: str
    observed_value: Optional[str] = None
    expected_value: Optional[str] = None
    confidence: Optional[float] = None

class ViolationResponse(ViolationBase):
    id: int
    scan_id: str
    
    model_config = ConfigDict(from_attributes=True)

class FontCheckBase(BaseModel):
    field_name: str
    estimated_size_mm: Optional[float] = None
    minimum_required_mm: Optional[float] = None
    status: str

class FontCheckResponse(FontCheckBase):
    id: int
    scan_id: str
    
    model_config = ConfigDict(from_attributes=True)

class FormatCheckBase(BaseModel):
    field_name: str
    status: str
    reason: Optional[str] = None

class FormatCheckResponse(FormatCheckBase):
    id: int
    scan_id: str

    model_config = ConfigDict(from_attributes=True)

class ProductScanBase(BaseModel):
    scan_mode: str
    compliance_score: float
    status: str
    evidence_image_url: Optional[str] = None
    evidence_hash: Optional[str] = None
    extracted_fields: Dict[str, Any] = {}
    exemption_status: Dict[str, Any] = {}

class ProductScanCreate(ProductScanBase):
    violations: List[ViolationBase] = []
    font_checks: List[FontCheckBase] = []
    format_checks: List[FormatCheckBase] = []

class ProductScanResponse(ProductScanBase):
    id: str
    timestamp: datetime
    violations: List[ViolationResponse]
    font_checks: List[FontCheckResponse]
    format_checks: List[FormatCheckResponse]

    model_config = ConfigDict(from_attributes=True)

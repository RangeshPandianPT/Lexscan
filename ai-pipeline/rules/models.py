from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any, List


@dataclass
class BoundingBox:
    ymin: int
    xmin: int
    ymax: int
    xmax: int

    def to_dict(self) -> Dict[str, int]:
        return asdict(self)


@dataclass
class ExtractedField:
    value: Optional[Any] = None
    currency: Optional[str] = None
    confidence: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        res = {"value": self.value, "confidence": round(self.confidence, 2)}
        if self.currency is not None:
            res["currency"] = self.currency
        return res


@dataclass
class ExtractedFields:
    mrp: ExtractedField = field(default_factory=lambda: ExtractedField(currency="INR"))  # Only MRP carries currency
    net_quantity: ExtractedField = field(default_factory=lambda: ExtractedField())
    manufacturer: ExtractedField = field(default_factory=ExtractedField)
    country_of_origin: ExtractedField = field(default_factory=ExtractedField)
    consumer_care: ExtractedField = field(default_factory=ExtractedField)
    mfg_or_import_date: ExtractedField = field(default_factory=ExtractedField)

    def to_dict(self) -> Dict[str, Dict[str, Any]]:
        return {
            "mrp": self.mrp.to_dict(),
            "net_quantity": self.net_quantity.to_dict(),
            "manufacturer": self.manufacturer.to_dict(),
            "country_of_origin": self.country_of_origin.to_dict(),
            "consumer_care": self.consumer_care.to_dict(),
            "mfg_or_import_date": self.mfg_or_import_date.to_dict(),
        }


@dataclass
class ExemptionStatus:
    exempted: bool = False
    reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {"exempted": self.exempted, "reason": self.reason}


@dataclass
class Violation:
    violation_id: str
    product_id: str
    rule_id: str
    clause: str
    issue: str
    severity: str  # HIGH | MEDIUM | LOW
    message: str
    confidence: float
    detected_at: str
    bounding_box: Optional[BoundingBox] = None

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        if self.bounding_box:
            data["bounding_box"] = self.bounding_box.to_dict()
        return data


@dataclass
class Rule:
    rule_id: str
    rule_name: str
    act_reference: str
    category: str
    field: str
    check: str  # not_null | not_null_and_positive | price_not_above_mrp
    severity: str
    active: bool
    issue_type: str
    message_template: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

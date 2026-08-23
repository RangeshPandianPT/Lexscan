import sys
import json
sys.path.append('.')
from app.schemas import ProductScanCreate
data = {
  "product_id": "DEMO-LIVE-999",
  "platform": "amazon",
  "url": "https://amazon.in/dp/DEMO-LIVE",
  "title": "Live Judge Demo - Sugar Free Biscuits",
  "category": "packaged_food",
  "listing_price": 450.0,
  "compliance_score": 15.0,
  "status": "NON_COMPLIANT",
  "extracted_fields": {
     "net_quantity": {"value": None, "confidence": 0}
  },
  "violations": [{
    "violation_id": "VIO-DEMO-001",
    "rule_id": "LM-R06-NQ-02",
    "issue": "MISSING_NET_QUANTITY",
    "severity": "HIGH",
    "message": "The net quantity is completely missing from the product label.",
    "confidence": 0.98,
    "bounding_box": {"ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0}
  }]
}
try:
    obj = ProductScanCreate(**data)
    print("SUCCESS")
except Exception as e:
    print(e)

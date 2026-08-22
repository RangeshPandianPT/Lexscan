import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rules.models import (
    ExtractedField,
    ExtractedFields,
    ExemptionStatus,
)
from rules.engine import RuleEngine
from rules.exemptions import Rule26Exemptions


class TestRuleEngine(unittest.TestCase):
    def setUp(self):
        self.engine = RuleEngine()
        self.exemption_checker = Rule26Exemptions()

    def test_all_fields_present_full_score(self):
        fields = ExtractedFields(
            mrp=ExtractedField(value=399.0, raw_text="MRP ₹399 (inclusive of all taxes)", estimated_font_mm=5.0, confidence=0.9),
            net_quantity=ExtractedField(value="400 g", raw_text="Net Qty: 400 g", confidence=0.95),
            manufacturer=ExtractedField(value="XYZ Pvt Ltd", raw_text="Mfg by XYZ Pvt Ltd, Mumbai - 400001", confidence=0.9),
            country_of_origin=ExtractedField(value="India", raw_text="Country of Origin: India", confidence=0.85),
            consumer_care=ExtractedField(value="1800-123-456", raw_text="Care: 1800-123-456", confidence=0.8),
            mfg_or_import_date=ExtractedField(value="Jan 2026", raw_text="Mfg 01/2026", confidence=0.8),
        )
        violations, score = self.engine.evaluate(
            product_id="TEST-001",
            extracted_fields=fields,
            listing_price=349.0,
            package_area_cm2=200.0,
        )
        self.assertEqual(len(violations), 0)
        self.assertEqual(score, 100)

    def test_format_compliance_violations(self):
        fields = ExtractedFields(
            mrp=ExtractedField(value=399.0, raw_text="MRP ₹399", estimated_font_mm=5.0, confidence=0.9), # missing "inclusive of all taxes"
            net_quantity=ExtractedField(value="500 gm", raw_text="500 gm", confidence=0.95), # non-standard unit 'gm'
            manufacturer=ExtractedField(value="XYZ Pvt Ltd", raw_text="XYZ Pvt Ltd", confidence=0.9),
            country_of_origin=ExtractedField(value="India", raw_text="India", confidence=0.85),
            consumer_care=ExtractedField(value="1800-123-456", raw_text="Care: 1800-123-456", confidence=0.8),
            mfg_or_import_date=ExtractedField(value="2026", raw_text="2026", confidence=0.8), # missing Mfg prefix & month/year format
        )
        violations, score = self.engine.evaluate(
            product_id="TEST-FMT-001",
            extracted_fields=fields,
            listing_price=349.0,
        )
        issues = [v.issue for v in violations]
        self.assertIn("INVALID_MRP_FORMAT", issues)
        self.assertIn("INVALID_NET_QTY_UNITS", issues)
        self.assertIn("INVALID_MFG_DATE_FORMAT", issues)

    def test_font_size_compliance(self):
        # On a 600 cm² package, minimum font size is 4mm.
        # Providing font height of 1.5mm should trigger a SUB_MINIMUM_FONT_SIZE violation.
        fields = ExtractedFields(
            mrp=ExtractedField(value=399.0, raw_text="MRP ₹399 (inclusive of all taxes)", estimated_font_mm=1.5, confidence=0.9),
            net_quantity=ExtractedField(value="400 g", raw_text="Net Qty: 400 g", confidence=0.95),
            manufacturer=ExtractedField(value="XYZ Pvt Ltd", raw_text="Mfg by XYZ Pvt Ltd", confidence=0.9),
            country_of_origin=ExtractedField(value="India", raw_text="India", confidence=0.85),
            consumer_care=ExtractedField(value="1800-123-456", raw_text="Care: 1800-123-456", confidence=0.8),
            mfg_or_import_date=ExtractedField(value="Jan 2026", raw_text="Mfg 01/2026", confidence=0.8),
        )
        violations, score = self.engine.evaluate(
            product_id="TEST-FONT-001",
            extracted_fields=fields,
            listing_price=349.0,
            package_area_cm2=600.0,
        )
        issues = [v.issue for v in violations]
        self.assertIn("SUB_MINIMUM_FONT_SIZE", issues)

    def test_price_above_mrp_violation(self):
        fields = ExtractedFields(
            mrp=ExtractedField(value=299.0, raw_text="MRP ₹299 (inclusive of all taxes)", confidence=0.9),
            net_quantity=ExtractedField(value="400 ml", raw_text="400 ml", confidence=0.95),
            manufacturer=ExtractedField(value="XYZ Pvt Ltd", raw_text="XYZ Pvt Ltd", confidence=0.9),
            country_of_origin=ExtractedField(value="India", raw_text="India", confidence=0.85),
            consumer_care=ExtractedField(value="1800-123-456", raw_text="Care: 1800-123-456", confidence=0.8),
            mfg_or_import_date=ExtractedField(value="Jan 2026", raw_text="Mfg 01/2026", confidence=0.8),
        )
        violations, score = self.engine.evaluate(
            product_id="TEST-002",
            extracted_fields=fields,
            listing_price=399.0,  # Price (399) > MRP (299)
        )
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0].issue, "PRICE_ABOVE_MRP")
        self.assertEqual(violations[0].severity, "HIGH")
        self.assertEqual(score, 80)  # 100 - 20 (HIGH)

    def test_missing_mandatory_fields(self):
        fields = ExtractedFields(
            mrp=ExtractedField(value=None),
            net_quantity=ExtractedField(value=None),
            manufacturer=ExtractedField(value=None),
            country_of_origin=ExtractedField(value=None),
            consumer_care=ExtractedField(value=None),
            mfg_or_import_date=ExtractedField(value=None),
        )
        violations, score = self.engine.evaluate(
            product_id="TEST-003",
            extracted_fields=fields,
            listing_price=100.0,
        )
        # 4 HIGH (MRP missing, Net Qty missing, Mfg missing) + 3 MEDIUM (Origin missing, Consumer care missing, Date missing)
        # Note: MRP missing means PRICE_ABOVE_MRP doesn't trigger. Total rules triggered: 6 missing field rules.
        self.assertGreaterEqual(len(violations), 6)
        self.assertEqual(score, 10)  # 100 - (3x20 HIGH + 3x10 MEDIUM) = 90 penalty -> 10 score

    def test_rule26_small_package_exemption(self):
        exemption = self.exemption_checker.check_exemption(
            product_title="Sachet Shampoo 5g",
            net_quantity_str="5g",
        )
        self.assertTrue(exemption.exempted)
        self.assertIn("Rule 26(a)", exemption.reason)

        fields = ExtractedFields()  # All empty
        violations, score = self.engine.evaluate(
            product_id="TEST-004",
            extracted_fields=fields,
            listing_price=5.0,
            exemption_status=exemption,
        )
        self.assertEqual(len(violations), 0)
        self.assertEqual(score, 100)

    def test_rule26_fast_food_exemption(self):
        exemption = self.exemption_checker.check_exemption(
            product_title="Freshly Baked Cake from Restaurant",
        )
        self.assertTrue(exemption.exempted)
        self.assertIn("Rule 26(b)", exemption.reason)

    def test_rule26_bulk_package_exemption(self):
        exemption = self.exemption_checker.check_exemption(
            product_title="Commercial Flour Bag 30kg",
            net_quantity_str="30kg",
        )
        self.assertTrue(exemption.exempted)
        self.assertIn("Bulk package", exemption.reason)


if __name__ == "__main__":
    unittest.main()

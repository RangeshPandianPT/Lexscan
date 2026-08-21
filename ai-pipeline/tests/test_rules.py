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
            mrp=ExtractedField(value=399.0, confidence=0.9),
            net_quantity=ExtractedField(value="400 ml", confidence=0.95),
            manufacturer=ExtractedField(value="XYZ Pvt Ltd", confidence=0.9),
            country_of_origin=ExtractedField(value="India", confidence=0.85),
            consumer_care=ExtractedField(value="1800-123-456", confidence=0.8),
            mfg_or_import_date=ExtractedField(value="Jan 2026", confidence=0.8),
        )
        violations, score = self.engine.evaluate(
            product_id="TEST-001",
            extracted_fields=fields,
            listing_price=349.0,
        )
        self.assertEqual(len(violations), 0)
        self.assertEqual(score, 100)

    def test_price_above_mrp_violation(self):
        fields = ExtractedFields(
            mrp=ExtractedField(value=299.0, confidence=0.9),
            net_quantity=ExtractedField(value="400 ml", confidence=0.95),
            manufacturer=ExtractedField(value="XYZ Pvt Ltd", confidence=0.9),
            country_of_origin=ExtractedField(value="India", confidence=0.85),
            consumer_care=ExtractedField(value="1800-123-456", confidence=0.8),
            mfg_or_import_date=ExtractedField(value="Jan 2026", confidence=0.8),
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

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from nlp.text_parser import TextParser
from nlp.extractor import FieldExtractor


class TestNLPComponent(unittest.TestCase):
    def setUp(self):
        self.text_parser = TextParser()
        self.extractor = FieldExtractor()

    def test_text_parser_net_quantity_extraction(self):
        fields1 = self.text_parser.parse("Mamaearth Onion Shampoo - 400 ml")
        self.assertEqual(fields1.net_quantity.value, "400 ml")
        self.assertGreater(fields1.net_quantity.confidence, 0.5)

        fields2 = self.text_parser.parse("Amul Pure Ghee 1 L Tetrapack")
        self.assertEqual(fields2.net_quantity.value, "1 L")

        fields3 = self.text_parser.parse("Diapers Medium Size (M) 76 Count")
        self.assertEqual(fields3.net_quantity.value, "76 Count")

    def test_text_parser_mrp_extraction(self):
        fields = self.text_parser.parse(
            "Tata Sampann Toor Dal", "Unpolished pulses. MRP: Rs. 185. Inclusive of all taxes."
        )
        self.assertEqual(fields.mrp.value, 185.0)

    def test_ocr_field_extractor_pass1(self):
        ocr_sample = (
            "MANUFACTURED BY: HONASA CONSUMER PVT LTD\n"
            "NET QUANTITY: 400ml\n"
            "M.R.P. : Rs. 349.00 (INCL. OF ALL TAXES)\n"
            "COUNTRY OF ORIGIN: INDIA\n"
            "MFG DATE: 01/2026\n"
            "CUSTOMER CARE: 1800-123-456, CARE@MAMAEARTH.IN"
        )
        fields = self.extractor.extract_all_fields(
            ocr_text=ocr_sample,
            ocr_confidence=0.90,
            title="Mamaearth Shampoo",
        )
        self.assertEqual(fields.mrp.value, 349.0)
        self.assertEqual(fields.net_quantity.value, "400ml")
        self.assertIn("HONASA", fields.manufacturer.value.upper())
        self.assertEqual(fields.country_of_origin.value.upper(), "INDIA")
        self.assertEqual(fields.mfg_or_import_date.value, "01/2026")
        self.assertIn("1800-123-456", fields.consumer_care.value)

    def test_two_pass_fallback(self):
        # OCR is missing net_quantity, but title has it
        ocr_sample = "MANUFACTURED BY: HONASA CONSUMER PVT LTD\nMRP: ₹349"
        fields = self.extractor.extract_all_fields(
            ocr_text=ocr_sample,
            ocr_confidence=0.85,
            title="Mamaearth Onion Shampoo 400 ml",
        )
        self.assertEqual(fields.mrp.value, 349.0)  # From OCR
        self.assertEqual(fields.net_quantity.value, "400 ml")  # From TextParser fallback
        self.assertIn("HONASA", fields.manufacturer.value.upper())  # From OCR


if __name__ == "__main__":
    unittest.main()

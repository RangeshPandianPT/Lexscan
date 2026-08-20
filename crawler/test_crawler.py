#!/usr/bin/env python3
"""
Unit and Integration Tests for LexScan Crawler (Member A)
"""

import os
import sys
import json
import shutil
import unittest

crawler_dir = os.path.dirname(os.path.abspath(__file__))
if crawler_dir not in sys.path:
    sys.path.insert(0, crawler_dir)

project_root = os.path.abspath(os.path.join(crawler_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from scrapers.base import RawProduct
from utils.hashing import sha256_of_html, sha256_of_bytes, sha256_of_file
from utils.normalizer import generate_product_id, infer_category, normalize_and_save, raw_product_from_dict
from kaggle_fallback.ingest import ingest_from_catalog, BUILTIN_SEED_CATALOG
from validate import validate_file, find_schema


class TestCrawlerUtils(unittest.TestCase):
    def setUp(self):
        self.test_output_dir = os.path.join(crawler_dir, "test_output")
        os.makedirs(self.test_output_dir, exist_ok=True)

    def tearDown(self):
        if os.path.exists(self.test_output_dir):
            shutil.rmtree(self.test_output_dir)

    def test_hashing_functions(self):
        html_str = "<html><body><h1>Test</h1></body></html>"
        digest1 = sha256_of_html(html_str)
        self.assertEqual(len(digest1), 64)
        self.assertEqual(digest1, sha256_of_bytes(html_str.encode("utf-8")))

        # Test file hashing
        test_file = os.path.join(self.test_output_dir, "test.txt")
        with open(test_file, "w", encoding="utf-8") as f:
            f.write("Forensic audit trail test data")
        file_digest = sha256_of_file(test_file)
        self.assertEqual(len(file_digest), 64)

    def test_product_id_generation(self):
        amz_url = "https://www.amazon.in/dp/B08N5WRWNW"
        self.assertEqual(generate_product_id("amazon", amz_url), "AMZ-IN-B08N5WRWNW")

        flk_url = "https://www.flipkart.com/amul-ghee/p/itm123?pid=GHEF9XYZ12345678"
        self.assertEqual(generate_product_id("flipkart", flk_url), "FLK-IN-GHEF9XYZ12345678")

        msh_url = "https://www.meesho.com/p/3VXYZ7"
        self.assertEqual(generate_product_id("meesho", msh_url), "MSH-IN-3VXYZ7")

    def test_category_inference(self):
        self.assertEqual(infer_category("Pure Cow Ghee 1L"), "packaged_food")
        self.assertEqual(infer_category("Hydrating Face Wash with Vitamin C"), "cosmetics")
        self.assertEqual(infer_category("Baby Wet Wipes with Aloe Vera"), "baby_care")
        self.assertEqual(infer_category("Bluetooth Wireless Earbuds with Mic"), "electronics")

    def test_raw_product_serialization(self):
        prod = RawProduct(
            product_id="AMZ-IN-B08N5WRWNW",
            platform="amazon",
            url="https://www.amazon.in/dp/B08N5WRWNW",
            title="Mamaearth Shampoo 400ml",
            description="Anti hair fall shampoo",
            seller_id="AMZ-SELLER-HONASA",
            listing_price=349.0,
            scraped_at="2026-08-21T05:00:00+05:30",
            raw_html_sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            images=[{"url": "https://example.com/img.jpg", "sha256": "abc123" * 10 + "1234"}],
            category="cosmetics"
        )
        saved_file = normalize_and_save(prod, output_dir=self.test_output_dir)
        self.assertTrue(os.path.exists(saved_file))

        # Test deserialization
        with open(saved_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        reconstructed = raw_product_from_dict(data)
        self.assertEqual(reconstructed.product_id, prod.product_id)
        self.assertEqual(reconstructed.listing_price, 349.0)

    def test_catalog_ingestion_and_schema_validation(self):
        saved = ingest_from_catalog(BUILTIN_SEED_CATALOG, output_dir=self.test_output_dir)
        self.assertGreaterEqual(len(saved), 5)

        schema = find_schema()
        for path in saved:
            self.assertTrue(validate_file(path, schema=schema))


if __name__ == "__main__":
    unittest.main()

import unittest
import sys
import os
import json
import shutil

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipeline import LexScanPipeline
from validator import ProductScanValidator


class TestPipelineE2E(unittest.TestCase):
    def setUp(self):
        self.pipeline = LexScanPipeline()
        self.validator = ProductScanValidator()
        self.test_output_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "test_output")
        )
        os.makedirs(self.test_output_dir, exist_ok=True)
        self.samples_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "crawler", "output", "samples")
        )

    def tearDown(self):
        if os.path.exists(self.test_output_dir):
            shutil.rmtree(self.test_output_dir)

    def test_single_sample_processing(self):
        sample_path = os.path.join(self.samples_dir, "AMZ-IN-B08N5WRWNW.json")
        if not os.path.exists(sample_path):
            self.skipTest(f"Sample file not found at {sample_path}")

        output_path = self.pipeline.process_file(
            sample_path, output_dir=self.test_output_dir
        )
        self.assertTrue(os.path.exists(output_path))

        with open(output_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data["product_id"], "AMZ-IN-B08N5WRWNW")
        self.assertIn("compliance_score", data)
        self.assertGreaterEqual(data["compliance_score"], 0)
        self.assertLessEqual(data["compliance_score"], 100)
        self.assertIn("extracted_fields", data)
        self.assertEqual(data["extracted_fields"]["net_quantity"]["value"], "400 ml")

        # Validate schema
        is_valid, errors = self.validator.validate(data)
        self.assertTrue(is_valid, f"Schema validation errors: {errors}")

    def test_batch_sample_processing(self):
        if not os.path.exists(self.samples_dir):
            self.skipTest(f"Samples dir not found at {self.samples_dir}")

        output_paths = self.pipeline.process_batch(
            self.samples_dir, output_dir=self.test_output_dir
        )
        self.assertGreaterEqual(len(output_paths), 5)

        for path in output_paths:
            is_valid, errors = self.validator.validate_file(path)
            self.assertTrue(is_valid, f"Validation failed for {path}: {errors}")


if __name__ == "__main__":
    unittest.main()

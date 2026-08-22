import unittest
import sys
import os
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ocr.font_size_estimator import FontSizeEstimator

class TestFontSizeEstimator(unittest.TestCase):
    def test_minimum_required_font_size(self):
        self.assertEqual(FontSizeEstimator.get_minimum_required_font_size(50.0), 1.0)
        self.assertEqual(FontSizeEstimator.get_minimum_required_font_size(250.0), 2.0)
        self.assertEqual(FontSizeEstimator.get_minimum_required_font_size(1000.0), 4.0)
        self.assertEqual(FontSizeEstimator.get_minimum_required_font_size(3000.0), 6.0)

    def test_calculate_px_to_mm_ratio(self):
        # Image height = 1000 px, known package height = 200 mm -> ratio = 0.2 mm/px
        ratio = FontSizeEstimator.calculate_px_to_mm_ratio((1000, 800), known_package_height_mm=200.0)
        self.assertAlmostEqual(ratio, 0.2)

        # 20 px character with 0.2 mm/px ratio -> 4.0 mm
        font_mm = FontSizeEstimator.estimate_font_size_mm(20, ratio)
        self.assertAlmostEqual(font_mm, 4.0)

if __name__ == "__main__":
    unittest.main()

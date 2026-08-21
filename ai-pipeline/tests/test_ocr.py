import unittest
import numpy as np
import cv2
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ocr.preprocessor import ImagePreprocessor
from ocr.label_detector import LabelDetector
from ocr.reader import TieredOCRReader


class TestOCRComponent(unittest.TestCase):
    def setUp(self):
        self.preprocessor = ImagePreprocessor()
        self.detector = LabelDetector()
        self.reader = TieredOCRReader()

        # Create a synthetic image with printed text block
        self.synthetic_img = np.ones((400, 600, 3), dtype=np.uint8) * 255
        # Draw a dark label panel
        cv2.rectangle(self.synthetic_img, (50, 50), (550, 350), (220, 220, 220), -1)
        # Add synthetic text
        cv2.putText(
            self.synthetic_img,
            "MRP: Rs. 499.00",
            (80, 120),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 0, 0),
            2,
        )
        cv2.putText(
            self.synthetic_img,
            "NET QTY: 500 ml",
            (80, 180),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 0, 0),
            2,
        )
        cv2.putText(
            self.synthetic_img,
            "MFG BY: XYZ PVT LTD",
            (80, 240),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 0, 0),
            2,
        )

    def test_preprocessor_shape(self):
        processed = self.preprocessor.preprocess(self.synthetic_img)
        self.assertIsInstance(processed, np.ndarray)
        self.assertEqual(len(processed.shape), 3)

    def test_label_detector_regions(self):
        regions = self.detector.detect_label_regions(self.synthetic_img)
        self.assertGreaterEqual(len(regions), 1)
        self.assertIsNotNone(regions[0].cropped_image)
        self.assertGreater(regions[0].bounding_box.ymax, regions[0].bounding_box.ymin)

    def test_ocr_reader_fallback(self):
        full_text, conf = self.reader.read_image_full_text(self.synthetic_img)
        # Note: Synthetic OpenCV putText might or might not be recognized by OCR without trained fonts,
        # but the method should complete safely returning (str, float).
        self.assertIsInstance(full_text, str)
        self.assertIsInstance(conf, float)


if __name__ == "__main__":
    unittest.main()

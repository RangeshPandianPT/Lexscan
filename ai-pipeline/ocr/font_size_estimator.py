import logging
import cv2
import numpy as np
from typing import Optional, Tuple, List

logger = logging.getLogger("ai_pipeline.ocr.font_size")

class FontSizeEstimator:
    """
    Estimates real-world character/numeral font size (in mm) from image bounding boxes
    and package area / reference dimensions under Legal Metrology Rules, 2011.
    """

    MIN_FONT_SIZE_TABLE = [
        (100.0, 1.0),      # Up to 100 cm² -> 1 mm
        (500.0, 2.0),      # 100 to 500 cm² -> 2 mm
        (2500.0, 4.0),     # 500 to 2500 cm² -> 4 mm
        (float('inf'), 6.0) # Above 2500 cm² -> 6 mm
    ]

    @staticmethod
    def get_minimum_required_font_size(package_area_cm2: float) -> float:
        """
        Returns the mandatory minimum font height in mm for a given package surface area (cm²).
        """
        for max_area, min_height in FontSizeEstimator.MIN_FONT_SIZE_TABLE:
            if package_area_cm2 <= max_area:
                return min_height
        return 6.0

    @staticmethod
    def calculate_px_to_mm_ratio(
        image_shape: Tuple[int, int],
        known_package_width_mm: Optional[float] = None,
        known_package_height_mm: Optional[float] = None,
        package_area_cm2: Optional[float] = None,
    ) -> float:
        """
        Calculates pixel to mm conversion ratio (mm per pixel).
        If explicit dimensions are provided, uses them.
        Otherwise, estimates ratio assuming the image represents the full label/package area.
        """
        img_h, img_w = image_shape[:2]

        if known_package_height_mm and known_package_height_mm > 0:
            return known_package_height_mm / float(img_h)
        elif known_package_width_mm and known_package_width_mm > 0:
            return known_package_width_mm / float(img_w)
        elif package_area_cm2 and package_area_cm2 > 0:
            # Assume ~4:3 or ~1:1 aspect ratio package label filling frame
            # Area in mm² = package_area_cm2 * 100
            area_mm2 = package_area_cm2 * 100.0
            image_pixel_area = img_h * img_w
            # (mm/px)^2 = area_mm2 / image_pixel_area
            return (area_mm2 / float(image_pixel_area)) ** 0.5
        
        # Default fallback assumption: 1080p label image ~ 150mm height
        return 150.0 / float(img_h)

    @staticmethod
    def estimate_font_size_mm(
        pixel_height: int,
        mm_per_pixel: float
    ) -> float:
        """
        Converts character pixel height to estimated height in millimeters.
        """
        return pixel_height * mm_per_pixel

    @staticmethod
    def refine_character_height_with_contours(
        image_crop: np.ndarray
    ) -> int:
        """
        Uses OpenCV contour analysis on a text region crop to find individual character heights.
        Returns the median character pixel height.
        """
        if image_crop is None or image_crop.size == 0:
            return 0
        
        try:
            if len(image_crop.shape) == 3:
                gray = cv2.cvtColor(image_crop, cv2.COLOR_BGR2GRAY)
            else:
                gray = image_crop

            # Binarization
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            char_heights = []
            crop_h, crop_w = image_crop.shape[:2]
            for c in contours:
                x, y, w, h = cv2.boundingRect(c)
                # Filter out noise contours and full-line bounding boxes
                if 0.1 * crop_h <= h <= 0.95 * crop_h and w > 2:
                    char_heights.append(h)

            if char_heights:
                return int(np.median(char_heights))
            return crop_h
        except Exception as e:
            logger.warning(f"Contour analysis failed: {e}")
            return image_crop.shape[0] if image_crop is not None else 0

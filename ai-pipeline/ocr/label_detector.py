import cv2
import numpy as np
from dataclasses import dataclass
from typing import List, Union, Optional
import os

try:
    from rules.models import BoundingBox
except (ImportError, ValueError):
    from ..rules.models import BoundingBox


@dataclass
class LabelRegion:
    cropped_image: np.ndarray
    bounding_box: BoundingBox
    area: float


class LabelDetector:
    """
    OpenCV contour-based product label region detector and cropper.
    Locates rectangular printed label panels on product packaging.
    """

    def detect_label_regions(
        self, image_input: Union[str, np.ndarray], max_regions: int = 3
    ) -> List[LabelRegion]:
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                return []
            img = cv2.imread(image_input)
            if img is None:
                return []
        else:
            img = image_input

        h, w = img.shape[:2]
        total_area = float(h * w)

        # Grayscale + GaussianBlur + Canny
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)

        # Morphological dilation to close gaps
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        dilated = cv2.dilate(edges, kernel, iterations=2)

        contours, _ = cv2.findContours(
            dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        regions: List[LabelRegion] = []

        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter out regions smaller than 3% of total image area
            if area < (total_area * 0.03):
                continue

            x, y, cw, ch = cv2.boundingRect(cnt)
            aspect_ratio = float(cw) / float(ch)

            # Filter by reasonable label aspect ratio (0.25 to 4.0)
            if 0.25 <= aspect_ratio <= 4.0:
                crop = img[y : y + ch, x : x + cw]
                bbox = BoundingBox(ymin=y, xmin=x, ymax=y + ch, xmax=x + cw)
                regions.append(
                    LabelRegion(cropped_image=crop, bounding_box=bbox, area=area)
                )

        # Sort regions by area descending
        regions.sort(key=lambda r: r.area, reverse=True)

        # If no prominent region detected, return full image as single region
        if not regions:
            full_bbox = BoundingBox(ymin=0, xmin=0, ymax=h, xmax=w)
            return [
                LabelRegion(cropped_image=img, bounding_box=full_bbox, area=total_area)
            ]

        return regions[:max_regions]

import logging
from dataclasses import dataclass
from typing import List, Tuple, Union, Optional
import numpy as np
import os

try:
    from rules.models import BoundingBox
except (ImportError, ValueError):
    from ..rules.models import BoundingBox

logger = logging.getLogger("ai_pipeline.ocr")


@dataclass
class OCRResult:
    text: str
    confidence: float
    bounding_box: Optional[BoundingBox] = None
    pixel_height: int = 0



class TieredOCRReader:
    """
    Tiered OCR Engine Stack (Zero paid APIs, 100% local):
    1. PaddleOCR (PP-OCRv4) — Primary: best for Hindi+English mixed scripts
    2. EasyOCR — Secondary fallback: PyTorch-based
    3. Tesseract (pytesseract) — Tertiary fallback: CPU-based
    """

    def __init__(self, languages: list = ["en", "hi"], confidence_threshold: float = 0.3):
        self.languages = languages
        self.confidence_threshold = confidence_threshold
        self._easyocr_reader = None
        self._paddle_ocr = None
        self._paddle_available = None
        self._easyocr_available = None

    def _get_paddleocr(self):
        if self._paddle_available is None:
            try:
                from paddleocr import PaddleOCR
                logger.info("Initializing PaddleOCR (PP-OCRv4) reader...")
                self._paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
                self._paddle_available = True
            except Exception as e:
                logger.warning(f"PaddleOCR not available: {e}")
                self._paddle_available = False
        return self._paddle_ocr if self._paddle_available else None

    def _get_easyocr(self):
        if self._easyocr_available is None:
            try:
                import easyocr
                logger.info("Initializing EasyOCR reader...")
                self._easyocr_reader = easyocr.Reader(self.languages, gpu=False)
                self._easyocr_available = True
            except Exception as e:
                logger.warning(f"EasyOCR not available: {e}")
                self._easyocr_available = False
        return self._easyocr_reader if self._easyocr_available else None

    def _run_paddleocr(self, image_input) -> List[OCRResult]:
        paddle = self._get_paddleocr()
        if paddle is None:
            return []
        try:
            result = paddle.ocr(image_input if isinstance(image_input, str) else image_input, cls=True)
            results = []
            if result and result[0]:
                for line in result[0]:
                    bbox_coords, (text, conf) = line[0], line[1]
                    xs = [p[0] for p in bbox_coords]
                    ys = [p[1] for p in bbox_coords]
                    bbox = BoundingBox(
                        ymin=int(min(ys)), xmin=int(min(xs)),
                        ymax=int(max(ys)), xmax=int(max(xs)),
                    )
                    px_h = max(0, bbox.ymax - bbox.ymin)
                    results.append(OCRResult(text=str(text).strip(), confidence=float(conf), bounding_box=bbox, pixel_height=px_h))
            return results
        except Exception as e:
            logger.warning(f"PaddleOCR execution error: {e}")
            return []

    def _run_easyocr(self, image_input) -> List[OCRResult]:
        reader = self._get_easyocr()
        if reader is None:
            return []
        try:
            raw_results = reader.readtext(image_input, detail=1)
            results = []
            for res in raw_results:
                bbox_coords, text, conf = res[0], res[1], res[2]
                xs = [p[0] for p in bbox_coords]
                ys = [p[1] for p in bbox_coords]
                bbox = BoundingBox(
                    ymin=int(min(ys)), xmin=int(min(xs)),
                    ymax=int(max(ys)), xmax=int(max(xs)),
                )
                px_h = max(0, bbox.ymax - bbox.ymin)
                results.append(OCRResult(text=str(text).strip(), confidence=float(conf), bounding_box=bbox, pixel_height=px_h))
            return results
        except Exception as e:
            logger.warning(f"EasyOCR execution error: {e}")
            return []

    def _run_tesseract(self, image_input) -> List[OCRResult]:
        try:
            import pytesseract
            from PIL import Image

            if isinstance(image_input, str):
                pil_img = Image.open(image_input)
            else:
                pil_img = Image.fromarray(image_input)

            data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
            results = []
            n_boxes = len(data["text"])
            for i in range(n_boxes):
                txt = data["text"][i].strip()
                conf_val = float(data["conf"][i])
                if txt and conf_val > 0:
                    x, y, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
                    results.append(OCRResult(
                        text=txt, confidence=conf_val / 100.0,
                        bounding_box=BoundingBox(ymin=y, xmin=x, ymax=y + h, xmax=x + w),
                        pixel_height=h,
                    ))
            return results
        except Exception as e:
            logger.warning(f"Tesseract OCR fallback error/not installed: {e}")
            return []

    def read_image(self, image_input: Union[str, np.ndarray]) -> List[OCRResult]:
        """
        Run OCR engine stack on image. Tries PaddleOCR → EasyOCR → Tesseract.
        Returns results from the first engine that succeeds.
        """
        # Tier 1: PaddleOCR
        results = self._run_paddleocr(image_input)
        if results:
            logger.info(f"PaddleOCR returned {len(results)} text blocks")
            return results

        # Tier 2: EasyOCR
        results = self._run_easyocr(image_input)
        if results:
            logger.info(f"EasyOCR returned {len(results)} text blocks")
            return results

        # Tier 3: Tesseract
        results = self._run_tesseract(image_input)
        if results:
            logger.info(f"Tesseract returned {len(results)} text blocks")
            return results

        return []

    def read_image_full_text(
        self, image_input: Union[str, np.ndarray]
    ) -> Tuple[str, float]:
        results = self.read_image(image_input)
        if not results:
            return "", 0.0

        full_text = " ".join(r.text for r in results if r.text)
        avg_conf = (
            sum(r.confidence for r in results) / float(len(results))
            if results
            else 0.0
        )
        return full_text, avg_conf

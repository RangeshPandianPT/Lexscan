import cv2
import numpy as np
import os
from typing import Union


class ImagePreprocessor:
    """
    OpenCV preprocessing pipeline for product label images.
    Improves OCR quality on real packaging images with uneven lighting/reflections.
    """

    def preprocess(self, image_input: Union[str, np.ndarray]) -> np.ndarray:
        """
        Input: filepath string or numpy array (BGR image)
        Returns: Preprocessed BGR or Grayscale image array ready for OCR
        """
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                raise FileNotFoundError(f"Image not found: {image_input}")
            img = cv2.imread(image_input)
            if img is None:
                raise ValueError(f"Unable to read image at {image_input}")
        else:
            img = image_input.copy()

        # 1. Upscale if too small (width < 800px)
        h, w = img.shape[:2]
        if w < 800:
            scale = 800.0 / w
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        # 2. Grayscale conversion
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # 4. Denoise
        denoised = cv2.fastNlMeansDenoising(enhanced, h=10)

        # 5. Convert back to BGR for OCR readers expecting 3 channels
        final_bgr = cv2.cvtColor(denoised, cv2.COLOR_GRAY2BGR)
        return final_bgr

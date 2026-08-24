import json
import os
import re
from typing import Optional, Dict, Any

try:
    from rules.models import ExtractedFields, ExtractedField
    from nlp.text_parser import TextParser
except (ImportError, ValueError):
    from ..rules.models import ExtractedFields, ExtractedField
    from .text_parser import TextParser


class FieldExtractor:
    """
    Two-pass compliance field extractor:
    1. First pass: Regex & pattern matching against OCR extracted text (higher accuracy)
    2. Second pass: TextParser fallback against product title + description for missing fields
    """

    def __init__(self, patterns_path: Optional[str] = None):
        if not patterns_path:
            patterns_path = os.path.join(
                os.path.dirname(__file__), "..", "config", "field_patterns.json"
            )
        self.patterns_path = os.path.abspath(patterns_path)
        self.patterns: Dict[str, Any] = self._load_patterns()
        self.text_parser = TextParser()

    def _load_patterns(self) -> Dict[str, Any]:
        if not os.path.exists(self.patterns_path):
            raise FileNotFoundError(f"Patterns file not found: {self.patterns_path}")
        with open(self.patterns_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def extract_all_fields(
        self,
        ocr_text: str = "",
        ocr_confidence: float = 0.85,
        title: str = "",
        description: str = "",
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> ExtractedFields:
        """
        Extract all compliance fields from extra_metadata, OCR text, and fallback title/description.
        """
        fields = ExtractedFields()
        extra_metadata = extra_metadata or {}

        # 0. Explicit Metadata (Pass 0 - Highest Priority, 100% confidence)
        if extra_metadata.get("mrp"):
            mrp_str = str(extra_metadata["mrp"])
            try:
                # Try to extract just the number if there's text
                import re
                num_match = re.search(r"[\d.]+", mrp_str.replace(",", ""))
                val = float(num_match.group()) if num_match else float(mrp_str)
                fields.mrp = ExtractedField(value=val, currency="INR", confidence=1.0, raw_text=mrp_str)
            except (ValueError, AttributeError):
                pass
        
        if extra_metadata.get("country_of_origin"):
            val_str = str(extra_metadata["country_of_origin"]).strip()
            fields.country_of_origin = ExtractedField(value=val_str, raw_text=val_str, confidence=1.0)
            
        if extra_metadata.get("manufacturing_date"):
            val_str = str(extra_metadata["manufacturing_date"]).strip()
            fields.mfg_or_import_date = ExtractedField(value=val_str, raw_text=val_str, confidence=1.0)
            
        if extra_metadata.get("manufacturer"):
            val_str = str(extra_metadata["manufacturer"]).strip()
            fields.manufacturer = ExtractedField(value=val_str, raw_text=val_str, confidence=1.0)
            
        if extra_metadata.get("net_quantity"):
            val_str = str(extra_metadata["net_quantity"]).strip()
            fields.net_quantity = ExtractedField(value=val_str, raw_text=val_str, confidence=1.0)
            
        if extra_metadata.get("consumer_care"):
            val_str = str(extra_metadata["consumer_care"]).strip()
            fields.consumer_care = ExtractedField(value=val_str, raw_text=val_str, confidence=1.0)

        # 1. OCR Extraction (Pass 1)
        if ocr_text and ocr_text.strip():
            if fields.mrp.value is None:
                fields.mrp = self._extract_mrp(ocr_text, ocr_confidence)
            if fields.net_quantity.value is None:
                fields.net_quantity = self._extract_net_quantity(ocr_text, ocr_confidence)
            if fields.manufacturer.value is None:
                fields.manufacturer = self._extract_manufacturer(ocr_text, ocr_confidence)
            if fields.country_of_origin.value is None:
                fields.country_of_origin = self._extract_country_of_origin(ocr_text, ocr_confidence)
            if fields.consumer_care.value is None:
                fields.consumer_care = self._extract_consumer_care(ocr_text, ocr_confidence)
            if fields.mfg_or_import_date.value is None:
                fields.mfg_or_import_date = self._extract_mfg_date(ocr_text, ocr_confidence)

        # 2. TextParser Fallback (Pass 2) for any null fields
        fallback_fields = self.text_parser.parse(title, description)

        if fields.mrp.value is None and fallback_fields.mrp.value is not None:
            fields.mrp = fallback_fields.mrp

        if (
            fields.net_quantity.value is None
            and fallback_fields.net_quantity.value is not None
        ):
            fields.net_quantity = fallback_fields.net_quantity

        if (
            fields.manufacturer.value is None
            and fallback_fields.manufacturer.value is not None
        ):
            fields.manufacturer = fallback_fields.manufacturer

        if (
            fields.country_of_origin.value is None
            and fallback_fields.country_of_origin.value is not None
        ):
            fields.country_of_origin = fallback_fields.country_of_origin

        if (
            fields.consumer_care.value is None
            and fallback_fields.consumer_care.value is not None
        ):
            fields.consumer_care = fallback_fields.consumer_care

        if (
            fields.mfg_or_import_date.value is None
            and fallback_fields.mfg_or_import_date.value is not None
        ):
            fields.mfg_or_import_date = fallback_fields.mfg_or_import_date

        return fields

    def _extract_mrp(self, text: str, base_confidence: float) -> ExtractedField:
        mrp_config = self.patterns.get("mrp", {})
        for pat in mrp_config.get("patterns", []):
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                try:
                    val_str = match.group(1).replace(",", "").replace("Z", "2").replace("O", "0").replace("०", "0").replace("o", "0").replace("z", "2")
                    val = float(val_str)
                    if val > 0:
                        return ExtractedField(
                            value=val,
                            currency="INR",
                            confidence=min(1.0, base_confidence * 0.95),
                        )
                except ValueError:
                    continue
        return ExtractedField(value=None, currency="INR", confidence=0.0)

    def _extract_net_quantity(
        self, text: str, base_confidence: float
    ) -> ExtractedField:
        qty_config = self.patterns.get("net_quantity", {})
        for pat in qty_config.get("patterns", []):
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                val = match.group(1).strip()
                if val:
                    return ExtractedField(
                        value=val, confidence=min(1.0, base_confidence * 0.95)
                    )
        return ExtractedField(value=None, confidence=0.0)

    def _extract_manufacturer(
        self, text: str, base_confidence: float
    ) -> ExtractedField:
        mfg_config = self.patterns.get("manufacturer", {})
        for pat in mfg_config.get("patterns", []):
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                val = match.group(1).strip()
                if len(val) > 3:
                    return ExtractedField(
                        value=val[:100], confidence=min(1.0, base_confidence * 0.90)
                    )
        return ExtractedField(value=None, confidence=0.0)

    def _extract_country_of_origin(
        self, text: str, base_confidence: float
    ) -> ExtractedField:
        coo_config = self.patterns.get("country_of_origin", {})
        for pat in coo_config.get("patterns", []):
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                val = match.group(1).strip().capitalize()
                if val:
                    return ExtractedField(
                        value=val, confidence=min(1.0, base_confidence * 0.90)
                    )
        return ExtractedField(value=None, confidence=0.0)

    def _extract_consumer_care(
        self, text: str, base_confidence: float
    ) -> ExtractedField:
        cc_config = self.patterns.get("consumer_care", {})
        for pat in cc_config.get("patterns", []):
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                val = match.group(1).strip()
                if "@" in val:
                    val = val.replace(" ", "").replace(".COH", ".COM").replace(".coh", ".com")
                if val:
                    return ExtractedField(
                        value=val, confidence=min(1.0, base_confidence * 0.85)
                    )
        return ExtractedField(value=None, confidence=0.0)

    def _extract_mfg_date(self, text: str, base_confidence: float) -> ExtractedField:
        date_config = self.patterns.get("mfg_or_import_date", {})
        for pat in date_config.get("patterns", []):
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                val = match.group(1).strip()
                if val:
                    return ExtractedField(
                        value=val, confidence=min(1.0, base_confidence * 0.85)
                    )
        return ExtractedField(value=None, confidence=0.0)

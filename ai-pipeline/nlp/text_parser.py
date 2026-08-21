import re
from typing import Optional

try:
    from rules.models import ExtractedFields, ExtractedField
except (ImportError, ValueError):
    from ..rules.models import ExtractedFields, ExtractedField


class TextParser:
    """
    Extracts compliance fields from product title and description text.
    This is the ALWAYS-AVAILABLE fallback — works even without images.

    Key heuristics:
    - Title often contains net quantity ("500ml", "1kg", "100g", "400 ml")
    - Description often contains manufacturer, country of origin, consumer care info
    """

    def parse(self, title: str, description: str = "") -> ExtractedFields:
        combined = f"{title} {description}".strip()
        fields = ExtractedFields()

        # 1. Extract Net Quantity (Title primary, Description secondary)
        net_qty = self._extract_net_quantity(title) or self._extract_net_quantity(
            description
        )
        if net_qty:
            fields.net_quantity = ExtractedField(value=net_qty, confidence=0.70)

        # 2. Extract Manufacturer
        mfg = self._extract_manufacturer(combined)
        if mfg:
            fields.manufacturer = ExtractedField(value=mfg, confidence=0.65)

        # 3. Extract Country of Origin
        coo = self._extract_country_of_origin(combined)
        if coo:
            fields.country_of_origin = ExtractedField(value=coo, confidence=0.65)

        # 4. Extract Consumer Care
        cc = self._extract_consumer_care(combined)
        if cc:
            fields.consumer_care = ExtractedField(value=cc, confidence=0.60)

        # 5. Extract Mfg Date
        mfg_date = self._extract_mfg_date(combined)
        if mfg_date:
            fields.mfg_or_import_date = ExtractedField(
                value=mfg_date, confidence=0.60
            )

        # 6. Extract MRP from text if explicitly stated e.g. "MRP: 499" or "MRP Rs. 399"
        mrp_val = self._extract_mrp(combined)
        if mrp_val:
            fields.mrp = ExtractedField(value=mrp_val, currency="INR", confidence=0.70)

        return fields

    def _extract_net_quantity(self, text: str) -> Optional[str]:
        if not text:
            return None
        # Match e.g. 500ml, 400 ml, 1kg, 1 L, 76 Count, 300 ml, 100 g, 143g
        match = re.search(
            r"(\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|kgs|ml|mL|l|L|ltr|litre|litres|count|nos|pcs|pack of \d+))\b",
            text,
            re.IGNORECASE,
        )
        if match:
            return match.group(1).strip()
        return None

    def _extract_manufacturer(self, text: str) -> Optional[str]:
        if not text:
            return None
        match = re.search(
            r"(?:Manufactured|Mfg|Mfd|Marketed|Packed|Imported)\s*(?:by|for)?\s*[:\-]?\s*([A-Za-z0-9\s.,&]+?)(?:[.;,]|\n|$)",
            text,
            re.IGNORECASE,
        )
        if match:
            val = match.group(1).strip()
            if len(val) > 3 and not val.lower().startswith("in "):
                return val[:80]
        return None

    def _extract_country_of_origin(self, text: str) -> Optional[str]:
        if not text:
            return None
        match = re.search(
            r"(?:Country\s+of\s+Origin|Made\s+in|Product\s+of)\s*[:\-]?\s*([A-Za-z\s]+?)(?:[.;,]|\n|$)",
            text,
            re.IGNORECASE,
        )
        if match:
            return match.group(1).strip()

        # Fallback to direct country mention e.g. "Made in India"
        match_direct = re.search(
            r"\b(India|China|USA|UK|Germany|Japan|Vietnam|Thailand|Malaysia|Korea|Taiwan|France|Italy|Spain)\b",
            text,
            re.IGNORECASE,
        )
        if match_direct:
            return match_direct.group(1).capitalize()

        return None

    def _extract_consumer_care(self, text: str) -> Optional[str]:
        if not text:
            return None
        # Phone
        match_phone = re.search(r"(\+?91[\s\-]?[6-9]\d{9}|1800[\s\-]?\d{3}[\s\-]?\d{3,4})", text)
        if match_phone:
            return match_phone.group(1).strip()

        # Email
        match_email = re.search(
            r"([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})", text
        )
        if match_email:
            return match_email.group(1).strip()

        return None

    def _extract_mfg_date(self, text: str) -> Optional[str]:
        if not text:
            return None
        match = re.search(
            r"(?:Mfg|Mfd|Manufacturing|Packed|Imported)\s*(?:Date|Dt)?\.?\s*[:\-]?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-/,]*\d{2,4}|\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|\d{1,2}[/\-]\d{2,4})",
            text,
            re.IGNORECASE,
        )
        if match:
            return match.group(1).strip()
        return None

    def _extract_mrp(self, text: str) -> Optional[float]:
        if not text:
            return None
        match = re.search(
            r"(?:MRP|M\.R\.P\.|Maximum\s+Retail\s+Price)\s*[:\-]?\s*[₹Rs\.]*\s*([\d,]+\.?\d*)",
            text,
            re.IGNORECASE,
        )
        if match:
            try:
                val = float(match.group(1).replace(",", ""))
                if val > 0:
                    return val
            except ValueError:
                pass
        return None

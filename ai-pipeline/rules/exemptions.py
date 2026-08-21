import re
from typing import Optional

try:
    from .models import ExemptionStatus
except (ImportError, ValueError):
    from rules.models import ExemptionStatus


class Rule26Exemptions:
    """
    Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 26 Exemptions.
    Exempts packages under specific legal conditions:
    (a) Small packages: net quantity <= 10g or <= 10ml
    (b) Fast food packed by restaurants/hotels at point of sale
    (c) Bulk commodities > 25kg or > 25L (institutional/industrial)
    """

    SMALL_PACKAGE_THRESHOLD = 10.0  # 10g or 10ml
    BULK_PACKAGE_THRESHOLD = 25.0  # 25kg or 25L

    FAST_FOOD_KEYWORDS = [
        "restaurant",
        "hotel",
        "fast food",
        "takeaway",
        "freshly packed",
        "prepared fresh",
        "bakery",
        "caterer",
    ]

    def check_exemption(
        self,
        product_title: str,
        description: str = "",
        net_quantity_str: Optional[str] = None,
        category: str = "other",
    ) -> ExemptionStatus:
        """
        Evaluate if a product is exempt under Rule 26.
        """
        combined_text = f"{product_title} {description}".lower()

        # 1. Rule 26(b): Fast food / restaurant items
        if any(kw in combined_text for kw in self.FAST_FOOD_KEYWORDS):
            return ExemptionStatus(
                exempted=True,
                reason="Rule 26(b): Fast food/fresh food packed by restaurant or hotel at point of sale.",
            )

        # 2. Check net quantity string for small package (Rule 26a) or bulk package (Rule 26c)
        if net_quantity_str:
            qty_val, qty_unit = self._parse_quantity(net_quantity_str)
            if qty_val is not None and qty_unit:
                # Small package check: <= 10g or <= 10ml
                if qty_unit in ["g", "gm", "gms", "ml"] and qty_val <= self.SMALL_PACKAGE_THRESHOLD:
                    return ExemptionStatus(
                        exempted=True,
                        reason=f"Rule 26(a): Net quantity ({net_quantity_str}) is ≤ 10g / 10ml.",
                    )

                # Bulk package check: > 25kg or > 25L
                if qty_unit in ["kg", "kgs", "l", "ltr", "litres"] and qty_val > self.BULK_PACKAGE_THRESHOLD:
                    return ExemptionStatus(
                        exempted=True,
                        reason=f"Rule 26 Exemption: Bulk package ({net_quantity_str}) > 25kg / 25L for institutional/industrial use.",
                    )

        # Also check title text if net_quantity_str was not passed or yielded nothing
        qty_val, qty_unit = self._parse_quantity(product_title)
        if qty_val is not None and qty_unit:
            if qty_unit in ["g", "gm", "gms", "ml"] and qty_val <= self.SMALL_PACKAGE_THRESHOLD:
                return ExemptionStatus(
                    exempted=True,
                    reason=f"Rule 26(a): Net quantity from title ({qty_val}{qty_unit}) is ≤ 10g / 10ml.",
                )

        return ExemptionStatus(exempted=False, reason=None)

    def _parse_quantity(self, text: str) -> tuple[Optional[float], Optional[str]]:
        """Extract numeric value and unit from string e.g. '5g', '10 ml', '30 kg'"""
        if not text:
            return None, None

        match = re.search(
            r"(\d+(?:\.\d+)?)\s*(g|gm|gms|kg|kgs|ml|l|ltr|litres)\b",
            text,
            re.IGNORECASE,
        )
        if match:
            val = float(match.group(1))
            unit = match.group(2).lower()
            return val, unit

        return None, None

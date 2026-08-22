import json
import os
import re
import hashlib
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional

try:
    from .models import (
        Rule,
        Violation,
        ExtractedFields,
        ExemptionStatus,
        BoundingBox,
    )
    from ocr.font_size_estimator import FontSizeEstimator
except (ImportError, ValueError):
    from rules.models import (
        Rule,
        Violation,
        ExtractedFields,
        ExemptionStatus,
        BoundingBox,
    )
    try:
        from ocr.font_size_estimator import FontSizeEstimator
    except (ImportError, ValueError):
        from ..ocr.font_size_estimator import FontSizeEstimator


SEVERITY_WEIGHTS = {
    "HIGH": 20,
    "MEDIUM": 10,
    "LOW": 5,
}


class RuleEngine:
    """
    Config-driven rule evaluation engine for Legal Metrology compliance.
    Evaluates ExtractedFields against active rules loaded from rules.json.
    """

    def __init__(self, rules_path: Optional[str] = None):
        if not rules_path:
            rules_path = os.path.join(
                os.path.dirname(__file__), "..", "config", "rules.json"
            )
        self.rules_path = os.path.abspath(rules_path)
        self.rules: List[Rule] = self._load_rules()

    def _load_rules(self) -> List[Rule]:
        if not os.path.exists(self.rules_path):
            raise FileNotFoundError(f"Rules config file not found: {self.rules_path}")

        with open(self.rules_path, "r", encoding="utf-8") as f:
            raw_rules = json.load(f)

        rules = []
        for r in raw_rules:
            rules.append(
                Rule(
                    rule_id=r["rule_id"],
                    rule_name=r["rule_name"],
                    act_reference=r["act_reference"],
                    category=r.get("category", "ALL"),
                    field=r["field"],
                    check=r["check"],
                    severity=r["severity"],
                    active=r.get("active", True),
                    issue_type=r["issue_type"],
                    message_template=r["message_template"],
                    regex_pattern=r.get("regex_pattern"),
                )
            )
        return rules

    def evaluate(
        self,
        product_id: str,
        extracted_fields: ExtractedFields,
        listing_price: float,
        category: str = "other",
        exemption_status: Optional[ExemptionStatus] = None,
        package_area_cm2: float = 200.0,
    ) -> Tuple[List[Violation], int]:
        """
        Evaluate all active rules against extracted fields.

        Returns:
            Tuple[List[Violation], int]: (list_of_violations, compliance_score_0_to_100)
        """
        if exemption_status and exemption_status.exempted:
            # Rule 26 exempted products pass with 100% compliance score and zero violations
            return [], 100

        violations: List[Violation] = []
        now_iso = datetime.now(timezone.utc).astimezone().isoformat()

        for rule in self.rules:
            if not rule.active:
                continue

            if rule.category != "ALL" and rule.category != category:
                continue

            field_obj = getattr(extracted_fields, rule.field, None)
            field_val = field_obj.value if field_obj else None
            confidence = field_obj.confidence if field_obj else 0.0
            raw_text = field_obj.raw_text if field_obj else None

            is_violation = False
            msg = rule.message_template

            if rule.check == "not_null":
                if field_val is None or (isinstance(field_val, str) and not field_val.strip()):
                    is_violation = True

            elif rule.check == "not_null_and_positive":
                if field_val is None or not isinstance(field_val, (int, float)) or field_val <= 0:
                    is_violation = True

            elif rule.check == "price_not_above_mrp":
                mrp_val = extracted_fields.mrp.value
                if (
                    mrp_val is not None
                    and isinstance(mrp_val, (int, float))
                    and mrp_val > 0
                    and listing_price > mrp_val
                ):
                    is_violation = True
                    msg = rule.message_template.format(
                        listing_price=listing_price, mrp_value=mrp_val
                    )

            elif rule.check == "regex_match":
                if (field_val is not None or (isinstance(raw_text, str) and raw_text.strip())):
                    text_to_check = raw_text if raw_text else str(field_val)
                    if not rule.regex_pattern or not re.search(rule.regex_pattern, text_to_check):
                        is_violation = True

            elif rule.check == "font_size_compliance":
                if (field_val is not None or (isinstance(raw_text, str) and raw_text.strip())):
                    min_required = FontSizeEstimator.get_minimum_required_font_size(package_area_cm2)
                    font_mm = field_obj.estimated_font_mm if field_obj else None
                    if font_mm is not None and font_mm < min_required:
                        is_violation = True
                        msg = rule.message_template.format(
                            estimated_font_mm=round(font_mm, 1),
                            min_required_mm=min_required
                        )

            if is_violation:
                date_str = datetime.now().strftime('%Y%m%d')
                unique_seed = f"{product_id}:{rule.rule_id}:{date_str}"
                short_hash = hashlib.sha256(unique_seed.encode()).hexdigest()[:8].upper()
                vio_id = f"VIO-{date_str}-{short_hash}"

                violations.append(
                    Violation(
                        violation_id=vio_id,
                        product_id=product_id,
                        rule_id=rule.rule_id,
                        clause=rule.act_reference,
                        issue=rule.issue_type,
                        severity=rule.severity,
                        message=msg,
                        confidence=round(confidence, 2),
                        detected_at=now_iso,
                        bounding_box=None,
                    )
                )

        # Calculate compliance score (100 - sum of severity penalty weights)
        total_penalty = sum(
            SEVERITY_WEIGHTS.get(v.severity, 10) for v in violations
        )
        compliance_score = max(0, min(100, 100 - total_penalty))

        return violations, compliance_score

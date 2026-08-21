import json
import os
import jsonschema
from typing import Tuple, List, Dict, Any, Optional


class ProductScanValidator:
    """
    Validates output JSON records against fixtures/schema/product_scan.json.
    """

    def __init__(self, schema_path: Optional[str] = None):
        if not schema_path:
            schema_path = os.path.join(
                os.path.dirname(__file__), "..", "fixtures", "schema", "product_scan.json"
            )
        self.schema_path = os.path.abspath(schema_path)
        self.schema: Optional[Dict[str, Any]] = self._load_schema()

    def _load_schema(self) -> Optional[Dict[str, Any]]:
        if os.path.exists(self.schema_path):
            with open(self.schema_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def validate(self, product_scan: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a ProductScan dictionary against the JSON schema.
        Returns:
            Tuple[bool, List[str]]: (is_valid, list_of_error_messages)
        """
        if not self.schema:
            return False, ["Schema file not found"]

        try:
            jsonschema.validate(instance=product_scan, schema=self.schema)
            return True, []
        except jsonschema.ValidationError as ve:
            return False, [f"Validation error at {ve.json_path}: {ve.message}"]
        except Exception as e:
            return False, [f"Unexpected error: {str(e)}"]

    def validate_file(self, filepath: str) -> Tuple[bool, List[str]]:
        if not os.path.exists(filepath):
            return False, [f"File not found: {filepath}"]

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            return self.validate(data)
        except Exception as e:
            return False, [f"Failed to load JSON from {filepath}: {str(e)}"]

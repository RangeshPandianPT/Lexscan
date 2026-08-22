import json
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

try:
    from ocr.preprocessor import ImagePreprocessor
    from ocr.label_detector import LabelDetector
    from ocr.reader import TieredOCRReader
    from nlp.extractor import FieldExtractor
    from nlp.text_parser import TextParser
    from rules.engine import RuleEngine
    from rules.exemptions import Rule26Exemptions
    from validator import ProductScanValidator
except (ImportError, ValueError):
    from .ocr.preprocessor import ImagePreprocessor
    from .ocr.label_detector import LabelDetector
    from .ocr.reader import TieredOCRReader
    from .nlp.extractor import FieldExtractor
    from .nlp.text_parser import TextParser
    from .rules.engine import RuleEngine
    from .rules.exemptions import Rule26Exemptions
    from .validator import ProductScanValidator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ai_pipeline.pipeline")


class LexScanPipeline:
    """
    Master Orchestrator for LexScan AI/ML Pipeline (Group 1 — Member B).
    Transforms RawProduct JSON (crawler output) into ProductScan JSON matching data contract.
    """

    def __init__(self):
        self.preprocessor = ImagePreprocessor()
        self.label_detector = LabelDetector()
        self.ocr_reader = TieredOCRReader()
        self.extractor = FieldExtractor()
        self.text_parser = TextParser()
        self.rule_engine = RuleEngine()
        self.exemption_checker = Rule26Exemptions()
        self.validator = ProductScanValidator()

    def process_raw_product(self, raw_product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single RawProduct dict into a ProductScan dict.
        """
        product_id = raw_product_data["product_id"]
        platform = raw_product_data["platform"]
        url = raw_product_data["url"]
        title = raw_product_data.get("title", "")
        description = raw_product_data.get("description", "")
        category = raw_product_data.get("category", "other")
        seller_id = raw_product_data.get("seller_id", "UNKNOWN")
        listing_price = float(raw_product_data.get("listing_price", 0.0))
        scraped_at = raw_product_data.get(
            "scraped_at", datetime.now(timezone.utc).astimezone().isoformat()
        )
        raw_html_sha256 = raw_product_data.get("raw_html_sha256", "0" * 64)
        images = raw_product_data.get("images", [])

        logger.info(f"⚡ Processing product: {product_id} [{platform}] - {title[:50]}...")

        # 1. OCR processing on product images if local_path is available
        ocr_texts = []
        avg_ocr_conf = 0.85

        for img_info in images:
            local_path = img_info.get("local_path")
            if local_path and os.path.exists(local_path):
                try:
                    preprocessed = self.preprocessor.preprocess(local_path)
                    regions = self.label_detector.detect_label_regions(preprocessed)
                    for reg in regions:
                        txt, conf = self.ocr_reader.read_image_full_text(
                            reg.cropped_image
                        )
                        if txt:
                            ocr_texts.append(txt)
                            avg_ocr_conf = conf
                except Exception as e:
                    logger.warning(f"Error running OCR on image {local_path}: {e}")

        combined_ocr_text = " ".join(ocr_texts)

        # 2. Extract mandatory fields (Pass 1: OCR, Pass 2: Title/Description fallback)
        extracted_fields = self.extractor.extract_all_fields(
            ocr_text=combined_ocr_text,
            ocr_confidence=avg_ocr_conf,
            title=title,
            description=description,
        )

        # 3. Rule 26 Exemption evaluation
        net_qty_val = (
            extracted_fields.net_quantity.value
            if extracted_fields.net_quantity
            else None
        )
        exemption_status = self.exemption_checker.check_exemption(
            product_title=title,
            description=description,
            net_quantity_str=net_qty_val,
            category=category,
        )

        # 4. Rule Engine evaluation
        violations, compliance_score = self.rule_engine.evaluate(
            product_id=product_id,
            extracted_fields=extracted_fields,
            listing_price=listing_price,
            category=category,
            exemption_status=exemption_status,
        )

        # Build ID-only violations list for contract compatibility
        violation_ids = [v.violation_id for v in violations]
        violation_details = [v.to_dict() for v in violations]

        # 5. Construct final ProductScan JSON matching schema
        product_scan = {
            "product_id": product_id,
            "platform": platform,
            "url": url,
            "title": title,
            "category": category,
            "seller_id": seller_id,
            "scraped_at": scraped_at,
            "raw_html_sha256": raw_html_sha256,
            "images": [
                {"url": img["url"], "sha256": img["sha256"]} for img in images
            ],
            "extracted_fields": extracted_fields.to_dict(),
            "listing_price": listing_price,
            "compliance_score": compliance_score,
            "violations": violation_ids,
            "violation_details": violation_details,
            "exemption_status": exemption_status.to_dict(),
        }

        # 6. Validate against schema
        is_valid, errors = self.validator.validate(product_scan)
        if not is_valid:
            logger.warning(f"⚠️ ProductScan schema validation warnings for {product_id}: {errors}")
        else:
            logger.info(f"✅ ProductScan schema validation PASSED for {product_id} [Score: {compliance_score}]")

        return product_scan

    def ingest_to_backend(
        self, product_scan: Dict[str, Any], backend_url: str = "http://localhost:8000"
    ) -> bool:
        """
        Pushes a generated ProductScan JSON payload to the Backend FastAPI /products/ingest endpoint.
        """
        import requests

        payload = dict(product_scan)
        # Ensure violations parameter contains full objects for backend ProductScanCreate
        if "violation_details" in payload:
            payload["violations"] = payload["violation_details"]

        endpoint = f"{backend_url.rstrip('/')}/products/ingest"
        try:
            res = requests.post(endpoint, json=payload, timeout=10)
            if res.status_code == 201:
                logger.info(f"🚀 Ingested scan {payload['product_id']} to backend successfully.")
                return True
            else:
                logger.error(f"Failed to ingest scan to backend: {res.status_code} - {res.text}")
                return False
        except Exception as e:
            logger.error(f"Error calling backend ingest endpoint {endpoint}: {e}")
            return False

    def process_file(
        self, input_filepath: str, output_dir: str = "output"
    ) -> str:
        """
        Process a single RawProduct JSON file and save ProductScan JSON.
        """
        if not os.path.exists(input_filepath):
            raise FileNotFoundError(f"Input file not found: {input_filepath}")

        with open(input_filepath, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        product_scan = self.process_raw_product(raw_data)

        os.makedirs(output_dir, exist_ok=True)
        out_filepath = os.path.join(output_dir, f"{product_scan['product_id']}.json")

        with open(out_filepath, "w", encoding="utf-8") as f:
            json.dump(product_scan, f, indent=2, ensure_ascii=False)

        return out_filepath

    def process_batch(
        self, input_dir: str, output_dir: str = "output"
    ) -> List[str]:
        """
        Batch process all RawProduct JSON files in a directory.
        """
        if not os.path.exists(input_dir):
            raise FileNotFoundError(f"Input directory not found: {input_dir}")

        json_files = [
            os.path.join(input_dir, f)
            for f in os.listdir(input_dir)
            if f.endswith(".json")
        ]

        logger.info(f"🔍 Found {len(json_files)} RawProduct files in {input_dir}. Beginning pipeline run...")

        output_paths = []
        for filepath in json_files:
            try:
                out_path = self.process_file(filepath, output_dir=output_dir)
                output_paths.append(out_path)
            except Exception as e:
                logger.error(f"Failed to process {filepath}: {e}")

        logger.info(f"✅ Processed {len(output_paths)}/{len(json_files)} ProductScan JSONs into {output_dir}/")
        return output_paths

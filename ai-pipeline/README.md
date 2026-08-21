# LexScan AI Pipeline — Group 1, Member B

> OCR + NLP + Rule Engine layer for Legal Metrology compliance scanning.

## Architecture

```
RawProduct JSON (from crawler)
        │
        ▼
┌─────────────────────────────────────────────────┐
│               LexScanPipeline                   │
│                                                 │
│  ┌──────────┐   ┌───────────┐   ┌───────────┐  │
│  │   OCR    │──▶│    NLP    │──▶│   Rule    │  │
│  │ Pipeline │   │ Extractor │   │  Engine   │  │
│  └──────────┘   └───────────┘   └───────────┘  │
│  PaddleOCR      Pass 1: OCR     7 LM Act rules │
│  EasyOCR        Pass 2: Text    Rule 26 exempt  │
│  Tesseract      fallback        Config-driven   │
└─────────────────────────────────────────────────┘
        │
        ▼
ProductScan JSON (→ Backend POST /api/v1/products/ingest)
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. (Optional) Install OCR engines for image-based extraction
pip install paddlepaddle paddleocr   # Tier 1 — best accuracy
pip install easyocr                   # Tier 2 — fallback
pip install pytesseract               # Tier 3 — fallback (requires system tesseract)

# 3. Process a single product
python main.py --input ../crawler/output/samples/AMZ-IN-B08N5WRWNW.json

# 4. Batch process all crawler samples
python main.py --batch ../crawler/output/samples/ --output output/

# 5. Validate a generated ProductScan against the frozen schema
python main.py --validate output/AMZ-IN-B08N5WRWNW.json
```

## Running Tests

```bash
# From the project root (/lexscan):
python -m unittest ai-pipeline/tests/test_rules.py    # Rule engine tests
python -m unittest ai-pipeline/tests/test_nlp.py      # NLP extraction tests
python -m unittest ai-pipeline/tests/test_ocr.py      # OCR pipeline tests
python -m unittest ai-pipeline/tests/test_pipeline.py  # End-to-end integration tests
```

## Data Contract

- **Input:** `RawProduct` JSON from `crawler/output/samples/*.json`
- **Output:** `ProductScan` JSON matching `fixtures/schema/product_scan.json`
- **Violations:** Embedded `violation_details[]` array + ID-only `violations[]` array

### Compliance Rules (config-driven via `config/rules.json`)

| Rule ID | Check | Severity | Legal Basis |
|---------|-------|----------|-------------|
| LM-R06-MRP-01 | MRP must be present and positive | HIGH | Rule 6(1)(e) |
| LM-R06-MRP-02 | Listed price must not exceed MRP | HIGH | Rule 6(1)(e) + Section 18 |
| LM-R06-QTY-01 | Net quantity must be declared | HIGH | Rule 6(1)(d) |
| LM-R06-MFG-01 | Manufacturer name & address required | HIGH | Rule 6(1)(a) |
| LM-R06-COO-01 | Country of origin required | MEDIUM | Rule 6(1)(c) |
| LM-R06-CC-01 | Consumer care contact required | MEDIUM | Rule 6(1)(a) proviso |
| LM-R06-DATE-01 | Mfg/import date required | MEDIUM | Rule 6(1)(f) |

### Rule 26 Exemptions

- **26(a):** Packages ≤ 10g or ≤ 10ml
- **26(b):** Fast food / fresh food packed at point of sale
- **26(c):** Bulk packages > 25kg or > 25L (institutional/industrial)

## Integration with Backend (Group 2)

```python
from pipeline import LexScanPipeline
import json

pipeline = LexScanPipeline()

with open("../crawler/output/samples/AMZ-IN-B08N5WRWNW.json") as f:
    raw_product = json.load(f)

product_scan = pipeline.process_raw_product(raw_product)
# POST product_scan to /api/v1/products/ingest
```

## Zero-Cost Stack

| Component | Tool | Cost |
|-----------|------|------|
| OCR (Tier 1) | PaddleOCR PP-OCRv4 | Free / Open Source |
| OCR (Tier 2) | EasyOCR | Free / Open Source |
| OCR (Tier 3) | Tesseract | Free / Open Source |
| NLP | Regex + spaCy | Free / Open Source |
| Image Preprocessing | OpenCV | Free / Open Source |
| Rule Engine | Config-driven JSON | Zero dependency |

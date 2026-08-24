#!/usr/bin/env python3
"""
LexScan AI Pipeline CLI (Group 1 — Member B)
Entry point for OCR, NLP field extraction, Rule 26 exemption checking,
and Legal Metrology rule engine evaluation.

Usage:
    # 1. Process a single RawProduct JSON file:
    python main.py --input ../crawler/output/samples/AMZ-IN-B08N5WRWNW.json

    # 2. Batch process all samples in a directory:
    python main.py --batch ../crawler/output/samples/ --output output/

    # 3. Validate a generated ProductScan JSON file against schema:
    python main.py --validate output/AMZ-IN-B08N5WRWNW.json
"""

import sys
import os
import argparse
import logging

pipeline_dir = os.path.dirname(os.path.abspath(__file__))
if pipeline_dir not in sys.path:
    sys.path.insert(0, pipeline_dir)

project_root = os.path.abspath(os.path.join(pipeline_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from pipeline import LexScanPipeline
from validator import ProductScanValidator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ai_pipeline.main")


def main():
    parser = argparse.ArgumentParser(
        description="LexScan AI Pipeline — OCR, NLP & Rule Engine Layer"
    )
    parser.add_argument("--input", type=str, help="Path to single RawProduct JSON file")
    parser.add_argument("--batch", type=str, help="Directory containing RawProduct JSON files")
    parser.add_argument("--output", type=str, default="output", help="Directory to save ProductScan JSON files")
    parser.add_argument("--validate", type=str, help="Validate a ProductScan JSON file against schema")
    parser.add_argument("--fast", action="store_true", help="Bypass OCR for speed")

    args = parser.parse_args()

    pipeline = LexScanPipeline()
    validator = ProductScanValidator()
    
    fast_mode = args.fast or os.environ.get("FAST_MODE", "0") == "1"

    if args.validate:
        logger.info(f"🔍 Validating {args.validate} against ProductScan schema...")
        is_valid, errors = validator.validate_file(args.validate)
        if is_valid:
            print(f"✅ PASS: {args.validate} strictly matches ProductScan schema!")
            sys.exit(0)
        else:
            print(f"❌ FAIL: {args.validate} failed schema validation:")
            for err in errors:
                print(f"   - {err}")
            sys.exit(1)

    if args.batch:
        output_paths = pipeline.process_batch(args.batch, output_dir=args.output, fast_mode=fast_mode)
        print(f"\n📊 Summary: Successfully generated {len(output_paths)} ProductScan records in {args.output}/")
        return

    if args.input:
        out_filepath = pipeline.process_file(args.input, output_dir=args.output, fast_mode=fast_mode)
        print(f"✅ Successfully processed and saved ProductScan to: {out_filepath}")
        return

    parser.print_help()
    print("\n💡 Tip: Run `python main.py --batch ../crawler/output/samples/` to process crawler fixtures.")


if __name__ == "__main__":
    main()

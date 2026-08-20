#!/usr/bin/env python3
"""
LexScan Crawler Self-Test & Contract Validator
Usage:
    python validate.py output/AMZ-IN-B08N5WRWNW.json
    python validate.py output/
"""
import sys
import os
import json
import re
import jsonschema
from typing import List, Dict, Any, Optional

REQUIRED_FIELDS = [
    "product_id",
    "platform",
    "url",
    "title",
    "description",
    "seller_id",
    "listing_price",
    "scraped_at",
    "raw_html_sha256",
    "images",
]

ALLOWED_PLATFORMS = {"amazon", "flipkart", "meesho", "other"}
ALLOWED_CATEGORIES = {"cosmetics", "packaged_food", "electronics", "baby_care", "other"}


def find_schema() -> Optional[Dict[str, Any]]:
    # Search common relative locations for fixtures/schema/raw_product.json
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "fixtures", "schema", "raw_product.json"),
        os.path.join(os.path.dirname(__file__), "fixtures", "schema", "raw_product.json"),
        "/Users/nishant/Documents/Lexscan/fixtures/schema/raw_product.json",
    ]
    for c in candidates:
        if os.path.exists(c):
            with open(c, "r", encoding="utf-8") as f:
                return json.load(f)
    return None


def validate_file(filepath: str, schema: Optional[Dict[str, Any]] = None) -> bool:
    """Validate a single RawProduct JSON file."""
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return False

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Invalid JSON in {filepath}: {e}")
        return False

    # 1. JSON Schema validation if schema is present
    if schema:
        try:
            jsonschema.validate(instance=data, schema=schema)
        except jsonschema.ValidationError as ve:
            print(f"❌ Schema validation error in {filepath}: {ve.message}")
            return False

    # 2. Strict field assertions
    missing = [k for k in REQUIRED_FIELDS if k not in data]
    if missing:
        print(f"❌ Missing required fields in {filepath}: {missing}")
        return False

    if data["platform"] not in ALLOWED_PLATFORMS:
        print(f"❌ Invalid platform '{data['platform']}' in {filepath}. Allowed: {ALLOWED_PLATFORMS}")
        return False

    if "category" in data and data["category"] not in ALLOWED_CATEGORIES:
        print(f"❌ Invalid category '{data['category']}' in {filepath}. Allowed: {ALLOWED_CATEGORIES}")
        return False

    if not isinstance(data["listing_price"], (int, float)) or data["listing_price"] < 0:
        print(f"❌ Invalid listing_price '{data['listing_price']}' in {filepath}. Must be non-negative number.")
        return False

    if not isinstance(data["images"], list):
        print(f"❌ 'images' must be a list in {filepath}")
        return False

    for idx, img in enumerate(data["images"]):
        if not isinstance(img, dict) or "url" not in img or "sha256" not in img:
            print(f"❌ Image #{idx} in {filepath} missing 'url' or 'sha256'")
            return False

    sha = data["raw_html_sha256"]
    if not isinstance(sha, str) or not re.match(r'^[a-fA-F0-9]{64}$', sha):
        print(f"❌ Invalid raw_html_sha256 hash in {filepath}: {sha}")
        return False

    print(f"✅ PASS: {os.path.basename(filepath)} [Platform: {data['platform']}, ID: {data['product_id']}, Price: ₹{data['listing_price']}]")
    return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate.py <path_to_json_or_dir>")
        sys.exit(1)

    target_path = sys.argv[1]
    schema = find_schema()

    if os.path.isdir(target_path):
        json_files = [
            os.path.join(target_path, f)
            for f in os.listdir(target_path)
            if f.endswith(".json")
        ]
        if not json_files:
            print(f"⚠️ No .json files found in directory: {target_path}")
            sys.exit(1)

        print(f"🔍 Validating {len(json_files)} files in {target_path}...")
        passed = sum(1 for f in json_files if validate_file(f, schema))
        failed = len(json_files) - passed
        print(f"\n📊 Summary: {passed} passed, {failed} failed out of {len(json_files)} files.")
        if failed > 0:
            sys.exit(1)
    else:
        if not validate_file(target_path, schema):
            sys.exit(1)


if __name__ == "__main__":
    main()

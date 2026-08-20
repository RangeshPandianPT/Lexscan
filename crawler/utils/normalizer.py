import json
import os
import re
import hashlib
from typing import Dict, Any

try:
    from ..scrapers.base import RawProduct
except (ImportError, ValueError):
    from scrapers.base import RawProduct


def infer_category(title: str, description: str = "") -> str:
    """
    Heuristically infer product category if not explicitly provided.
    Categories: cosmetics | packaged_food | electronics | baby_care | other
    """
    text = (f"{title} {description}").lower()

    if any(k in text for k in ["baby", "diaper", "wipes", "infant", "newborn", "toddler", "teether"]):
        return "baby_care"
    if any(k in text for k in ["cream", "lotion", "serum", "lipstick", "shampoo", "facewash", "face wash", "perfume", "cosmetic", "sunscreen", "moisturizer", "soap"]):
        return "cosmetics"
    if any(k in text for k in ["biscuit", "tea", "coffee", "butter", "chips", "oil", "flour", "atta", "rice", "spice", "chocolate", "cookie", "food", "snack", "ghee", "dal"]):
        return "packaged_food"
    if any(k in text for k in ["earphone", "cable", "charger", "laptop", "phone", "battery", "usb", "bluetooth", "headphone", "adapter", "speaker"]):
        return "electronics"

    return "other"


def generate_product_id(platform: str, url: str) -> str:
    """
    Generate normalized unique product identifier according to contract:
    - Amazon: AMZ-IN-<ASIN>
    - Flipkart: FLK-IN-<PID>
    - Meesho: MSH-IN-<PID>
    - Other: OTH-IN-<HASH>
    """
    platform_clean = platform.lower().strip()
    
    if platform_clean == "amazon":
        asin_match = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})', url, re.IGNORECASE)
        if asin_match:
            return f"AMZ-IN-{asin_match.group(1).upper()}"
        url_hash = hashlib.md5(url.encode()).hexdigest()[:10].upper()
        return f"AMZ-IN-{url_hash}"

    elif platform_clean == "flipkart":
        pid_match = re.search(r'pid=([A-Z0-9]{16}|[A-Z0-9]+)', url, re.IGNORECASE)
        if pid_match:
            return f"FLK-IN-{pid_match.group(1).upper()}"
        slug_match = re.search(r'/p/([A-Z0-9]+)', url, re.IGNORECASE)
        if slug_match:
            return f"FLK-IN-{slug_match.group(1).upper()}"
        url_hash = hashlib.md5(url.encode()).hexdigest()[:10].upper()
        return f"FLK-IN-{url_hash}"

    elif platform_clean == "meesho":
        pid_match = re.search(r'/p/([A-Z0-9]+)', url, re.IGNORECASE)
        if pid_match:
            return f"MSH-IN-{pid_match.group(1).upper()}"
        url_hash = hashlib.md5(url.encode()).hexdigest()[:10].upper()
        return f"MSH-IN-{url_hash}"

    url_hash = hashlib.md5(url.encode()).hexdigest()[:10].upper()
    return f"OTH-IN-{url_hash}"


def normalize_and_save(product: RawProduct, output_dir: str = "output") -> str:
    """
    Serialize RawProduct to JSON, save to output directory, and return file path.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    if not product.category or product.category == "other":
        product.category = infer_category(product.title, product.description)

    data = product.to_dict()
    safe_filename = f"{product.product_id}.json"
    filepath = os.path.join(output_dir, safe_filename)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return filepath


def raw_product_from_dict(data: Dict[str, Any]) -> RawProduct:
    """
    Parse a dictionary into a validated RawProduct instance.
    """
    return RawProduct(
        product_id=data["product_id"],
        platform=data["platform"],
        url=data["url"],
        title=data["title"],
        description=data.get("description", ""),
        seller_id=data.get("seller_id", "UNKNOWN"),
        listing_price=float(data.get("listing_price", 0.0)),
        scraped_at=data["scraped_at"],
        raw_html_sha256=data["raw_html_sha256"],
        images=data.get("images", []),
        category=data.get("category", "other")
    )

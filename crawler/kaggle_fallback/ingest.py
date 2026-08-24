import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

try:
    from ..scrapers.base import RawProduct
    from ..utils.normalizer import generate_product_id, normalize_and_save, infer_category
    from ..utils.hashing import sha256_of_html
except (ImportError, ValueError):
    from scrapers.base import RawProduct
    from utils.normalizer import generate_product_id, normalize_and_save, infer_category
    from utils.hashing import sha256_of_html

# Built-in realistic catalog of Indian e-commerce listings for instantaneous offline seeding / fallback
BUILTIN_SEED_CATALOG = [
    {
        "platform": "amazon",
        "url": "https://www.amazon.in/dp/B08N5WRWNW",
        "title": "Mamaearth Onion Shampoo for Hair Fall Control with Onion Oil & Plant Keratin - 400 ml",
        "description": "Reduces hair fall, makes hair soft & smooth. Contains onion oil and plant keratin. Free from sulfates, parabens, SLS, mineral oil.",
        "seller_id": "AMZ-SELLER-HONASA-01",
        "listing_price": 349.0,
        "category": "cosmetics",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600",
                "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            }
        ]
    },
    {
        "platform": "amazon",
        "url": "https://www.amazon.in/dp/B09XYZ123",
        "title": "Tata Sampann Pure Unpolished Toor Dal / Arhar Dal 1kg",
        "description": "Rich in protein. Unpolished pulses with no artificial polish. High dietary fiber content.",
        "seller_id": "AMZ-SELLER-TATA-RETAIL",
        "listing_price": 185.0,
        "category": "packaged_food",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
                "sha256": "a3b1c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b811"
            }
        ]
    },
    {
        "platform": "amazon",
        "url": "https://www.amazon.in/dp/B07HG8SBDV",
        "title": "Himalaya Baby Massage Oil with Olive & Winter Cherry - 500ml",
        "description": "Nourishes and softens delicate skin. Clinically tested for baby safety and hypoallergenic formulation.",
        "seller_id": "AMZ-SELLER-HIMALAYA-STORE",
        "listing_price": 320.0,
        "category": "baby_care",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600",
                "sha256": "b4c2d55309fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b822"
            }
        ]
    },
    {
        "platform": "flipkart",
        "url": "https://www.flipkart.com/amul-pure-ghee-1-l-tetrapack/p/itmfc7f8e819b123?pid=GHEF9XYZ12345678",
        "title": "Amul Pure Ghee 1 L Tetrapack",
        "description": "Special Grade Pure Ghee made from fresh cream. Rich aroma and granular texture.",
        "seller_id": "FLK-SELLER-GUJARAT-COOP",
        "listing_price": 590.0,
        "category": "packaged_food",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600",
                "sha256": "c5d3e66410fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b833"
            }
        ]
    },
    {
        "platform": "flipkart",
        "url": "https://www.flipkart.com/boat-bassheads-100-wired-headset/p/itm0987654321?pid=ACCF8XYZ12345678",
        "title": "boAt BassHeads 100 Wired Headset with Mic (Black, In the Ear)",
        "description": "Hawk inspired design, 10mm dynamic drivers, integrated multi-function button with inline mic.",
        "seller_id": "FLK-SELLER-IMAGINE-MKT",
        "listing_price": 399.0,
        "category": "electronics",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
                "sha256": "d6e4f77521fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b844"
            }
        ]
    },
    {
        "platform": "flipkart",
        "url": "https://www.flipkart.com/nivea-soft-light-moisturiser-300-ml/p/itm1234567890?pid=CREF7XYZ12345678",
        "title": "NIVEA Soft Light Moisturizer with Vitamin E & Jojoba Oil - 300 ml",
        "description": "Non-greasy light formula for instant soft skin. Suitable for daily use all year round.",
        "seller_id": "FLK-SELLER-BEIERSDORF-IND",
        "listing_price": 349.0,
        "category": "cosmetics",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
                "sha256": "e7f5a88632fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            }
        ]
    },
    {
        "platform": "bigbasket",
        "url": "https://www.bigbasket.com/pd/12345/organic-almond-oil/",
        "title": "Pure Organic Cold Pressed Almond Oil for Hair & Skin - 200ml",
        "description": "100% natural sweet almond oil extracted through cold-pressed method. No added preservatives.",
        "seller_id": "BB-SELLER-VEDIC-HERBS",
        "listing_price": 289.0,
        "category": "cosmetics",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1608248597359-216999818816?w=600",
                "sha256": "f8a6b99743fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b866"
            }
        ]
    },
    {
        "platform": "amazon",
        "url": "https://www.amazon.in/dp/B08XYZ456",
        "title": "Pampers All round Protection Pants - Diapers Medium Size (M) 76 Count",
        "description": "Anti-rash lotion with Aloe Vera, ultra absorb core providing up to 12 hours dryness.",
        "seller_id": "AMZ-SELLER-PG-HYGIENE",
        "listing_price": 999.0,
        "category": "baby_care",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600",
                "sha256": "09b7c00854fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b877"
            }
        ]
    },
    {
        "platform": "flipkart",
        "url": "https://www.flipkart.com/cadbury-dairy-milk-silk-roast-almond-chocolate-bar-143g/p/itm5678?pid=CHOF1XYZ12345678",
        "title": "Cadbury Dairy Milk Silk Roast Almond Chocolate Bar 143g",
        "description": "Smooth milk chocolate loaded with whole roasted almonds. Made with cocoa butter and milk solids.",
        "seller_id": "FLK-SELLER-MONDELEZ-IND",
        "listing_price": 175.0,
        "category": "packaged_food",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600",
                "sha256": "1ac8d11965fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b888"
            }
        ]
    },
    {
        "platform": "amazon",
        "url": "https://www.amazon.in/dp/B09USB999",
        "title": "Portronics Konnect L 1.2M Fast Charging 3A Type-C Cable with Nylon Braiding",
        "description": "High speed data sync up to 480Mbps, 3A rapid charge, premium braided exterior.",
        "seller_id": "AMZ-SELLER-PORTRONICS-HQ",
        "listing_price": 199.0,
        "category": "electronics",
        "images": [
            {
                "url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600",
                "sha256": "2bd9e22076fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b899"
            }
        ]
    }
]


def ingest_from_catalog(
    catalog: List[Dict[str, Any]],
    output_dir: str = "output",
    limit: Optional[int] = None
) -> List[str]:
    """
    Ingest a list of dictionary products into normalized RawProduct JSON files.
    """
    os.makedirs(output_dir, exist_ok=True)
    saved_paths = []

    items = catalog[:limit] if limit else catalog
    for item in items:
        product_id = generate_product_id(item["platform"], item["url"])
        scraped_at = datetime.now(timezone.utc).astimezone().isoformat()
        raw_html_mock = f"<html><head><title>{item['title']}</title></head><body><h1>{item['title']}</h1><p>{item['description']}</p></body></html>"
        
        prod = RawProduct(
            product_id=product_id,
            platform=item["platform"],
            url=item["url"],
            title=item["title"],
            description=item.get("description", ""),
            seller_id=item.get("seller_id", "SELLER-GENERIC-01"),
            listing_price=float(item.get("listing_price", 0.0)),
            scraped_at=scraped_at,
            raw_html_sha256=sha256_of_html(raw_html_mock),
            images=item.get("images", []),
            category=item.get("category", infer_category(item["title"]))
        )
        filepath = normalize_and_save(prod, output_dir=output_dir)
        saved_paths.append(filepath)

    return saved_paths


def ingest_kaggle_csv(
    csv_path: str = "kaggle_fallback/products.csv",
    output_dir: str = "output",
    limit: int = 100,
    dataset_name: str = None
) -> List[str]:
    """
    Ingest a Kaggle CSV dataset if available on disk, or fall back gracefully to built-in seed catalog.
    """
    if not os.path.exists(csv_path):
        print(f"ℹ️ Kaggle CSV '{csv_path}' not found on disk. Ingesting built-in seed catalog instead...")
        return ingest_from_catalog(BUILTIN_SEED_CATALOG, output_dir=output_dir, limit=limit)

    import pandas as pd
    df = pd.read_csv(csv_path, nrows=limit)
    print(f"📖 Loaded {len(df)} rows from {csv_path}...")

    saved_paths = []
    for idx, row in df.iterrows():
        # Map common Kaggle column variants
        title = str(row.get("product_name") or row.get("title") or f"Sample Product {idx}")
        url = str(row.get("product_link") or row.get("product_url") or row.get("url") or f"https://www.flipkart.com/product/p/item{idx}?pid=FLKPID{idx:06d}")
        
        price_val = row.get("discounted_price") or row.get("retail_price") or row.get("price") or 0.0
        try:
            price_clean = float(str(price_val).replace("₹", "").replace(",", "").strip() or 0.0)
        except Exception:
            price_clean = 0.0

        desc = str(row.get("about_product") or row.get("description") or "")
        image_url = str(row.get("img_link") or row.get("image") or row.get("image_url") or "")
        platform = "flipkart" if "flipkart" in url.lower() else "amazon"
        product_id = generate_product_id(platform, url)
        
        images = []
        if image_url and image_url.startswith("http"):
            cleaned_img = image_url.strip("[]\"'").split(",")[0].strip("\"' ")
            if cleaned_img.startswith("http"):
                images.append({
                    "url": cleaned_img,
                    "sha256": hashlib.sha256(cleaned_img.encode()).hexdigest()
                })

        raw_html_mock = f"<html><body><h1>{title}</h1><p>{desc}</p></body></html>"

        extra_metadata = {}
        # Parse MRP from actual_price if present
        mrp_val = row.get("actual_price") or row.get("mrp")
        if mrp_val and not pd.isna(mrp_val):
            # Clean MRP
            try:
                mrp_clean = float(str(mrp_val).replace("₹", "").replace(",", "").strip() or 0.0)
                extra_metadata["mrp"] = str(mrp_clean)
            except Exception:
                extra_metadata["mrp"] = str(mrp_val)
                
        if "country_of_origin" in row and not pd.isna(row.get("country_of_origin")):
            extra_metadata["country_of_origin"] = str(row.get("country_of_origin"))
        if "manufacturing_date" in row and not pd.isna(row.get("manufacturing_date")):
            extra_metadata["manufacturing_date"] = str(row.get("manufacturing_date"))
        if "manufacturer" in row and not pd.isna(row.get("manufacturer")):
            extra_metadata["manufacturer"] = str(row.get("manufacturer"))
            
        prod = RawProduct(
            product_id=product_id,
            platform=platform,
            url=url,
            title=title,
            description=desc[:1500],
            seller_id=f"{platform.upper()}-SELLER-{idx % 20 + 1:02d}",
            listing_price=price_clean,
            scraped_at=datetime.now(timezone.utc).astimezone().isoformat(),
            raw_html_sha256=sha256_of_html(raw_html_mock),
            images=images,
            category=infer_category(title, desc),
            dataset_name=dataset_name or os.path.basename(csv_path),
            extra_metadata=extra_metadata
        )

        filepath = normalize_and_save(prod, output_dir=output_dir)
        saved_paths.append(filepath)

    print(f"✅ Ingested {len(saved_paths)} products into {output_dir}/")
    return saved_paths


if __name__ == "__main__":
    ingest_kaggle_csv()

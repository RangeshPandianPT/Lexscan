#!/usr/bin/env python3
"""
LexScan Crawler CLI (Group 1 — Member A)
Entry point for scraping e-commerce product listings across Amazon, Flipkart, and Meesho.

Usage:
    # 1. Scrape a single product URL (auto-detect platform or specify):
    python main.py --url "https://www.amazon.in/dp/B08N5WRWNW"
    python main.py --url "https://www.flipkart.com/product/p/itm123?pid=GHEF9XYZ" --platform flipkart

    # 2. Ingest offline seed / Kaggle dataset:
    python main.py --seed
    python main.py --kaggle --limit 50

    # 3. Batch scrape a text file of URLs:
    python main.py --batch urls.txt
"""

import sys
import os

# Ensure crawler directory and project root are in sys.path
crawler_dir = os.path.dirname(os.path.abspath(__file__))
if crawler_dir not in sys.path:
    sys.path.insert(0, crawler_dir)

project_root = os.path.abspath(os.path.join(crawler_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import asyncio
import argparse
import logging
from typing import Optional

from scrapers.base import RawProduct
from scrapers.amazon import AmazonScraper
from scrapers.flipkart import FlipkartScraper
from scrapers.meesho import MeeshoScraper
from utils.normalizer import normalize_and_save
from kaggle_fallback.ingest import ingest_kaggle_csv, ingest_from_catalog, BUILTIN_SEED_CATALOG

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("lexscan.crawler")


def detect_platform(url: str) -> str:
    """Auto-detect platform from URL string."""
    url_lower = url.lower()
    if "amazon.in" in url_lower or "amazon.com" in url_lower or "amzn." in url_lower:
        return "amazon"
    elif "flipkart.com" in url_lower or "dl.flipkart.com" in url_lower:
        return "flipkart"
    elif "meesho.com" in url_lower:
        return "meesho"
    return "other"


async def scrape_single_url(
    url: str,
    platform: Optional[str] = None,
    output_dir: str = "output",
    images_dir: str = "output/images",
    download_images: bool = True
) -> str:
    """Scrape a single URL and save normalized raw product JSON."""
    if not platform or platform == "auto":
        platform = detect_platform(url)

    logger.info(f"Target URL: {url} | Platform: {platform}")

    if platform == "amazon":
        scraper = AmazonScraper(download_images=download_images, images_dir=images_dir)
    elif platform == "flipkart":
        scraper = FlipkartScraper(download_images=download_images, images_dir=images_dir)
    elif platform == "meesho":
        scraper = MeeshoScraper(download_images=download_images, images_dir=images_dir)
    else:
        scraper = AmazonScraper(download_images=download_images, images_dir=images_dir)

    product: RawProduct = await scraper.scrape(url)
    saved_filepath = normalize_and_save(product, output_dir=output_dir)
    logger.info(f"✅ Successfully scraped and saved: {saved_filepath}")
    logger.info(f"   Product ID: {product.product_id}")
    logger.info(f"   Title: {product.title[:70]}...")
    logger.info(f"   Listing Price: ₹{product.listing_price}")
    logger.info(f"   Images found: {len(product.images)}")
    return saved_filepath


async def scrape_batch_file(
    batch_file: str,
    output_dir: str = "output",
    images_dir: str = "output/images",
    delay: float = 2.0
):
    """Scrape a list of URLs from a text file."""
    if not os.path.exists(batch_file):
        logger.error(f"Batch file not found: {batch_file}")
        sys.exit(1)

    with open(batch_file, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    logger.info(f"Found {len(urls)} URLs in {batch_file}. Beginning batch crawl...")
    for idx, url in enumerate(urls, 1):
        logger.info(f"[{idx}/{len(urls)}] Processing {url}...")
        try:
            await scrape_single_url(url, output_dir=output_dir, images_dir=images_dir)
            if idx < len(urls):
                await asyncio.sleep(delay)
        except Exception as e:
            logger.error(f"Failed to scrape {url}: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="LexScan Crawler — Data Ingestion Layer for E-Commerce Compliance"
    )
    parser.add_argument("--url", type=str, help="Product page URL to scrape")
    parser.add_argument("--platform", choices=["amazon", "flipkart", "meesho", "auto"], default="auto", help="E-commerce platform")
    parser.add_argument("--batch", type=str, help="Path to text file containing product URLs (one per line)")
    parser.add_argument("--seed", action="store_true", help="Generate built-in pre-scraped sample catalog (offline safety net)")
    parser.add_argument("--kaggle", action="store_true", help="Ingest Kaggle CSV dataset")
    parser.add_argument("--csv-path", type=str, default="kaggle_fallback/products.csv", help="Path to Kaggle CSV file")
    parser.add_argument("--limit", type=int, default=50, help="Max records for Kaggle / seed ingestion")
    parser.add_argument("--output-dir", type=str, default="output", help="Directory to save raw product JSON files")
    parser.add_argument("--images-dir", type=str, default="output/images", help="Directory to save downloaded images")
    parser.add_argument("--no-images", action="store_true", help="Disable downloading image binaries")

    args = parser.parse_args()

    # Resolve paths relative to crawler root if default
    output_dir = args.output_dir
    images_dir = args.images_dir

    if args.seed:
        logger.info("Generating pre-scraped offline seed catalog...")
        paths = ingest_from_catalog(BUILTIN_SEED_CATALOG, output_dir=output_dir, limit=args.limit)
        logger.info(f"✅ Generated {len(paths)} seed records in {output_dir}/")
        return

    if args.kaggle:
        logger.info(f"Running Kaggle fallback ingestion (limit={args.limit})...")
        paths = ingest_kaggle_csv(csv_path=args.csv_path, output_dir=output_dir, limit=args.limit)
        logger.info(f"✅ Ingested {len(paths)} records in {output_dir}/")
        return

    if args.batch:
        asyncio.run(scrape_batch_file(
            args.batch,
            output_dir=output_dir,
            images_dir=images_dir
        ))
        return

    if args.url:
        asyncio.run(scrape_single_url(
            args.url,
            platform=args.platform,
            output_dir=output_dir,
            images_dir=images_dir,
            download_images=not args.no_images
        ))
        return

    parser.print_help()
    print("\n💡 Tip: Run `python main.py --seed` to generate the demo catalog immediately.")


if __name__ == "__main__":
    main()

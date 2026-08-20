# LexScan Crawler Module (Group 1 — Member A)

Data ingestion engine for LexScan e-commerce compliance monitoring. Crawls Amazon.in, Flipkart.com, and Meesho listings to extract metadata, pricing, seller identities, forensic HTML hashes, and product label images.

## Architecture

```
/crawler
  ├── scrapers/
  │    ├── base.py            # Data contract: RawProduct dataclass & BaseScraper ABC
  │    ├── amazon.py          # Playwright Amazon India scraper
  │    ├── flipkart.py        # Playwright Flipkart scraper
  │    └── meesho.py          # Playwright Meesho scraper
  ├── utils/
  │    ├── hashing.py         # SHA-256 forensic audit hashing
  │    ├── image_downloader.py# High-res image download & verification
  │    └── normalizer.py      # Standardized ID & JSON serialization
  ├── kaggle_fallback/
  │    └── ingest.py          # Offline seed & Kaggle CSV ingestion engine
  ├── output/
  │    ├── samples/           # Contract samples for Member B (AI/ML)
  │    └── images/            # Downloaded label images
  ├── main.py                 # CLI interface
  └── validate.py             # Schema & integrity self-test
```

## Quickstart

### 1. Install Dependencies
```bash
pip install -r requirements.txt
playwright install chromium
```

### 2. Run Self-Test & Offline Seed
Generate pre-scraped test records and validate them against the schema contract:
```bash
# Generate seed records in output/samples/
python main.py --seed --output-dir output/samples

# Validate all output records
python validate.py output/samples/
```

### 3. Scrape a Live Product
```bash
# Amazon India
python main.py --url "https://www.amazon.in/dp/B08N5WRWNW"

# Flipkart
python main.py --url "https://www.flipkart.com/amul-pure-ghee-1-l-tetrapack/p/itmfc7f8e819b123?pid=GHEF9XYZ12345678"

# Meesho
python main.py --url "https://www.meesho.com/p/3VXYZ7"
```

### 4. Batch Scrape URLs
```bash
python main.py --batch sample_urls.txt
```

### 5. Kaggle Bulk Ingestion (Fallback)
```bash
python main.py --kaggle --csv-path kaggle_fallback/products.csv --limit 100
```

## Data Contract (`RawProduct`)
Every crawler output JSON matches `/fixtures/schema/raw_product.json`:
- `product_id`: `AMZ-IN-...` / `FLK-IN-...` / `MSH-IN-...`
- `platform`: `"amazon"` | `"flipkart"` | `"meesho"`
- `url`: Canonical product link
- `title`: Product title
- `category`: `"cosmetics"` | `"packaged_food"` | `"electronics"` | `"baby_care"` | `"other"`
- `description`: Bullet points and product details
- `seller_id`: Seller name / ID
- `listing_price`: Current price (INR)
- `scraped_at`: ISO 8601 timestamp with timezone
- `raw_html_sha256`: SHA-256 hash of raw page HTML (forensic audit trail)
- `images`: Array of objects `[{"url": "...", "sha256": "...", "local_path": "..."}]`

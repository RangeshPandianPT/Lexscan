import asyncio
import random
import re
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup

from playwright.async_api import async_playwright, Page

try:
    from .base import BaseScraper, RawProduct
    from ..utils.hashing import sha256_of_html
    from ..utils.image_downloader import download_image
    from ..utils.normalizer import generate_product_id, infer_category
except (ImportError, ValueError):
    from scrapers.base import BaseScraper, RawProduct
    from utils.hashing import sha256_of_html
    from utils.image_downloader import download_image
    from utils.normalizer import generate_product_id, infer_category

logger = logging.getLogger("crawler.amazon")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]


class AmazonScraper(BaseScraper):
    """
    Amazon India (amazon.in) product page scraper using Playwright.
    """

    def __init__(self, download_images: bool = True, images_dir: str = "output/images"):
        self.download_images = download_images
        self.images_dir = images_dir

    async def scrape(self, url: str) -> RawProduct:
        product_id = generate_product_id("amazon", url)
        scraped_at = datetime.now(timezone.utc).astimezone().isoformat()

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1440, "height": 900},
                locale="en-IN",
                timezone_id="Asia/Kolkata",
                extra_http_headers={
                    "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "DNT": "1",
                    "Upgrade-Insecure-Requests": "1",
                },
            )

            page = await context.new_page()

            try:
                # Navigate to product URL
                await page.goto(url, wait_until="domcontentloaded", timeout=45000)
                await asyncio.sleep(random.uniform(1.5, 3.0))

                raw_html = await page.content()
                html_hash = sha256_of_html(raw_html)

                # Parse with both page queries and BeautifulSoup for fallback
                soup = BeautifulSoup(raw_html, "html.parser")

                title = await self._extract_title(page, soup)
                price = await self._extract_price(page, soup)
                seller_id = await self._extract_seller(page, soup)
                description = await self._extract_description(page, soup)
                raw_image_urls = await self._extract_image_urls(page, soup)

                images: List[Dict[str, Any]] = []
                if self.download_images and raw_image_urls:
                    for img_url in raw_image_urls[:6]:
                        try:
                            saved_path, img_hash = await download_image(
                                img_url,
                                output_dir=self.images_dir,
                                filename_prefix=product_id
                            )
                            images.append({
                                "url": img_url,
                                "sha256": img_hash,
                                "local_path": saved_path
                            })
                        except Exception as e:
                            logger.warning(f"Failed to download image {img_url}: {e}")
                            images.append({
                                "url": img_url,
                                "sha256": sha256_of_html(img_url)
                            })
                else:
                    for img_url in raw_image_urls[:6]:
                        images.append({
                            "url": img_url,
                            "sha256": sha256_of_html(img_url)
                        })

                category = infer_category(title, description)

                return RawProduct(
                    product_id=product_id,
                    platform="amazon",
                    url=url,
                    title=title or "Amazon Product Listing",
                    category=category,
                    description=description or "",
                    seller_id=seller_id or "AMZ-SELLER-RETAIL",
                    listing_price=price,
                    scraped_at=scraped_at,
                    raw_html_sha256=html_hash,
                    images=images
                )

            finally:
                await browser.close()

    async def _extract_title(self, page: Page, soup: BeautifulSoup) -> str:
        try:
            el = page.locator("#productTitle").first
            text = await el.text_content(timeout=3000)
            if text and text.strip():
                return text.strip()
        except Exception:
            pass

        title_tag = soup.find(id="productTitle") or soup.find("h1", {"id": "title"})
        if title_tag:
            return title_tag.get_text(strip=True)
        return ""

    async def _extract_price(self, page: Page, soup: BeautifulSoup) -> float:
        selectors = [
            ".apexPriceToPay .a-price-whole",
            ".a-price .a-price-whole",
            "#priceblock_ourprice",
            "#priceblock_dealprice",
            "#corePrice_feature_div .a-price-whole",
        ]
        for sel in selectors:
            try:
                el = page.locator(sel).first
                text = await el.text_content(timeout=1500)
                if text:
                    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
                    if cleaned:
                        return float(cleaned)
            except Exception:
                continue

        price_tag = soup.select_one(".a-price-whole") or soup.select_one("#priceblock_ourprice")
        if price_tag:
            cleaned = re.sub(r"[^\d.]", "", price_tag.get_text().replace(",", ""))
            if cleaned:
                return float(cleaned)

        return 0.0

    async def _extract_seller(self, page: Page, soup: BeautifulSoup) -> str:
        selectors = [
            "#sellerProfileTriggerId",
            "#merchant-info a",
            "#tabular-buybox .tabular-buybox-text[tabular-attribute-name='Sold by']",
            "#shipsFromSoldBy_feature_div a",
        ]
        for sel in selectors:
            try:
                el = page.locator(sel).first
                text = await el.text_content(timeout=1500)
                if text and text.strip():
                    return text.strip()
            except Exception:
                continue

        seller_tag = soup.find(id="sellerProfileTriggerId") or soup.select_one("#merchant-info")
        if seller_tag:
            return seller_tag.get_text(strip=True)[:50]

        return "AMZ-SELLER-UNKNOWN"

    async def _extract_description(self, page: Page, soup: BeautifulSoup) -> str:
        bullets = []
        try:
            items = await page.locator("#feature-bullets li span.a-list-item").all_text_contents()
            bullets = [b.strip() for b in items if b and b.strip()]
        except Exception:
            pass

        if not bullets:
            bullet_tags = soup.select("#feature-bullets li span.a-list-item")
            bullets = [b.get_text(strip=True) for b in bullet_tags if b.get_text(strip=True)]

        details = []
        try:
            overview_items = await page.locator("#productOverview_feature_div tr").all_text_contents()
            details = [o.strip() for o in overview_items if o and o.strip()]
        except Exception:
            pass

        combined = " ".join(bullets + details)
        return combined[:2000] if combined else ""

    async def _extract_image_urls(self, page: Page, soup: BeautifulSoup) -> List[str]:
        image_urls = []

        try:
            dynamic_data_str = await page.evaluate("""
                () => {
                    const landing = document.getElementById('landingImage') || document.getElementById('imgBlkFront');
                    if (landing) {
                        return landing.getAttribute('data-a-dynamic-image') || '';
                    }
                    const block = document.getElementById('imageBlock');
                    return block ? block.getAttribute('data-a-dynamic-image') || '' : '';
                }
            """)
            if dynamic_data_str:
                data = json.loads(dynamic_data_str)
                image_urls.extend(list(data.keys()))
        except Exception:
            pass

        try:
            thumbs = await page.locator("#altImages img").all()
            for t in thumbs:
                src = await t.get_attribute("src")
                if src and not src.endswith(".gif") and "icon" not in src:
                    high_res = re.sub(r'\._[A-Z0-9_,]+_\.', '.', src)
                    image_urls.append(high_res)
        except Exception:
            pass

        if not image_urls:
            img_tag = soup.find("img", {"id": "landingImage"}) or soup.find("img", {"id": "imgBlkFront"})
            if img_tag:
                dyn = img_tag.get("data-a-dynamic-image")
                if dyn:
                    try:
                        data = json.loads(dyn)
                        image_urls.extend(list(data.keys()))
                    except Exception:
                        pass
                if not image_urls and img_tag.get("src"):
                    image_urls.append(img_tag.get("src"))

        seen = set()
        deduped = []
        for u in image_urls:
            if u and u.startswith("http") and u not in seen:
                seen.add(u)
                deduped.append(u)

        return deduped

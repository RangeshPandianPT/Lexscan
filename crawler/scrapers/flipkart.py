import asyncio
import random
import re
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
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

logger = logging.getLogger("crawler.flipkart")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
]


class FlipkartScraper(BaseScraper):
    """
    Flipkart (flipkart.com) product page scraper using Playwright.
    """

    def __init__(self, download_images: bool = True, images_dir: str = "output/images"):
        self.download_images = download_images
        self.images_dir = images_dir

    async def scrape(self, url: str) -> RawProduct:
        product_id = generate_product_id("flipkart", url)
        scraped_at = datetime.now(timezone.utc).astimezone().isoformat()

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1440, "height": 900},
                locale="en-IN",
                timezone_id="Asia/Kolkata",
                extra_http_headers={
                    "Accept-Language": "en-IN,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                },
            )

            page = await context.new_page()

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=45000)
                await asyncio.sleep(random.uniform(2.0, 3.5))

                raw_html = await page.content()
                html_hash = sha256_of_html(raw_html)

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
                            logger.warning(f"Failed to download Flipkart image {img_url}: {e}")
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
                    platform="flipkart",
                    url=url,
                    title=title or "Flipkart Product Listing",
                    category=category,
                    description=description or "",
                    seller_id=seller_id or "FLK-SELLER-RETAIL",
                    listing_price=price,
                    scraped_at=scraped_at,
                    raw_html_sha256=html_hash,
                    images=images
                )

            finally:
                await browser.close()

    async def _extract_title(self, page: Page, soup: BeautifulSoup) -> str:
        selectors = [
            "span.B_NuCI",
            "h1._6EBuvT span",
            "span.VU-ZEz",
            "h1.yhB1nd",
            "h1",
        ]
        for sel in selectors:
            try:
                el = page.locator(sel).first
                text = await el.text_content(timeout=1500)
                if text and text.strip():
                    return text.strip()
            except Exception:
                continue

        title_tag = soup.select_one("span.B_NuCI") or soup.select_one("h1._6EBuvT") or soup.select_one("span.VU-ZEz")
        if title_tag:
            return title_tag.get_text(strip=True)
        return ""

    async def _extract_price(self, page: Page, soup: BeautifulSoup) -> float:
        selectors = [
            "div._30jeq3._16Jk6d",
            "div._30jeq3",
            "div.Nx9daj",
            "div.hl05eU div._30jeq3",
        ]
        for sel in selectors:
            try:
                el = page.locator(sel).first
                text = await el.text_content(timeout=1500)
                if text:
                    cleaned = re.sub(r"[^\d.]", "", text.replace("₹", "").replace(",", ""))
                    if cleaned:
                        return float(cleaned)
            except Exception:
                continue

        price_tag = soup.select_one("div._30jeq3") or soup.select_one("div.Nx9daj")
        if price_tag:
            cleaned = re.sub(r"[^\d.]", "", price_tag.get_text().replace("₹", "").replace(",", ""))
            if cleaned:
                return float(cleaned)

        return 0.0

    async def _extract_seller(self, page: Page, soup: BeautifulSoup) -> str:
        selectors = [
            "div#sellerName span",
            "div._1RLviY span",
            "div._3N172p span",
            "div._2Yx7fd",
        ]
        for sel in selectors:
            try:
                el = page.locator(sel).first
                text = await el.text_content(timeout=1500)
                if text and text.strip():
                    return text.strip()
            except Exception:
                continue

        seller_tag = soup.select_one("div#sellerName") or soup.select_one("div._1RLviY")
        if seller_tag:
            return seller_tag.get_text(strip=True)[:50]

        return "FLK-SELLER-UNKNOWN"

    async def _extract_description(self, page: Page, soup: BeautifulSoup) -> str:
        descriptions = []
        try:
            desc_els = await page.locator("div._1mXcCf, div.Rmo7be, div._3k-BhJ").all_text_contents()
            descriptions = [d.strip() for d in desc_els if d and d.strip()]
        except Exception:
            pass

        if not descriptions:
            desc_tags = soup.select("div._1mXcCf, div.Rmo7be, div._3k-BhJ")
            descriptions = [d.get_text(strip=True) for d in desc_tags if d.get_text(strip=True)]

        combined = " ".join(descriptions)
        return combined[:2000] if combined else ""

    async def _extract_image_urls(self, page: Page, soup: BeautifulSoup) -> List[str]:
        image_urls = []

        try:
            img_tags = await page.locator("img._396cs4, img.DByuf4, img._2r_T1I, div._2_AcLJ img").all()
            for tag in img_tags:
                src = await tag.get_attribute("src")
                if src:
                    high_res = re.sub(r'image/\d+/\d+/', 'image/832/832/', src)
                    image_urls.append(high_res)
        except Exception:
            pass

        if not image_urls:
            img_tags = soup.select("img._396cs4, img.DByuf4, img._2r_T1I")
            for t in img_tags:
                src = t.get("src")
                if src:
                    high_res = re.sub(r'image/\d+/\d+/', 'image/832/832/', src)
                    image_urls.append(high_res)

        seen = set()
        deduped = []
        for u in image_urls:
            if u and u.startswith("http") and u not in seen:
                seen.add(u)
                deduped.append(u)

        return deduped

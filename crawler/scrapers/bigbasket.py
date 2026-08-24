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

logger = logging.getLogger("crawler.bigbasket")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

class BigBasketScraper(BaseScraper):
    """
    BigBasket (bigbasket.com) product page scraper using Playwright.
    """

    def __init__(self, download_images: bool = True, images_dir: str = "output/images"):
        self.download_images = download_images
        self.images_dir = images_dir

    async def scrape(self, url: str) -> RawProduct:
        product_id = generate_product_id("bigbasket", url)
        scraped_at = datetime.now(timezone.utc).astimezone().isoformat()

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1440, "height": 900},
                locale="en-IN",
                timezone_id="Asia/Kolkata",
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
                            logger.warning(f"Failed to download BigBasket image {img_url}: {e}")
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
                    platform="bigbasket",
                    url=url,
                    title=title or "BigBasket Product Listing",
                    category=category,
                    description=description or "",
                    seller_id=seller_id or "BB-SELLER-RETAIL",
                    listing_price=price,
                    scraped_at=scraped_at,
                    raw_html_sha256=html_hash,
                    images=images
                )

            finally:
                await browser.close()

    async def _extract_title(self, page: Page, soup: BeautifulSoup) -> str:
        try:
            el = page.locator("h1").first
            text = await el.text_content(timeout=2000)
            if text and text.strip():
                return text.strip()
        except Exception:
            pass

        title_tag = soup.find("h1")
        if title_tag:
            return title_tag.get_text(strip=True)
        return ""

    async def _extract_price(self, page: Page, soup: BeautifulSoup) -> float:
        try:
            price_els = await page.locator("td.Pricing___StyledTd-sc-pldi2d-1, div[class*='Price']").all_text_contents()
            for text in price_els:
                if "₹" in text:
                    cleaned = re.sub(r"[^\d.]", "", text.replace("₹", "").replace(",", ""))
                    if cleaned:
                        return float(cleaned)
        except Exception:
            pass

        for tag in soup.find_all(string=re.compile(r'₹')):
            cleaned = re.sub(r"[^\d.]", "", tag.replace("₹", "").replace(",", ""))
            if cleaned and len(cleaned) > 1:
                return float(cleaned)
        return 0.0

    async def _extract_seller(self, page: Page, soup: BeautifulSoup) -> str:
        return "BB-SELLER-RETAIL"

    async def _extract_description(self, page: Page, soup: BeautifulSoup) -> str:
        try:
            desc = await page.locator("div.Description___StyledDiv-sc-82a36a-0, div#about_0").first.text_content(timeout=2000)
            if desc:
                return desc.strip()[:2000]
        except Exception:
            pass
        return ""

    async def _extract_image_urls(self, page: Page, soup: BeautifulSoup) -> List[str]:
        image_urls = []
        try:
            img_tags = await page.locator("img[src*='bigbasket.com/media/uploads/p/']").all()
            for tag in img_tags:
                src = await tag.get_attribute("src")
                if src:
                    high_res = re.sub(r'/p/[sm]/', '/p/l/', src)
                    image_urls.append(high_res)
        except Exception:
            pass

        if not image_urls:
            for t in soup.find_all("img"):
                src = t.get("src", "")
                if "bigbasket.com/media/uploads/p/" in src:
                    high_res = re.sub(r'/p/[sm]/', '/p/l/', src)
                    image_urls.append(high_res)

        seen = set()
        deduped = []
        for u in image_urls:
            if u and u.startswith("http") and u not in seen:
                seen.add(u)
                deduped.append(u)
        return deduped

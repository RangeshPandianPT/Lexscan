from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional


@dataclass
class RawProduct:
    """
    Contract record representing the raw scraped product.
    This is the data contract between Member A (Crawler) and Member B (AI/ML Pipeline).
    """
    product_id: str
    platform: str
    url: str
    title: str
    description: str
    seller_id: str
    listing_price: float
    scraped_at: str
    raw_html_sha256: str
    images: List[Dict[str, Any]] = field(default_factory=list)
    category: str = "other"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dictionary."""
        return asdict(self)


class BaseScraper(ABC):
    """
    Abstract base class for all platform scrapers.
    """

    @abstractmethod
    async def scrape(self, url: str) -> RawProduct:
        """
        Scrape a product page URL and return a normalized RawProduct.
        
        Args:
            url: The product page URL.
            
        Returns:
            RawProduct instance matching the data contract.
        """
        pass

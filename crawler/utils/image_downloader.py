import os
import re
import httpx
from typing import Tuple, Optional
from .hashing import sha256_of_bytes, sha256_of_file


async def download_image(
    url: str,
    output_dir: str = "output/images",
    filename_prefix: Optional[str] = None
) -> Tuple[str, str]:
    """
    Asynchronously download an image from a URL, save it to disk, and calculate SHA-256 hash.

    Args:
        url: Image source URL.
        output_dir: Directory where images should be saved.
        filename_prefix: Optional prefix for filename (e.g. product_id).

    Returns:
        Tuple[str, str]: (saved_local_filepath, sha256_hex_digest)
    """
    os.makedirs(output_dir, exist_ok=True)

    # Clean URL and derive a safe filename
    clean_url = url.split("?")[0].split("#")[0]
    base_name = os.path.basename(clean_url)
    base_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', base_name)
    if not (base_name.endswith(".jpg") or base_name.endswith(".png") or base_name.endswith(".jpeg") or base_name.endswith(".webp")):
        base_name += ".jpg"

    if filename_prefix:
        safe_prefix = re.sub(r'[^a-zA-Z0-9_\-]', '_', filename_prefix)
        filename = f"{safe_prefix}_{base_name}"
    else:
        filename = base_name

    filepath = os.path.join(output_dir, filename)

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
        response = await client.get(url)
        response.raise_for_status()
        img_bytes = response.content

    with open(filepath, "wb") as f:
        f.write(img_bytes)

    img_hash = sha256_of_bytes(img_bytes)
    return filepath, img_hash


def download_image_sync(
    url: str,
    output_dir: str = "output/images",
    filename_prefix: Optional[str] = None
) -> Tuple[str, str]:
    """
    Synchronous fallback for image downloading.
    """
    os.makedirs(output_dir, exist_ok=True)
    clean_url = url.split("?")[0].split("#")[0]
    base_name = os.path.basename(clean_url)
    base_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', base_name)
    if not (base_name.endswith(".jpg") or base_name.endswith(".png") or base_name.endswith(".jpeg") or base_name.endswith(".webp")):
        base_name += ".jpg"

    if filename_prefix:
        safe_prefix = re.sub(r'[^a-zA-Z0-9_\-]', '_', filename_prefix)
        filename = f"{safe_prefix}_{base_name}"
    else:
        filename = base_name

    filepath = os.path.join(output_dir, filename)

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    }

    with httpx.Client(timeout=15.0, follow_redirects=True, headers=headers) as client:
        response = client.get(url)
        response.raise_for_status()
        img_bytes = response.content

    with open(filepath, "wb") as f:
        f.write(img_bytes)

    img_hash = sha256_of_bytes(img_bytes)
    return filepath, img_hash

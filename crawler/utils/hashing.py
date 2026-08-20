import hashlib
import os
from typing import Union


def sha256_of_html(html: Union[str, bytes]) -> str:
    """
    Generate SHA-256 hex digest of raw HTML string or bytes.
    Used for forensic audit trail of scraped e-commerce listings.
    """
    if isinstance(html, str):
        html_bytes = html.encode("utf-8")
    else:
        html_bytes = html
    return hashlib.sha256(html_bytes).hexdigest()


def sha256_of_bytes(data: bytes) -> str:
    """
    Generate SHA-256 hex digest of binary data (e.g. image buffer).
    """
    return hashlib.sha256(data).hexdigest()


def sha256_of_file(filepath: str) -> str:
    """
    Stream and compute SHA-256 hex digest of a file on disk.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found for hashing: {filepath}")
        
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

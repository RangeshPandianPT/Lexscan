import sys
import os
from ocr.reader import TieredOCRReader

if __name__ == "__main__":
    reader = TieredOCRReader()
    text, conf = reader.read_image_full_text(sys.argv[1])
    print("CONFIDENCE:", conf)
    print("TEXT:", text)

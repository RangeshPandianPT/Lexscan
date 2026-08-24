import sys
import os
from ocr.reader import TieredOCRReader
from nlp.extractor import FieldExtractor

if __name__ == "__main__":
    reader = TieredOCRReader()
    text, conf = reader.read_image_full_text(sys.argv[1])
    print("----- OCR TEXT -----")
    print(text)
    
    extractor = FieldExtractor()
    fields = extractor.extract_all_fields(ocr_text=text, ocr_confidence=conf)
    
    print("\n----- EXTRACTED FIELDS -----")
    print("MRP:", fields.mrp.value if fields.mrp else None)
    print("Net Qty:", fields.net_quantity.value if fields.net_quantity else None)
    print("Manufacturer:", fields.manufacturer.value if fields.manufacturer else None)
    print("Country of Origin:", fields.country_of_origin.value if fields.country_of_origin else None)
    print("Consumer Care:", fields.consumer_care.value if fields.consumer_care else None)
    print("Mfg Date:", fields.mfg_or_import_date.value if fields.mfg_or_import_date else None)


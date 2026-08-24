import pandas as pd

data = [
    {
        "product_name": "Fresho Onion",
        "product_url": "https://www.bigbasket.com/pd/10000148/fresho-onion-1-kg/",
        "price": 35.0,
        "description": "Onions are known to be rich in biotin. Most of the flavonoids which are known as anti-oxidants are concentrated in the outer layers.",
        "image_url": "https://www.bigbasket.com/media/uploads/p/l/10000148_30-fresho-onion.jpg",
        "mrp": 40.0,
        "country_of_origin": "India",
        "manufacturing_date": "Aug 2026",
        "manufacturer": "Supermarket Grocery Supplies Pvt Ltd"
    },
    {
        "product_name": "Product Without Images",
        "product_url": "https://www.bigbasket.com/pd/99999999/no-image-product/",
        "price": 100.0,
        "description": "This product has no image but has explicit metadata columns in the CSV.",
        "image_url": "",
        "mrp": 120.0,
        "country_of_origin": "Sri Lanka",
        "manufacturing_date": "Jul 2026",
        "manufacturer": "Test Manufacturer Corp"
    }
]

df = pd.DataFrame(data)
df.to_csv("/Users/nishant/Documents/Lexscan/crawler/kaggle_fallback/bigbasket_dataset.csv", index=False)
print("Updated bigbasket_dataset.csv with extra columns")

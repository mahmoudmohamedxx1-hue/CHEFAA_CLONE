import json
import re
from urllib.parse import quote

# Read the medications data
with open('/workspace/data/medications/medications_products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract all products from all subcategories
all_products = []
product_id = 1

for subcategory, subcat_data in data['subcategories'].items():
    products = subcat_data.get('products', [])
    for product in products:
        # Extract product name - prefer English name if available
        product_name = product.get('product_name_english', product.get('product_name', ''))
        arabic_name = product.get('product_name', '')
        
        # Clean product name for URL construction
        clean_name = re.sub(r'[^\w\s-]', '', product_name) if product_name else ''
        clean_name = re.sub(r'\s+', '-', clean_name)
        
        # Create basic product info
        product_info = {
            'product_id': product_id,
            'product_name': product_name,
            'arabic_name': arabic_name,
            'clean_name': clean_name,
            'brand_name': product.get('brand_name'),
            'category': subcat_data.get('subcategory_name'),
            'subcategory': subcategory,
            'current_data': product,
            'chefaa_url': None  # Will be constructed during extraction
        }
        
        all_products.append(product_info)
        product_id += 1

# Save the product list for processing
with open('/workspace/data/overviews/medications_batch_2/product_list.json', 'w', encoding='utf-8') as f:
    json.dump({
        'extraction_metadata': {
            'source': 'Chefaa.com medications extraction',
            'total_products': len(all_products),
            'extraction_date': '2025-11-01',
            'batch': 'batch_2_all_products'
        },
        'products': all_products
    }, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(all_products)} products for processing")
print("Sample products:")
for i, product in enumerate(all_products[:5]):
    print(f"  {product['product_id']}: {product['product_name']}")

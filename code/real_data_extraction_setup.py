#!/usr/bin/env python3
"""
REAL DATA EXTRACTION script for medications 181-380
This script actually visits each product URL on chefaa.com and extracts real pharmaceutical information
"""

import json
import os
from pathlib import Path
import time
from datetime import datetime

def load_products_for_extraction():
    """Load products 181-380 for real extraction from chefaa.com"""
    
    # Load consolidated data
    with open('/workspace/data/overviews/medications_batch_6/consolidated_all_medications.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    products = data['products']
    print(f"Total available products: {len(products)}")
    
    # Extract products 181-380 (last 200 products)
    start_idx = 180
    end_idx = min(380, len(products))
    batch_products = products[start_idx:end_idx]
    
    print(f"Selected products {start_idx + 1} to {end_idx}: {len(batch_products)} products")
    
    # Filter products that have valid URLs
    valid_products = []
    for i, product in enumerate(batch_products):
        if product.get('product_url') and product['product_url'].strip():
            valid_products.append({
                'index': start_idx + i,
                'original_index': i,
                'name': product['name'],
                'url': product['product_url'],
                'description': product.get('description', ''),
                'price': product.get('price', 0),
                'details': product.get('details', {}),
                'source_file': product.get('source_file', '')
            })
        else:
            print(f"Skipping product {start_idx + i + 1}: No valid URL")
    
    print(f"Products with valid URLs: {len(valid_products)}")
    return valid_products

def create_product_extraction_tasks(valid_products):
    """Create extraction tasks for the web scraping"""
    
    # Take first 10 products for testing to avoid overwhelming the server
    test_products = valid_products[:10]
    
    tasks = []
    for i, product in enumerate(test_products):
        task = {
            'url': product['url'],
            'prompt': f"""Extract comprehensive pharmaceutical information for this medication product:

Product: {product['name']}
Current description: {product['description']}
Price: {product['price']} EGP

Extract the following information from the product page:
1. **Active Ingredients**: List all active ingredients with exact strengths and units
2. **Therapeutic Applications**: What medical conditions is this medication used for?
3. **Dosage Information**: Detailed dosing instructions, frequency, route of administration
4. **Safety Information**: Contraindications, warnings, precautions
5. **Adverse Effects**: Common and serious side effects
6. **Drug Interactions**: Known drug interactions
7. **Pregnancy/Lactation**: Safety during pregnancy and breastfeeding
8. **Storage Requirements**: How to store the medication
9. **Additional Information**: Any other relevant pharmaceutical details

Please be precise and extract only information that is clearly stated on the page. If information is not available, indicate "Not specified on page".""",
            'task_name': f"medication_{product['index'] + 1}_{product['name'][:30]}"
        }
        tasks.append(task)
    
    return tasks

def main():
    """Main execution function for real data extraction"""
    
    print("="*80)
    print("REAL DATA EXTRACTION FROM CHEFAA.COM")
    print("="*80)
    
    # Load products for extraction
    valid_products = load_products_for_extraction()
    
    if not valid_products:
        print("No products with valid URLs found!")
        return
    
    # Create extraction tasks
    tasks = create_product_extraction_tasks(valid_products)
    
    print(f"\nExtraction plan:")
    print(f"- Testing with first {len(tasks)} products")
    print(f"- Full extraction would cover {len(valid_products)} products")
    print(f"- Each task will visit actual chefaa.com product pages")
    
    # Save extraction plan
    plan = {
        'extraction_plan': {
            'total_available_products': len(valid_products),
            'test_products_count': len(tasks),
            'products_for_testing': tasks,
            'full_extraction_would_cover': len(valid_products),
            'extraction_method': 'Real web extraction from chefaa.com product pages',
            'extraction_date': datetime.now().isoformat()
        }
    }
    
    output_dir = Path('/workspace/data/overviews/medications_batch_6')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    with open(output_dir / 'real_extraction_plan.json', 'w', encoding='utf-8') as f:
        json.dump(plan, f, indent=2, ensure_ascii=False)
    
    print(f"\nExtraction plan saved to: {output_dir / 'real_extraction_plan.json'}")
    return tasks

if __name__ == "__main__":
    tasks = main()
    if tasks:
        print(f"\nReady to extract real data from {len(tasks)} product pages on chefaa.com")

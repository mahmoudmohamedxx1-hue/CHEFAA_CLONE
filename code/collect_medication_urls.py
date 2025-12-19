#!/usr/bin/env python3
"""
Collect medication product URLs from all page files and extract the first 200
"""

import json
import os
import re
from typing import List, Dict, Any

def extract_product_urls_from_file(file_path: str) -> List[Dict[str, Any]]:
    """Extract product URLs and metadata from a single page file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find the JSON content within the file
        json_start = content.find('```json\n{')
        if json_start == -1:
            return []
        
        json_start += 8  # Skip ```json\n{
        json_end = content.find('\n```')
        if json_end == -1:
            return []
        
        json_content = content[json_start:json_end]
        page_data = json.loads(json_content)
        
        products = []
        if 'medication_products' in page_data:
            for product in page_data['medication_products']:
                if 'product_url' in product:
                    products.append({
                        'name': product.get('name', ''),
                        'product_url': product['product_url'],
                        'price': product.get('price', 0),
                        'description': product.get('description', ''),
                        'details': product.get('details', {}),
                        'manufacturer': product.get('manufacturer', ''),
                        'category': product.get('category', '')
                    })
        
        return products
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def main():
    """Collect all medication URLs and extract first 200"""
    
    # Directory containing medication page files
    browser_dir = '/workspace/browser/extracted_content'
    
    # Find all medication page files
    medication_files = []
    for filename in os.listdir(browser_dir):
        if 'medication' in filename.lower() and filename.endswith('.json'):
            # Focus on numbered page files and main medication files
            if re.match(r'.*(p\d+|page_\d+|category).*', filename):
                medication_files.append(os.path.join(browser_dir, filename))
    
    medication_files.sort()  # Sort to ensure consistent ordering
    
    print(f"Found {len(medication_files)} medication files")
    
    # Collect all products
    all_products = []
    for file_path in medication_files:
        products = extract_product_urls_from_file(file_path)
        all_products.extend(products)
        print(f"Processed {os.path.basename(file_path)}: {len(products)} products")
    
    # Take first 200 products
    first_200_products = all_products[:200]
    
    print(f"\nTotal products collected: {len(all_products)}")
    print(f"First 200 products selected: {len(first_200_products)}")
    
    # Save the first 200 product URLs for processing
    output_data = {
        "extraction_metadata": {
            "source": "Chefaa.com medication pages",
            "total_files_processed": len(medication_files),
            "total_products_found": len(all_products),
            "batch_size": 200,
            "extraction_date": "2025-11-01",
            "batch": "Batch 1 - First 200 medications"
        },
        "products": first_200_products
    }
    
    output_file = '/workspace/data/overviews/medications_batch_1/product_urls_batch_1.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved {len(first_200_products)} product URLs to: {output_file}")
    
    # Show first few URLs for verification
    print("\nFirst 5 product URLs:")
    for i, product in enumerate(first_200_products[:5]):
        print(f"{i+1}. {product['name'][:50]}... -> {product['product_url']}")
    
    return first_200_products

if __name__ == "__main__":
    main()
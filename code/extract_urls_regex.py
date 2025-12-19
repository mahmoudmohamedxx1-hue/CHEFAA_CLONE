#!/usr/bin/env python3
"""
Robust medication product URL extraction from Chefaa data files
Handles encoding issues and corrupted JSON
"""

import json
import os
import re
from typing import List, Dict, Any

def extract_urls_with_regex(file_path: str) -> List[Dict[str, Any]]:
    """Extract product URLs using regex patterns"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all product URLs using regex
        url_pattern = r'"url":\s*"([^"]+)"'
        url_matches = re.findall(url_pattern, content)
        
        # Find product names (simplified extraction)
        name_pattern = r'"name":\s*"([^"]+)"'
        name_matches = re.findall(name_pattern, content)
        
        # Find prices
        price_pattern = r'"price":\s*"([^"]+)"'
        price_matches = re.findall(price_pattern, content)
        
        products = []
        max_items = min(len(url_matches), len(name_matches), len(price_matches), 50)  # Limit to prevent memory issues
        
        for i in range(max_items):
            product = {
                'name': name_matches[i] if i < len(name_matches) else f'Product {i+1}',
                'product_url': url_matches[i] if i < len(url_matches) else '',
                'price': price_matches[i] if i < len(price_matches) else '',
                'source_file': os.path.basename(file_path)
            }
            products.append(product)
        
        return products
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def main():
    """Extract URLs from all available files using regex"""
    
    browser_dir = '/workspace/browser/extracted_content'
    
    # Find medication files
    medication_files = []
    for filename in os.listdir(browser_dir):
        if 'medication' in filename.lower() and filename.endswith('.json'):
            medication_files.append(os.path.join(browser_dir, filename))
    
    medication_files.sort()
    
    print(f"Found {len(medication_files)} medication files")
    
    # Extract URLs using regex
    all_products = []
    processed_files = 0
    
    for file_path in medication_files:
        products = extract_urls_with_regex(file_path)
        if products:
            processed_files += 1
            all_products.extend(products)
            print(f"Processed {os.path.basename(file_path)}: {len(products)} products")
            # Show first product as example
            if products:
                print(f"  Example: {products[0]['name'][:30]}... -> {products[0]['product_url'][:50]}...")
    
    # Take first 200 products
    first_200_products = all_products[:200]
    
    print(f"\nFiles with products: {processed_files}/{len(medication_files)}")
    print(f"Total products found: {len(all_products)}")
    print(f"First 200 products selected: {len(first_200_products)}")
    
    # Save results
    output_data = {
        "extraction_metadata": {
            "source": "Chefaa.com medication files (regex extraction)",
            "total_files_processed": len(medication_files),
            "files_with_products": processed_files,
            "total_products_found": len(all_products),
            "batch_size": 200,
            "extraction_date": "2025-11-01",
            "batch": "Batch 1 - First 200 medications",
            "method": "Regex extraction from corrupted JSON files"
        },
        "products": first_200_products
    }
    
    output_file = '/workspace/data/overviews/medications_batch_1/product_urls_batch_1.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved {len(first_200_products)} product URLs to: {output_file}")
    
    # Show sample URLs
    print("\nSample product URLs:")
    for i, product in enumerate(first_200_products[:10]):
        print(f"{i+1}. {product['name'][:40]}... -> {product['product_url'][:60]}...")
    
    return first_200_products

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Extract real product URLs from Phase 5 files for pharmaceutical data extraction.
"""

import json
import os
import re
from typing import List, Dict, Any

def extract_products_from_phase5_files() -> List[Dict[str, Any]]:
    """Extract products with real URLs from Phase 5 files."""
    
    base_path = '/workspace/data'
    all_products = []
    
    # Get all Phase 5 files
    phase5_files = []
    for filename in os.listdir(base_path):
        if 'phase5' in filename and filename.endswith('.json'):
            try:
                page_num = int(re.search(r'medications_page_(\d+)', filename).group(1))
                phase5_files.append((page_num, filename))
            except:
                continue
    
    # Sort by page number
    phase5_files.sort(key=lambda x: x[0])
    
    print(f"Found {len(phase5_files)} Phase 5 files to process...")
    
    cumulative_count = 0
    
    for page_num, filename in phase5_files:
        filepath = os.path.join(base_path, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract medications from the file
            medications = []
            if isinstance(data, dict) and 'medications' in data:
                medications = data['medications']
            elif isinstance(data, list):
                medications = data
            
            print(f"Page {page_num}: Found {len(medications)} medications with real URLs")
            
            for med in medications:
                if 'product_url' in med and med['product_url']:
                    product_info = {
                        'page_number': page_num,
                        'cumulative_index': cumulative_count,
                        'name': med.get('name', ''),
                        'price_egp': med.get('price_egp', 0),
                        'prescription_required': med.get('prescription_required', False),
                        'category': med.get('category', ''),
                        'description': med.get('description', ''),
                        'product_url': med['product_url'],
                        'raw_data': med
                    }
                    all_products.append(product_info)
                    cumulative_count += 1
        
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    print(f"Total products with real URLs extracted: {len(all_products)}")
    return all_products

def select_target_products(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Select products corresponding to 1201-1400 from the extracted products."""
    
    # Products 1201-1400 are positions 1200-1399 (0-indexed)
    start_idx = 1200
    end_idx = 1400
    
    if len(products) < end_idx:
        print(f"Warning: Only {len(products)} products available, adjusting range")
        end_idx = len(products)
    
    target_products = products[start_idx:end_idx]
    
    print(f"Selected products {start_idx + 1}-{end_idx}: {len(target_products)} products")
    
    # Add product numbers for reference
    for i, product in enumerate(target_products, start_idx + 1):
        product['product_number'] = i
    
    return target_products

def main():
    """Main function to extract real URLs for products 1201-1400."""
    
    print("Extracting products with real URLs from Phase 5 files...")
    all_products = extract_products_from_phase5_files()
    
    print("Selecting target products (1201-1400)...")
    target_products = select_target_products(all_products)
    
    # Save the results
    output = {
        'extraction_metadata': {
            'source': 'Chefaa.com Phase 5 files with real URLs',
            'target_products': '1201-1400',
            'total_extracted_with_urls': len(all_products),
            'target_count': len(target_products),
            'extraction_date': '2025-11-01',
            'note': 'Using real product URLs from Phase 5 extraction files'
        },
        'products': target_products
    }
    
    output_path = '/workspace/data/medications_batch_7_real_urls.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Results saved to {output_path}")
    print(f"Total products with real URLs: {len(target_products)}")
    
    # Show first few products for verification
    print("\\nFirst 5 products with real URLs:")
    for i, product in enumerate(target_products[:5]):
        print(f"{i+1}. {product['product_number']}: {product['name'][:50]}... | {product['product_url']}")
    
    return target_products

if __name__ == "__main__":
    products = main()

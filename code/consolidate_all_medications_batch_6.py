#!/usr/bin/env python3
"""
Script to consolidate all medication products from individual page files
and extract products 1001-1200 for batch 6 processing.
"""

import json
import os
import glob
from pathlib import Path
import re

def extract_medication_data_from_page(file_path):
    """Extract medication products from a single page file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract JSON part from the file
        json_start = content.find('```json\n') + 8
        json_end = content.find('\n```', json_start)
        
        if json_start > 7 and json_end > json_start:
            json_content = content[json_start:json_end]
            data = json.loads(json_content)
            return data.get('medication_products', [])
        else:
            print(f"Warning: Could not extract JSON from {file_path}")
            return []
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def main():
    print("Consolidating all medication products...")
    
    # Find all medication page files
    medication_files = glob.glob('/workspace/browser/extracted_content/chefaa*-medications*.json')
    other_med_files = glob.glob('/workspace/browser/extracted_content/chefaa_*medications*.json')
    
    all_medication_files = medication_files + other_med_files
    print(f"Found {len(all_medication_files)} medication files")
    
    all_products = []
    file_count = 0
    
    for file_path in sorted(all_medication_files):
        file_count += 1
        print(f"Processing file {file_count}: {os.path.basename(file_path)}")
        
        products = extract_medication_data_from_page(file_path)
        for i, product in enumerate(products):
            # Add metadata to each product
            product['source_file'] = os.path.basename(file_path)
            product['source_page'] = file_path
            all_products.append(product)
    
    print(f"\nTotal products consolidated: {len(all_products)}")
    
    # Create output directory
    output_dir = Path('/workspace/data/overviews/medications_batch_6')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save consolidated products
    consolidated_file = output_dir / 'consolidated_all_medications.json'
    with open(consolidated_file, 'w', encoding='utf-8') as f:
        json.dump({
            'extraction_metadata': {
                'extraction_date': '2025-11-01',
                'total_products': len(all_products),
                'source_files': [os.path.basename(f) for f in all_medication_files]
            },
            'products': all_products
        }, f, indent=2, ensure_ascii=False)
    
    print(f"Consolidated data saved to: {consolidated_file}")
    
    # Extract products 1001-1200 for processing
    if len(all_products) >= 1000:
        batch_6_products = all_products[1000:1200]  # Products 1001-1200 (0-indexed)
        print(f"\nExtracting batch 6 products (1001-1200): {len(batch_6_products)} products")
        
        # Save batch 6 products for processing
        batch_6_file = output_dir / 'batch_6_products_for_processing.json'
        with open(batch_6_file, 'w', encoding='utf-8') as f:
            json.dump({
                'batch_info': {
                    'batch_number': 6,
                    'products_range': '1001-1200',
                    'total_products_in_batch': len(batch_6_products),
                    'extraction_date': '2025-11-01'
                },
                'products': batch_6_products
            }, f, indent=2, ensure_ascii=False)
        
        print(f"Batch 6 products saved to: {batch_6_file}")
        
        # Show sample products from batch 6
        if batch_6_products:
            print(f"\nSample products from batch 6:")
            for i, product in enumerate(batch_6_products[:3]):
                print(f"  {1001+i}: {product.get('name', 'No name')}")
        
        return batch_6_products
    else:
        print(f"ERROR: Only {len(all_products)} products available, but need products 1001-1200")
        return []

if __name__ == "__main__":
    batch_products = main()

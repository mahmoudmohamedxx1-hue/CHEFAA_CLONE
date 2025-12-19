#!/usr/bin/env python3
"""
Extract medication product URLs for batch 3 (products 401-600)
From pages 21-30 of chefaa.com medications catalog
"""

import json
import os
from pathlib import Path

def extract_product_urls():
    """Extract all product URLs from pages 21-30"""
    
    data_dir = Path("/workspace/data")
    base_urls = []
    product_mapping = {}
    
    print("Extracting product URLs from pages 21-30...")
    
    # Process pages 21-30
    for page_num in range(21, 31):
        page_file = None
        
        # Look for the page file in different possible locations
        possible_files = [
            f"/workspace/data/medications_page_{page_num}_phase3.json",
            f"/workspace/data/medications_page_{page_num}_phase4.json",
            f"/workspace/data/medications_page_{page_num}_phase5_batch*.json"
        ]
        
        # Find the actual file
        import glob
        for pattern in possible_files:
            matching_files = glob.glob(pattern)
            if matching_files:
                page_file = matching_files[0]
                break
        
        if not page_file:
            # Try exact filename without phase info
            possible_names = [
                f"medications_page_{page_num}.json",
                f"medications_page_{page_num}_complete.json"
            ]
            for name in possible_names:
                path = data_dir / name
                if path.exists():
                    page_file = str(path)
                    break
        
        if not page_file:
            print(f"Warning: Could not find data file for page {page_num}")
            continue
            
        print(f"Processing page {page_num}: {page_file}")
        
        try:
            with open(page_file, 'r', encoding='utf-8') as f:
                page_data = json.load(f)
            
            products = page_data.get('products', [])
            print(f"  Found {len(products)} products on page {page_num}")
            
            # Calculate product ID range for this page
            start_product_id = ((page_num - 1) * 20) + 1
            end_product_id = page_num * 20
            
            for i, product in enumerate(products):
                product_id = start_product_id + i
                
                # Only include products in our target range (401-600)
                if 401 <= product_id <= 600:
                    product_url = product.get('product_url', '')
                    if product_url:
                        base_urls.append(product_url)
                        product_mapping[product_id] = {
                            "url": product_url,
                            "product_name": product.get('product_name', ''),
                            "brand": product.get('brand', ''),
                            "page_number": page_num,
                            "position_in_page": i + 1
                        }
                        
        except Exception as e:
            print(f"Error processing page {page_num}: {e}")
            continue
    
    print(f"Total product URLs extracted: {len(base_urls)}")
    print(f"Product IDs mapped: {sorted(product_mapping.keys())}")
    
    # Save the results
    output_data = {
        "extraction_metadata": {
            "batch_name": "medications_batch_3",
            "target_products": "401-600",
            "total_products": len(base_urls),
            "extraction_date": "2025-11-01",
            "source_pages": "21-30",
            "extraction_method": "Batch URL extraction"
        },
        "product_mapping": product_mapping,
        "urls_for_extraction": base_urls
    }
    
    output_file = "/workspace/data/overviews/medications_batch_3/urls_for_extraction.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"Results saved to: {output_file}")
    return output_data

if __name__ == "__main__":
    result = extract_product_urls()
    print(f"Extraction complete: {result['extraction_metadata']['total_products']} URLs ready for batch extraction")
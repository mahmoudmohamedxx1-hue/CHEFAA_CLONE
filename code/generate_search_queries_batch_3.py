#!/usr/bin/env python3
"""
Generate product URLs by searching on chefaa.com or constructing URLs from product info
"""

import json
import re
from pathlib import Path

def construct_product_urls():
    """Construct or search for product URLs from pages 21-30"""
    
    data_dir = Path("/workspace/data")
    product_mapping = {}
    
    print("Attempting to construct product URLs...")
    
    # First, let's try to find any files with URLs for comparison
    try:
        with open("/workspace/data/medications_page_1.json", 'r') as f:
            page1_data = json.load(f)
        print("Found page 1 with URLs - analyzing URL pattern...")
        
        if 'products' in page1_data and page1_data['products']:
            sample_url = page1_data['products'][0].get('product_url', '')
            print(f"Sample URL pattern: {sample_url}")
            
    except Exception as e:
        print(f"Could not analyze page 1: {e}")
    
    # For pages 21-30, we need to either construct URLs or search for products
    urls_for_search = []
    
    for page_num in range(21, 31):
        page_file = f"/workspace/data/medications_page_{page_num}_phase3.json"
        
        if not Path(page_file).exists():
            continue
            
        try:
            with open(page_file, 'r', encoding='utf-8') as f:
                page_data = json.load(f)
            
            products = page_data.get('products', [])
            print(f"Processing page {page_num}: {len(products)} products")
            
            start_product_id = ((page_num - 1) * 20) + 1
            
            for i, product in enumerate(products):
                product_id = start_product_id + i
                
                if 401 <= product_id <= 600:
                    # Get product details for searching
                    arabic_name = product.get('arabic_name', '')
                    english_name = product.get('english_name', '')
                    brand_name = product.get('brand_name', '')
                    
                    # Create search query for this product
                    search_query = f"{brand_name} {english_name}"
                    if not search_query.strip():
                        search_query = arabic_name
                    
                    urls_for_search.append({
                        "product_id": product_id,
                        "page_number": page_num,
                        "position": i + 1,
                        "search_query": search_query.strip(),
                        "product_info": {
                            "arabic_name": arabic_name,
                            "english_name": english_name,
                            "brand_name": brand_name,
                            "price_egp": product.get('price_egp', 0),
                            "prescription_required": product.get('prescription_required', False)
                        }
                    })
                    
        except Exception as e:
            print(f"Error processing page {page_num}: {e}")
            continue
    
    print(f"Generated search queries for {len(urls_for_search)} products")
    
    # Save the search queries for batch processing
    search_data = {
        "extraction_metadata": {
            "batch_name": "medications_batch_3",
            "method": "search_based_extraction",
            "total_products": len(urls_for_search),
            "extraction_date": "2025-11-01"
        },
        "products_for_search": urls_for_search
    }
    
    output_file = "/workspace/data/overviews/medications_batch_3/search_queries.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(search_data, f, ensure_ascii=False, indent=2)
    
    print(f"Search queries saved to: {output_file}")
    return search_data

if __name__ == "__main__":
    result = construct_product_urls()
    print(f"Search preparation complete: {result['extraction_metadata']['total_products']} products ready for search")
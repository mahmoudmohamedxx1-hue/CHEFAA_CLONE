#!/usr/bin/env python3
"""
Comprehensive Pharmaceutical Information Extractor
Extract detailed pharmaceutical information from Chefaa.com product pages
for products 1401+ (880 products)
"""

import json
import os
import re
from pathlib import Path
from datetime import datetime
from urllib.parse import quote, urljoin

def load_product_data():
    """Load and process all medication page files to create comprehensive product list."""
    
    data_dir = Path("/workspace/data")
    all_products = []
    product_id = 1
    
    # Get all medication page files
    page_files = sorted([f for f in data_dir.glob("medications_page_*_*.json")], 
                       key=lambda x: int(re.search(r'medications_page_(\d+)', x.name).group(1)))
    
    print(f"Processing {len(page_files)} medication page files...")
    
    for page_file in page_files:
        try:
            with open(page_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            page_num = int(re.search(r'medications_page_(\d+)', page_file.name).group(1))
            products = []
            
            # Extract products from different file structures
            if "medications" in data:
                products = data["medications"]
            elif "products" in data:
                products = data["products"]
            elif "subcategories" in data:
                # Handle comprehensive file structure
                for subcategory, cat_data in data.get("subcategories", {}).items():
                    if "products" in cat_data:
                        products.extend(cat_data["products"])
            
            for product in products:
                if isinstance(product, dict) and product:
                    # Add sequential ID
                    product['sequential_id'] = product_id
                    product['source_page'] = page_num
                    product['source_file'] = page_file.name
                    all_products.append(product)
                    product_id += 1
                    
        except Exception as e:
            print(f"Error processing {page_file.name}: {e}")
    
    print(f"Total products loaded: {len(all_products)}")
    return all_products

def identify_products_1401_plus(all_products):
    """Identify products starting from position 1401."""
    
    if len(all_products) < 1401:
        print(f"Only {len(all_products)} products available, less than 1401")
        return all_products
    
    products_1401_plus = all_products[1400:]  # Python is 0-indexed
    print(f"Products 1401+ count: {len(products_1401_plus)}")
    
    # Display first few products for verification
    for i, product in enumerate(products_1401_plus[:5]):
        print(f"Product {1401+i}: {product.get('product_name', 'Unknown')}")
    
    return products_1401_plus

def generate_product_urls(products_1401_plus):
    """Generate product URLs for extraction based on available information."""
    
    base_url = "https://chefaa.com"
    urls_to_extract = []
    
    for product in products_1401_plus:
        # Try to construct URL based on available information
        product_name = product.get('product_name', '')
        product_link = product.get('product_link', '')
        
        # If product_link exists and is valid
        if product_link and product_link != 'Unknown':
            if not product_link.startswith('http'):
                product_link = urljoin(base_url, product_link)
            urls_to_extract.append({
                'url': product_link,
                'product_id': product.get('sequential_id'),
                'product_name': product_name,
                'source_info': {
                    'source_page': product.get('source_page'),
                    'source_file': product.get('source_file')
                }
            })
        else:
            # Try to construct URL from product name
            # Clean the name for URL construction
            clean_name = re.sub(r'[^\w\s-]', '', product_name).strip()
            clean_name = re.sub(r'\s+', '-', clean_name)
            
            if clean_name:
                # Try common patterns
                possible_urls = [
                    f"{base_url}/eg-ar/nowProduct/{quote(clean_name.lower())}",
                    f"{base_url}/product/{quote(clean_name.lower())}",
                    f"{base_url}/eg-ar/medications/{quote(clean_name.lower())}"
                ]
                
                # Use the first pattern as primary
                urls_to_extract.append({
                    'url': possible_urls[0],
                    'product_id': product.get('sequential_id'),
                    'product_name': product_name,
                    'source_info': {
                        'source_page': product.get('source_page'),
                        'source_file': product.get('source_file')
                    },
                    'alternative_urls': possible_urls[1:]  # Fallback URLs
                })
    
    return urls_to_extract

def create_extraction_batches(urls_to_extract, batch_size=20):
    """Create batches for extraction to avoid overwhelming the system."""
    
    batches = []
    for i in range(0, len(urls_to_extract), batch_size):
        batch = urls_to_extract[i:i + batch_size]
        batches.append({
            'batch_number': len(batches) + 1,
            'products': batch,
            'total_products': len(batch)
        })
    
    return batches

def main():
    """Main extraction workflow."""
    
    print("=== COMPREHENSIVE PHARMACEUTICAL EXTRACTION FOR PRODUCTS 1401+ ===")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load all product data
    all_products = load_product_data()
    
    # Identify products 1401+
    products_1401_plus = identify_products_1401_plus(all_products)
    
    if not products_1401_plus:
        print("No products found for extraction.")
        return
    
    # Generate URLs for extraction
    urls_to_extract = generate_product_urls(products_1401_plus)
    
    print(f"Generated {len(urls_to_extract)} URLs for extraction")
    
    # Create extraction batches
    batches = create_extraction_batches(urls_to_extract, batch_size=20)
    
    print(f"Created {len(batches)} extraction batches")
    
    # Save batch information for reference
    batch_info = {
        'extraction_metadata': {
            'total_products_1401_plus': len(products_1401_plus),
            'total_urls_generated': len(urls_to_extract),
            'total_batches': len(batches),
            'batch_size': 20,
            'extraction_start_time': datetime.now().isoformat(),
            'extraction_target': 'comprehensive_pharmaceutical_details',
            'source_website': 'https://chefaa.com'
        },
        'batches': batches,
        'sample_products': products_1401_plus[:10]  # First 10 for verification
    }
    
    batch_file = "/workspace/data/overviews/medications_final/extraction_batches.json"
    with open(batch_file, 'w', encoding='utf-8') as f:
        json.dump(batch_info, f, indent=2, ensure_ascii=False)
    
    print(f"Batch information saved to: {batch_file}")
    
    # Create summary
    summary = {
        'extraction_summary': {
            'status': 'BATCHES_READY_FOR_EXTRACTION',
            'total_products_to_process': len(products_1401_plus),
            'total_batches_created': len(batches),
            'first_product_1401': products_1401_plus[0] if products_1401_plus else None,
            'extraction_method': 'batch_extraction_with_fallback_urls',
            'estimated_extraction_time': f"{len(batches) * 2} minutes (20 products per batch)"
        },
        'ready_for_extraction': True
    }
    
    summary_file = "/workspace/data/overviews/medications_final/extraction_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"Summary saved to: {summary_file}")
    print("=== READY FOR EXTRACTION ===")
    print(f"Total products to process: {len(products_1401_plus)}")
    print(f"Extraction batches created: {len(batches)}")
    print("Next step: Execute batch extraction")

if __name__ == "__main__":
    main()

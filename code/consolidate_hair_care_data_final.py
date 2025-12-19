#!/usr/bin/env python3
"""
Final fixed script to consolidate all extracted Hair Care product data from Chefaa.com
into a single structured JSON file.
"""

import json
import os
import re
from typing import List, Dict, Any

def extract_json_from_markdown(content: str) -> str:
    """Extract JSON content from markdown file with headers."""
    lines = content.split('\n')
    json_lines = []
    in_json = False
    
    for line in lines:
        if line.strip() == '```json':
            in_json = True
            continue
        elif line.strip() == '```' and in_json:
            break
        elif in_json:
            json_lines.append(line)
    
    return '\n'.join(json_lines)

def load_json_file(filepath: str) -> Dict[str, Any]:
    """Load and parse a JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract JSON from markdown
        if content.startswith('📄 Extracted from page:'):
            json_content = extract_json_from_markdown(content)
            return json.loads(json_content)
        else:
            return json.loads(content)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return {}

def standardize_product_name(name_fields: Dict[str, str]) -> str:
    """Standardize product name handling."""
    # Try to get the best available name
    if name_fields.get('product_name_english'):
        return name_fields['product_name_english']
    elif name_fields.get('english_name'):
        return name_fields['english_name']
    elif name_fields.get('product_name_arabic'):
        return name_fields['product_name_arabic']
    elif name_fields.get('arabic_name'):
        return name_fields['arabic_name']
    else:
        return "Unknown Product"

def standardize_arabic_name(name_fields: Dict[str, str]) -> str:
    """Get Arabic product name."""
    if name_fields.get('product_name_arabic'):
        return name_fields['product_name_arabic']
    elif name_fields.get('arabic_name'):
        return name_fields['arabic_name']
    else:
        return ""

def consolidate_product_data(raw_product: Dict[str, Any]) -> Dict[str, Any]:
    """Consolidate a single product from any page format."""
    # Standardize field names across different page formats
    consolidated = {
        "name": standardize_product_name(raw_product),
        "name_arabic": standardize_arabic_name(raw_product),
        "brand": raw_product.get('brand', 'Unknown'),
        "price_egp": raw_product.get('price_egp', 0),
        "description": raw_product.get('description', ''),
        "stock_status": raw_product.get('stock_availability', raw_product.get('availability', raw_product.get('stock_status', 'Unknown'))),
        "specifications": {},
        "ratings": raw_product.get('rating', raw_product.get('ratings_reviews', raw_product.get('ratings', 'N/A'))),
        "usage_instructions": raw_product.get('usage_instructions', 'Not available on listing page')
    }
    
    # Handle specifications
    specs = raw_product.get('specifications', {})
    if specs:
        consolidated['specifications'] = specs
    else:
        consolidated['specifications'] = {
            "volume": raw_product.get('volume') or raw_product.get('size_volume') or raw_product.get('weight'),
            "color_code": raw_product.get('color_code'),
            "key_ingredients": raw_product.get('key_ingredients'),
            "target_audience": raw_product.get('target_audience')
        }
    
    # Clean up specifications - remove None values
    if isinstance(consolidated['specifications'], dict):
        consolidated['specifications'] = {k: v for k, v in consolidated['specifications'].items() if v is not None}
    else:
        consolidated['specifications'] = {}
    
    # Handle missing values
    if not consolidated['description']:
        consolidated['description'] = 'No description available'
    if not consolidated['name'] or consolidated['name'] == "Unknown Product":
        consolidated['name'] = 'Unknown Product'
    if not consolidated['brand'] or consolidated['brand'] == 'Unknown':
        consolidated['brand'] = 'Unknown'
    if consolidated['price_egp'] == 0 or not isinstance(consolidated['price_egp'], (int, float)):
        consolidated['price_egp'] = 'Price not available'
    
    return consolidated

def extract_products_from_data(data: Dict[str, Any], filename: str) -> List[Dict[str, Any]]:
    """Extract products from loaded JSON data, handling different formats."""
    products = []
    
    # Priority 1: Use 'products' array if available
    if 'products' in data:
        if isinstance(data['products'], list):
            products = data['products']
            print(f"    📊 Found {len(products)} products in 'products' array")
        return products
    
    # Priority 2: Use 'key_points' if it contains product dicts
    if 'key_points' in data and isinstance(data['key_points'], list):
        if data['key_points'] and isinstance(data['key_points'][0], dict):
            products = data['key_points']
            print(f"    📊 Found {len(products)} products in 'key_points' array")
            return products
    
    # Priority 3: Check if key_points contains product objects (not summary text)
    if 'key_points' in data:
        if isinstance(data['key_points'], list):
            # Check if first item is a product dict (has product_name_english, brand, etc.)
            first_item = data['key_points'][0] if data['key_points'] else {}
            if isinstance(first_item, dict) and any(key in first_item for key in ['product_name_english', 'brand', 'price_egp']):
                products = data['key_points']
                print(f"    📊 Found {len(products)} products in 'key_points' array")
                return products
    
    print(f"    ⚠️ No products found in {filename}")
    return products

def main():
    """Main consolidation function."""
    extracted_files = [
        '/workspace/browser/extracted_content/chefaa_hair_care_products.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page2_products.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page_3.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page_5.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page_6_products.json'
    ]
    
    all_products = []
    extraction_summary = {
        "extraction_date": "2025-11-01",
        "source": "Chefaa.com Hair Care Category",
        "total_pages_extracted": 5,
        "estimated_total_pages": 51,
        "estimated_total_products": 1020,
        "products_per_page": 20,
        "total_products_extracted": 0,
        "extraction_coverage": "9.8%",
        "technical_notes": [
            "Extraction partially completed due to website navigation instability",
            "Complete data extracted for Pages 1, 2, 3, 5, 6 (100/1020 total estimated products)",
            "Website redirected to wrong categories for pages 9+",
            "Session management issues prevented full pagination"
        ]
    }
    
    print("Starting data consolidation...")
    
    for filepath in extracted_files:
        print(f"Processing: {filepath}")
        data = load_json_file(filepath)
        
        if not data:
            print(f"  ⚠️ No data loaded from {filepath}")
            continue
            
        file_name = os.path.basename(filepath)
        products = extract_products_from_data(data, file_name)
        
        # Consolidate each product
        for i, product in enumerate(products):
            if isinstance(product, dict):
                try:
                    consolidated = consolidate_product_data(product)
                    consolidated['source_page'] = file_name.replace('.json', '')
                    all_products.append(consolidated)
                except Exception as e:
                    print(f"  ⚠️ Error processing product {i}: {e}")
    
    extraction_summary['total_products_extracted'] = len(all_products)
    
    # Calculate price range
    valid_prices = [p['price_egp'] for p in all_products if isinstance(p['price_egp'], (int, float))]
    price_range = {
        "min": min(valid_prices) if valid_prices else 0,
        "max": max(valid_prices) if valid_prices else 0
    }
    
    # Calculate category counts
    category_counts = {
        "shampoos": sum(1 for p in all_products if 'shampoo' in p['name'].lower()),
        "conditioners": sum(1 for p in all_products if 'conditioner' in p['name'].lower() or 'condition' in p['name'].lower()),
        "hair_masks": sum(1 for p in all_products if 'mask' in p['name'].lower()),
        "hair_oils": sum(1 for p in all_products if 'oil' in p['name'].lower() or 'زيت' in p['name_arabic']),
        "leave_in_creams": sum(1 for p in all_products if 'leave-in' in p['name'].lower() or 'ليف ان' in p['name_arabic']),
        "hair_colors": sum(1 for p in all_products if 'hair color' in p['name'].lower() or 'صبغة' in p['name_arabic']),
        "serums": sum(1 for p in all_products if 'serum' in p['name'].lower()),
        "sprays": sum(1 for p in all_products if 'spray' in p['name'].lower() or 'بخاخ' in p['name_arabic']),
        "creams": sum(1 for p in all_products if 'cream' in p['name'].lower() or 'كريم' in p['name_arabic'])
    }
    
    # Get unique brands
    brands = list(set([p['brand'] for p in all_products if p['brand'] and p['brand'] != 'Unknown']))
    
    # Create final JSON structure
    final_data = {
        "extraction_info": extraction_summary,
        "metadata": {
            "total_products": len(all_products),
            "price_range_egp": price_range,
            "brands_found": brands,
            "brand_count": len(brands),
            "categories": category_counts,
            "pages_extracted": [
                {"page": 1, "products": 20, "file": "chefaa_hair_care_products.json"},
                {"page": 2, "products": 20, "file": "chefaa_hair_care_page2_products.json"},
                {"page": 3, "products": 20, "file": "chefaa_hair_care_page_3.json"},
                {"page": 5, "products": 20, "file": "chefaa_hair_care_page_5.json"},
                {"page": 6, "products": 20, "file": "chefaa_hair_care_page_6_products.json"}
            ]
        },
        "products": all_products
    }
    
    # Save to requested location
    output_path = '/workspace/data/hair_care_products.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Consolidation complete!")
    print(f"📄 Total products consolidated: {len(all_products)}")
    print(f"💾 Output saved to: {output_path}")
    print(f"📊 Brands found: {len(brands)}")
    print(f"💰 Price range: {price_range['min']}-{price_range['max']} EGP")
    print(f"🏷️ Categories: {dict((k, v) for k, v in category_counts.items() if v > 0)}")

if __name__ == "__main__":
    main()

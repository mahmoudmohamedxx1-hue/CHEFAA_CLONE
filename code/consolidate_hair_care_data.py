#!/usr/bin/env python3
"""
Script to consolidate all extracted Hair Care product data from Chefaa.com
into a single structured JSON file.
"""

import json
import os
from typing import List, Dict, Any

def load_json_file(filepath: str) -> Dict[str, Any]:
    """Load and parse a JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Remove the markdown code block wrapper if present
            if content.startswith('📄 Extracted from page:') or content.startswith('```json'):
                lines = content.split('\n')
                # Find the start of JSON
                json_start = -1
                for i, line in enumerate(lines):
                    if line.strip().startswith('{'):
                        json_start = i
                        break
                if json_start != -1:
                    # Find the end of JSON
                    brace_count = 0
                    json_end = json_start
                    for i in range(json_start, len(lines)):
                        line = lines[i]
                        for char in line:
                            if char == '{':
                                brace_count += 1
                            elif char == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    json_end = i
                                    break
                        if brace_count == 0:
                            break
                    json_content = '\n'.join(lines[json_start:json_end+1])
                    return json.loads(json_content)
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
        "description": raw_product.get('description', raw_product.get('description', '')),
        "stock_status": raw_product.get('stock_availability', raw_product.get('availability', raw_product.get('stock_status', 'Unknown'))),
        "specifications": raw_product.get('specifications', {
            "volume": raw_product.get('volume') or raw_product.get('size_volume') or raw_product.get('weight'),
            "color_code": raw_product.get('color_code'),
            "key_ingredients": raw_product.get('key_ingredients')
        }),
        "ratings": raw_product.get('rating', raw_product.get('ratings_reviews', raw_product.get('ratings', 'N/A'))),
        "usage_instructions": raw_product.get('usage_instructions', 'Not available on listing page')
    }
    
    # Clean up specifications
    if isinstance(consolidated['specifications'], dict):
        consolidated['specifications'] = {k: v for k, v in consolidated['specifications'].items() if v}
    else:
        consolidated['specifications'] = {}
    
    # Handle missing values
    if not consolidated['description']:
        consolidated['description'] = 'No description available'
    if not consolidated['name']:
        consolidated['name'] = 'Unknown Product'
    if not consolidated['brand']:
        consolidated['brand'] = 'Unknown'
    if consolidated['price_egp'] == 0:
        consolidated['price_egp'] = 'Price not available'
    
    return consolidated

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
        "products_per_page": 20,
        "total_products_extracted": 0,
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
            continue
            
        products = []
        
        # Handle different page formats
        if 'key_points' in data and isinstance(data['key_points'], list):
            if data['key_points'] and isinstance(data['key_points'][0], dict):
                products = data['key_points']
        elif 'products' in data:
            products = data['products']
        else:
            print(f"Warning: Unknown format in {filepath}")
            continue
        
        # Consolidate each product
        for product in products:
            if isinstance(product, dict):
                consolidated = consolidate_product_data(product)
                consolidated['source_page'] = os.path.basename(filepath)
                all_products.append(consolidated)
    
    extraction_summary['total_products_extracted'] = len(all_products)
    
    # Create final JSON structure
    final_data = {
        "extraction_info": extraction_summary,
        "metadata": {
            "total_products": len(all_products),
            "price_range_egp": {
                "min": min([p['price_egp'] for p in all_products if isinstance(p['price_egp'], (int, float))], default=0),
                "max": max([p['price_egp'] for p in all_products if isinstance(p['price_egp'], (int, float))], default=0)
            },
            "brands_found": list(set([p['brand'] for p in all_products if p['brand'] != 'Unknown'])),
            "categories": {
                "shampoos": sum(1 for p in all_products if 'shampoo' in p['name'].lower()),
                "conditioners": sum(1 for p in all_products if 'conditioner' in p['name'].lower() or 'condition' in p['name'].lower()),
                "hair_masks": sum(1 for p in all_products if 'mask' in p['name'].lower()),
                "hair_oils": sum(1 for p in all_products if 'oil' in p['name'].lower() or 'زيت' in p['name_arabic']),
                "leave_in_creams": sum(1 for p in all_products if 'leave-in' in p['name'].lower() or 'ليف ان' in p['name_arabic']),
                "hair_colors": sum(1 for p in all_products if 'hair color' in p['name'].lower() or 'صبغة' in p['name_arabic'])
            }
        },
        "products": all_products
    }
    
    # Save to requested location
    output_path = '/workspace/data/hair_care_products.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Consolidation complete!")
    print(f"📄 Total products consolidated: {len(all_products)}")
    print(f"💾 Output saved to: {output_path}")
    print(f"📊 Brands found: {len(final_data['metadata']['brands_found'])}")
    print(f"💰 Price range: {final_data['metadata']['price_range_egp']['min']}-{final_data['metadata']['price_range_egp']['max']} EGP")

if __name__ == "__main__":
    main()

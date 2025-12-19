#!/usr/bin/env python3
"""
Comprehensive script to consolidate ALL extracted Hair Care product data from Chefaa.com
including newly extracted pages 4, 10, 15, 30 etc.
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

def extract_products_from_key_points(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract products from key_points array."""
    products = []
    if 'key_points' in data and isinstance(data['key_points'], list):
        for item in data['key_points']:
            if isinstance(item, str) and item.startswith('{'):
                # Handle JSON string format
                try:
                    # Parse the JSON string
                    json_str = item.strip('[]')
                    parsed_item = json.loads(json_str)
                    if isinstance(parsed_item, list):
                        products.extend(parsed_item)
                    else:
                        products.append(parsed_item)
                except json.JSONDecodeError:
                    continue
            elif isinstance(item, dict):
                products.append(item)
    return products

def consolidate_product_data(raw_product: Dict[str, Any], source_file: str) -> Dict[str, Any]:
    """Consolidate a single product from any page format."""
    
    # Handle different name field formats
    name_arabic = (raw_product.get('product_name_arabic') or 
                  raw_product.get('arabic_name') or 
                  raw_product.get('product_name') or 
                  raw_product.get('name') or '')
    
    name_english = (raw_product.get('product_name_english') or 
                   raw_product.get('english_name') or '')
    
    # Handle price extraction (remove currency and convert to number)
    price = raw_product.get('price_egp') or raw_product.get('price')
    if price:
        if isinstance(price, str):
            # Remove currency symbols and convert
            price_clean = re.sub(r'[^\d.]', '', str(price))
            try:
                price = float(price_clean) if price_clean else 0
            except:
                price = 0
    
    # Handle brand
    brand = (raw_product.get('brand') or '')
    # Remove parentheses with English names if present
    if brand and '(' in brand:
        brand = re.sub(r'\s*\([^)]*\)', '', brand).strip()
    
    # Handle volume/size
    volume = (raw_product.get('volume') or 
             raw_product.get('size_volume') or 
             raw_product.get('weight') or '')
    
    consolidated = {
        "name": name_english or name_arabic,
        "name_arabic": name_arabic,
        "brand": brand or 'Unknown',
        "price_egp": price if isinstance(price, (int, float)) and price > 0 else 0,
        "description": raw_product.get('description', ''),
        "stock_status": raw_product.get('stock_availability', raw_product.get('availability', 'In Stock')),
        "specifications": {
            "volume": volume,
            "color_code": raw_product.get('color_code'),
            "key_ingredients": raw_product.get('key_ingredients'),
            "target_audience": raw_product.get('target_audience')
        },
        "ratings": raw_product.get('rating', raw_product.get('ratings', raw_product.get('ratings_reviews', 'N/A'))),
        "usage_instructions": raw_product.get('usage_instructions', 'Not available on listing page'),
        "product_url": raw_product.get('product_url', '')
    }
    
    # Clean up specifications
    consolidated['specifications'] = {k: v for k, v in consolidated['specifications'].items() if v}
    
    # Handle missing values
    if not consolidated['description']:
        consolidated['description'] = 'No description available'
    if not consolidated['name'] or consolidated['name'] == "Unknown Product":
        consolidated['name'] = 'Unknown Product'
    if not consolidated['brand'] or consolidated['brand'] == 'Unknown':
        consolidated['brand'] = 'Unknown'
    if consolidated['price_egp'] == 0:
        consolidated['price_egp'] = 'Price not available'
    
    return consolidated

def extract_products_from_data(data: Dict[str, Any], filename: str) -> List[Dict[str, Any]]:
    """Extract products from loaded JSON data, handling all formats."""
    products = []
    
    # Priority 1: Use 'products' array if available
    if 'products' in data:
        if isinstance(data['products'], list):
            products = data['products']
            print(f"    📊 Found {len(products)} products in 'products' array")
        return products
    
    # Priority 2: Extract from key_points
    key_points_products = extract_products_from_key_points(data)
    if key_points_products:
        products = key_points_products
        print(f"    📊 Found {len(products)} products in 'key_points' array")
        return products
    
    print(f"    ⚠️ No products found in {filename}")
    return products

def main():
    """Main consolidation function."""
    extracted_files = [
        # Original files
        '/workspace/browser/extracted_content/chefaa_hair_care_products.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page2_products.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page_3.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page_5.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page_6_products.json',
        # Additional extracted files
        '/workspace/browser/extracted_content/chefaa_hair_care_page_4.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page_4_products.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page10.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page15.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page30.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page12.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page18.json',
        '/workspace/browser/extracted_content/chefaa_hair_care_page25.json'
    ]
    
    all_products = []
    extraction_summary = {
        "extraction_date": "2025-11-01",
        "source": "Chefaa.com Hair Care Category",
        "total_pages_extracted": 0,
        "estimated_total_pages": 51,
        "estimated_total_products": 1020,
        "products_per_page": 20,
        "total_products_extracted": 0,
        "extraction_coverage": "0%",
        "technical_notes": [
            "Attempting comprehensive extraction using alternative navigation methods",
            "Website navigation instability has been partially overcome",
            "Multiple pages successfully extracted using direct URL navigation",
            "Technical barriers remain for some pages due to routing issues"
        ]
    }
    
    successful_pages = []
    
    print("Starting comprehensive data consolidation...")
    
    for filepath in extracted_files:
        if not os.path.exists(filepath):
            print(f"⚠️ File not found: {filepath}")
            continue
            
        print(f"Processing: {filepath}")
        data = load_json_file(filepath)
        
        if not data:
            print(f"  ⚠️ No data loaded from {filepath}")
            continue
            
        file_name = os.path.basename(filepath)
        products = extract_products_from_data(data, file_name)
        
        # Extract page number from filename for tracking
        page_num = None
        if 'page_' in file_name:
            page_match = re.search(r'page[_\-]?(\d+)', file_name)
            if page_match:
                page_num = page_match.group(1)
        
        # Consolidate each product
        for i, product in enumerate(products):
            if isinstance(product, dict):
                try:
                    consolidated = consolidate_product_data(product, file_name)
                    consolidated['source_page'] = file_name.replace('.json', '')
                    if page_num:
                        consolidated['page_number'] = page_num
                    all_products.append(consolidated)
                except Exception as e:
                    print(f"  ⚠️ Error processing product {i}: {e}")
        
        if products:
            successful_pages.append(f"Page {page_num}: {len(products)} products")
    
    # Update extraction summary
    extraction_summary['total_pages_extracted'] = len([p for p in all_products if p.get('page_number')])
    extraction_summary['total_products_extracted'] = len(all_products)
    extraction_summary['extraction_coverage'] = f"{(len(all_products) / 1020 * 100):.1f}%"
    
    # Calculate statistics
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
            "brands_found": sorted(brands),
            "brand_count": len(brands),
            "categories": category_counts,
            "successful_pages": successful_pages,
            "pages_extracted": [
                {"page": p.split(':')[0].split(' ')[1], 
                 "products": int(p.split(':')[1].split(' ')[1]), 
                 "file": "chefaa_hair_care_page" + p.split(':')[0].split(' ')[1] + ".json"}
                for p in successful_pages
            ]
        },
        "products": all_products
    }
    
    # Save to correct location
    output_path = '/workspace/data/hair_care/hair_care_products.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Comprehensive consolidation complete!")
    print(f"📄 Total products consolidated: {len(all_products)}")
    print(f"💾 Output saved to: {output_path}")
    print(f"📊 Brands found: {len(brands)}")
    print(f"💰 Price range: {price_range['min']}-{price_range['max']} EGP")
    print(f"🏷️ Categories: {dict((k, v) for k, v in category_counts.items() if v > 0)}")
    print(f"📑 Successful pages: {len(successful_pages)}")
    
    # Display successful pages
    print(f"📋 Page breakdown:")
    for page_info in successful_pages:
        print(f"   - {page_info}")

if __name__ == "__main__":
    main()

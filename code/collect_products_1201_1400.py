#!/usr/bin/env python3
"""
Collect products 1201-1400 from all available page files and construct product URLs manually.
"""

import json
import os
import re
from typing import List, Dict, Any

def extract_name_slug(name: str) -> str:
    """Convert medication name to URL slug format."""
    if not name:
        return ""
    
    # Remove Arabic characters and special characters
    # Extract alphanumeric part
    slug_match = re.search(r'[a-zA-Z0-9]+', name)
    if slug_match:
        base_slug = slug_match.group()
    else:
        base_slug = name.replace(' ', '-').lower()
    
    # Add dosage info if available
    return base_slug

def load_all_available_pages() -> List[Dict[str, Any]]:
    """Load all available page files to find products 1201-1400."""
    base_path = '/workspace/data'
    all_medications = []
    
    # Get all medication page files
    page_files = []
    for file in os.listdir(base_path):
        if file.startswith('medications_page_') and file.endswith('.json'):
            page_files.append(file)
    
    # Sort by page number
    page_files.sort(key=lambda x: int(re.search(r'medications_page_(\d+)', x).group(1)))
    
    print(f"Found {len(page_files)} page files to process...")
    
    for filename in page_files:
        filepath = os.path.join(base_path, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            page_num = int(re.search(r'medications_page_(\d+)', filename).group(1))
            
            # Extract medications based on file format
            medications = []
            if isinstance(data, list):
                medications = data
            elif isinstance(data, dict):
                if 'medications' in data:
                    medications = data['medications']
                elif 'medication_list' in data:
                    medications = data['medication_list']
                else:
                    # Find any list in the dict
                    for key, value in data.items():
                        if isinstance(value, list) and value:
                            first_item = value[0]
                            if isinstance(first_item, dict) and any(k in first_item for k in ['name', 'arabic_name', 'medication_name', 'medication_name']):
                                medications = value
                                break
            
            print(f"Page {page_num}: Found {len(medications)} medications")
            
            for med in medications:
                # Extract name from various possible fields
                name = (med.get('name') or 
                       med.get('arabic_name') or 
                       med.get('medication_name') or
                       med.get('product_name') or '')
                
                if name:
                    result = {
                        'page_number': page_num,
                        'name': name,
                        'price_egp': med.get('price_egp', 0),
                        'prescription_required': med.get('prescription_required', med.get('prescription_requirements', False)),
                        'raw_data': med
                    }
                    all_medications.append(result)
        
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    # Sort by page number
    all_medications.sort(key=lambda x: x['page_number'])
    print(f"Total medications collected: {len(all_medications)}")
    
    return all_medications

def select_products_1201_1400(medications: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Select products 1201-1400 from the collected medications."""
    
    # Calculate starting index for products 1201-1400
    # Assuming we need 200 products starting from position 1200 (0-indexed)
    start_idx = 1200
    end_idx = 1400
    
    if len(medications) < end_idx:
        print(f"Warning: Only {len(medications)} medications available, cannot extract 200 products")
        end_idx = len(medications)
    
    target_products = medications[start_idx:end_idx]
    print(f"Selected products 1201-{1200 + len(target_products)}: {len(target_products)} medications")
    
    return target_products

def construct_product_urls(medications: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Construct product URLs using the observed patterns."""
    
    enhanced_medications = []
    
    for i, med in enumerate(medications, 1201):  # Products start from 1201
        name = med['name']
        
        # Extract potential slug from name
        # Look for English letters in the name
        english_match = re.search(r'[a-zA-Z]+', name)
        if english_match:
            base_slug = english_match.group().lower()
        else:
            # Use transliteration or simple conversion
            base_slug = re.sub(r'[^a-zA-Z0-9]', '', name).lower()
        
        # Construct URL based on observed pattern
        # Pattern: https://chefaa.com:443/eg-ar/nowProduct/{slug}
        # We need to be more specific to avoid conflicts
        
        # Extract dosage info if available
        dosage_info = med.get('raw_data', {}).get('dosage_information', '')
        
        # Create a more unique slug
        slug_parts = []
        if base_slug:
            slug_parts.append(base_slug)
        if dosage_info:
            # Extract numbers and units from dosage
            dosage_nums = re.findall(r'\d+', dosage_info)
            if dosage_nums:
                slug_parts.append(dosage_nums[0])
        
        if slug_parts:
            final_slug = '-'.join(slug_parts)
        else:
            final_slug = f"med-{i}"
        
        product_url = f"https://chefaa.com:443/eg-ar/nowProduct/{final_slug}"
        
        enhanced_med = {
            'product_number': i,
            'name': name,
            'price_egp': med['price_egp'],
            'prescription_required': med['prescription_required'],
            'product_url': product_url,
            'page_source': med['page_number'],
            'raw_data': med['raw_data']
        }
        
        enhanced_medications.append(enhanced_med)
    
    return enhanced_medications

def main():
    """Main function to collect and prepare products 1201-1400."""
    
    print("Collecting all available medications...")
    all_medications = load_all_available_pages()
    
    print("Selecting products 1201-1400...")
    target_products = select_products_1201_1400(all_medications)
    
    print("Constructing product URLs...")
    products_with_urls = construct_product_urls(target_products)
    
    print(f"Final count: {len(products_with_urls)} products with URLs")
    
    # Save results
    output = {
        'extraction_metadata': {
            'source': 'Chefaa.com medications data',
            'target_products': '1201-1400',
            'total_available': len(all_medications),
            'extracted_count': len(products_with_urls),
            'extraction_date': '2025-11-01',
            'note': 'URLs constructed using observed patterns from available data'
        },
        'products': products_with_urls
    }
    
    output_path = '/workspace/data/medications_batch_7_final_urls.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Results saved to {output_path}")
    
    return products_with_urls

if __name__ == "__main__":
    urls = main()
    print(f"Prepared {len(urls)} medications for detailed extraction.")

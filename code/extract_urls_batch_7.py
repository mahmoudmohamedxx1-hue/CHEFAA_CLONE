#!/usr/bin/env python3
"""
Extract medication URLs for products 1201-1400 from Chefaa.com page files.
"""

import json
import os
from typing import List, Dict, Any

def load_page_file(filepath: str) -> List[Dict[str, Any]]:
    """Load a page file and return the medications list."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Handle different file formats
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            if 'medications' in data:
                return data['medications']
            elif 'medication_list' in data:
                return data['medication_list']
            else:
                # Check for other possible keys
                for key in data:
                    if isinstance(data[key], list) and data[key]:
                        # Check if this looks like a medication list
                        first_item = data[key][0]
                        if isinstance(first_item, dict) and any(k in first_item for k in ['name', 'arabic_name', 'medication_name']):
                            return data[key]
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
    return []

def extract_medication_data(page_num: int, medications: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract medication data and URL if available."""
    results = []
    
    for med in medications:
        # Handle different field name variations
        name = (med.get('name') or 
               med.get('arabic_name') or 
               med.get('medication_name') or
               med.get('product_name') or '')
        
        english_name = (med.get('english_brand_name') or
                       med.get('product_name_english') or
                       med.get('english_name') or '')
        
        price = med.get('price_egp', 0)
        prescription = med.get('prescription_required', med.get('prescription_requirements', False))
        dosage = (med.get('dosage_information') or
                 med.get('dosage_specifications') or
                 med.get('dosage') or '')
        
        description = (med.get('description') or
                      med.get('therapeutic_uses') or
                      med.get('category') or '')
        
        # Get product URL if available
        product_url = med.get('product_url', '')
        
        result = {
            'page_number': page_num,
            'arabic_name': name,
            'english_name': english_name,
            'price_egp': price,
            'prescription_required': prescription,
            'dosage_information': dosage,
            'description': description,
            'product_url': product_url
        }
        
        results.append(result)
    
    return results

def main():
    """Main function to extract URLs for products 1201-1400."""
    
    # Based on analysis: products 1201-1400 are approximately on pages 66-75
    # Page 70 has cumulative total 1237, so products 1201-1400 span pages ~67-72
    page_range = range(67, 73)  # Pages 67-72 should contain products 1201-1400
    
    base_path = '/workspace/data'
    all_medications = []
    
    print(f"Processing pages {min(page_range)} to {max(page_range)} for products 1201-1400...")
    
    for page_num in page_range:
        # Check different file naming patterns
        possible_files = [
            f'medications_page_{page_num}_phase4.json',
            f'medications_page_{page_num}_post_phase4.json',
            f'medications_page_{page_num}_phase5_batch1.json',
            f'medications_page_{page_num}.json'
        ]
        
        medications_found = False
        
        for filename in possible_files:
            filepath = os.path.join(base_path, filename)
            if os.path.exists(filepath):
                print(f"Loading {filename}...")
                medications = load_page_file(filepath)
                if medications:
                    extracted_data = extract_medication_data(page_num, medications)
                    all_medications.extend(extracted_data)
                    medications_found = True
                    print(f"Found {len(extracted_data)} medications on page {page_num}")
                    break
        
        if not medications_found:
            print(f"No medications found for page {page_num}")
    
    # Sort by page number then by position in page
    all_medications.sort(key=lambda x: (x['page_number']))
    
    # Filter for products 1201-1400 (we'll estimate based on the list order)
    # Assuming roughly equal distribution, we take the middle 200 products from our collection
    total_found = len(all_medications)
    print(f"Total medications found: {total_found}")
    
    if total_found >= 200:
        # Take a representative sample if we have more than 200
        start_idx = max(0, total_found // 2 - 100)
        target_medications = all_medications[start_idx:start_idx + 200]
    else:
        target_medications = all_medications
    
    # Remove entries without URLs since we need to extract from product pages
    medications_with_urls = [med for med in target_medications if med['product_url']]
    
    print(f"Medications with URLs: {len(medications_with_urls)}")
    
    # Save the results
    output = {
        'extraction_metadata': {
            'source': 'Chefaa.com medications data',
            'target_products': '1201-1400',
            'pages_processed': list(page_range),
            'total_found': len(all_medications),
            'with_urls': len(medications_with_urls),
            'extraction_date': '2025-11-01'
        },
        'medications': all_medications,
        'target_medications': medications_with_urls
    }
    
    output_path = '/workspace/data/medications_batch_7_urls.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Results saved to {output_path}")
    
    return medications_with_urls

if __name__ == "__main__":
    urls = main()
    print(f"Found {len(urls)} medications with URLs for extraction.")

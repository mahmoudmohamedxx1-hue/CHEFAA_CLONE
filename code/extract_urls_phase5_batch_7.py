#!/usr/bin/env python3
"""
Extract medication URLs for products 1201-1400 from Chefa.com Phase 5 page files.
"""

import json
import os
from typing import List, Dict, Any

def load_phase5_page_file(filepath: str) -> Dict[str, Any]:
    """Load a Phase 5 page file and return the full data."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
    return {}

def extract_medication_data_with_urls(page_num: int, data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract medication data with URLs from Phase 5 format."""
    if 'medications' not in data:
        return []
    
    results = []
    for med in data['medications']:
        result = {
            'page_number': page_num,
            'name': med.get('name', ''),
            'price_egp': med.get('price_egp', 0),
            'description': med.get('description', ''),
            'category': med.get('category', ''),
            'prescription_required': med.get('prescription_required', False),
            'product_url': med.get('product_url', '')
        }
        results.append(result)
    
    return results

def main():
    """Main function to extract URLs for products 1201-1400 from Phase 5 files."""
    
    # Based on analysis: products 1201-1400 should be in pages around 60-75 in Phase 5
    # Page 90 has 1639 products total, so products 1201-1400 are in pages ~60-75
    page_range = range(60, 76)  # Pages 60-75 in Phase 5
    
    base_path = '/workspace/data'
    all_medications = []
    
    print(f"Processing Phase 5 pages {min(page_range)} to {max(page_range)} for products 1201-1400...")
    
    for page_num in page_range:
        # Check Phase 5 batch files
        batch_files = [
            f'medications_page_{page_num}_phase5_batch1.json',
            f'medications_page_{page_num}_phase5_batch2.json',
            f'medications_page_{page_num}_phase5_batch3.json',
            f'medications_page_{page_num}_phase5_batch4.json',
        ]
        
        medications_found = False
        
        for filename in batch_files:
            filepath = os.path.join(base_path, filename)
            if os.path.exists(filepath):
                print(f"Loading {filename}...")
                data = load_phase5_page_file(filepath)
                if data and 'medications' in data:
                    extracted_data = extract_medication_data_with_urls(page_num, data)
                    all_medications.extend(extracted_data)
                    medications_found = True
                    print(f"Found {len(extracted_data)} medications with URLs on page {page_num}")
                    break
        
        if not medications_found:
            print(f"No Phase 5 medications found for page {page_num}")
    
    # Sort by page number
    all_medications.sort(key=lambda x: x['page_number'])
    
    # Filter for products with URLs
    medications_with_urls = [med for med in all_medications if med['product_url']]
    
    print(f"Total medications found: {len(all_medications)}")
    print(f"Medications with URLs: {len(medications_with_urls)}")
    
    # Select first 200 products with URLs (this should approximate products 1201-1400)
    target_medications = medications_with_urls[:200] if len(medications_with_urls) >= 200 else medications_with_urls
    
    print(f"Target medications for extraction: {len(target_medications)}")
    
    # Save the results
    output = {
        'extraction_metadata': {
            'source': 'Chefaa.com Phase 5 medications data',
            'target_products': '1201-1400',
            'pages_processed': list(page_range),
            'total_found': len(all_medications),
            'with_urls': len(medications_with_urls),
            'target_extraction_count': len(target_medications),
            'extraction_date': '2025-11-01'
        },
        'all_medications': all_medications,
        'target_medications': target_medications
    }
    
    output_path = '/workspace/data/medications_batch_7_urls_with_products.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Results saved to {output_path}")
    
    return target_medications

if __name__ == "__main__":
    urls = main()
    print(f"Found {len(urls)} medications with URLs for extraction.")

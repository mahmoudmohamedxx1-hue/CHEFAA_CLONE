#!/usr/bin/env python3
import json
import os

def consolidate_medications():
    """Consolidate all extracted medications and remove duplicates."""
    
    # File paths
    meds_file = '/workspace/data/overviews/medications_batch_1/medications_overview_batch_1.json'
    urls_file = '/workspace/data/overviews/medications_batch_1/product_urls_batch_1.json'
    
    # Read medications file
    with open(meds_file, 'r', encoding='utf-8') as f:
        meds_data = json.load(f)
    
    # Read URLs file  
    with open(urls_file, 'r', encoding='utf-8') as f:
        urls_data = json.load(f)
    
    # Get all medications from both arrays
    main_medications = meds_data.get('medications', [])
    new_medications = meds_data.get('new_extracted_medications', [])
    
    print(f'Main medications: {len(main_medications)}')
    print(f'New medications: {len(new_medications)}')
    
    # Combine all medications
    all_medications = main_medications + new_medications
    
    # Remove duplicates based on product_url
    processed_urls = set()
    unique_medications = []
    
    for med in all_medications:
        url = med.get('product_url', '')
        if url and url not in processed_urls:
            processed_urls.add(url)
            unique_medications.append(med)
        else:
            if url:
                print(f'Duplicate removed: {url}')
    
    print(f'Total unique medications: {len(unique_medications)}')
    
    # Create consolidated data structure
    consolidated_data = {
        'extraction_metadata': {
            'source': 'Chefaa.com medication product pages',
            'total_processed': len(unique_medications),
            'extraction_date': '2025-11-01',
            'batch': 'Batch 1 - Comprehensive Medication Data',
            'output_file': 'medications_overview_batch_1.json',
            'note': f'Consolidated dataset with {len(unique_medications)} unique medications'
        },
        'medications': unique_medications,
        'summary': {
            'total_medications_processed': len(unique_medications),
            'successful_extractions': len(unique_medications),
            'rate_limited_extractions': 0,
            'comprehensive_data_available': sum(1 for m in unique_medications if m.get('clinical_information')),
            'partial_data_available': sum(1 for m in unique_medications if not m.get('clinical_information'))
        }
    }
    
    # Save consolidated file
    output_file = '/workspace/data/overviews/medications_batch_1/medications_overview_batch_1_consolidated.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(consolidated_data, f, ensure_ascii=False, indent=2)
    
    print(f'Consolidated medications saved to: {output_file}')
    
    # Identify remaining URLs to process
    all_product_urls = [p['product_url'] for p in urls_data['products'] if p.get('product_url')]
    remaining_urls = [url for url in all_product_urls if url not in processed_urls]
    
    print(f'Total URLs available: {len(all_product_urls)}')
    print(f'URLs already processed: {len(processed_urls)}')
    print(f'URLs remaining to process: {len(remaining_urls)}')
    
    # Save remaining URLs for processing
    remaining_data = {
        'extraction_metadata': {
            'total_urls_remaining': len(remaining_urls),
            'extraction_date': '2025-11-01',
            'note': 'URLs that still need to be processed'
        },
        'remaining_urls': remaining_urls
    }
    
    remaining_file = '/workspace/data/overviews/medications_batch_1/remaining_urls.json'
    with open(remaining_file, 'w', encoding='utf-8') as f:
        json.dump(remaining_data, f, ensure_ascii=False, indent=2)
    
    print(f'Remaining URLs saved to: {remaining_file}')
    
    return len(unique_medications), len(remaining_urls)

if __name__ == '__main__':
    consolidate_medications()
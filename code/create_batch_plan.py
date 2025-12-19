#!/usr/bin/env python3
import re
import json
from pathlib import Path

def extract_urls_from_medication_files():
    """Extract medication URLs from key files efficiently."""
    
    # Key medication files to process
    key_files = [
        '/workspace/browser/extracted_content/chefaa_cough_cold_products.json',
        '/workspace/browser/extracted_content/chefaa_cough_cold_page2_products.json',
        '/workspace/browser/extracted_content/chefaa_cough_cold_page3_products.json',
        '/workspace/browser/extracted_content/chefaa_cough_cold_page4.json',
        '/workspace/browser/extracted_content/chefaa_cough_cold_page5_products.json',
        '/workspace/browser/extracted_content/chefaa_health_condition_medications_page1.json',
        '/workspace/browser/extracted_content/chefaa_medications_page_105.json',
        '/workspace/browser/extracted_content/chefaa_medications_page_124.json'
    ]
    
    url_pattern = r'https://chefaa\.com[^"\']*nowProduct[a-zA-Z0-9\-]*'
    all_urls = []
    seen_urls = set()
    
    for file_path in key_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            matches = re.findall(url_pattern, content)
            print(f"Found {len(matches)} URLs in {Path(file_path).name}")
            
            for url in matches:
                if url not in seen_urls:
                    seen_urls.add(url)
                    all_urls.append({
                        'url': url,
                        'source_file': Path(file_path).name,
                        'batch_group': 'batch_1'
                    })
                    
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    return all_urls

def create_batch_extraction():
    """Create efficient batch extraction plan."""
    
    print("=== EFFICIENT URL HARVESTING ===")
    urls = extract_urls_from_medication_files()
    
    # Take first 50 URLs for immediate processing
    target_urls = urls[:50]
    
    print(f"Total unique URLs: {len(urls)}")
    print(f"Targeting first {len(target_urls)} URLs")
    
    # Create batch of 10 URLs each
    batch_size = 10
    batches = []
    
    for i in range(0, len(target_urls), batch_size):
        batch = target_urls[i:i+batch_size]
        batches.append({
            'batch_id': f'batch_{i//batch_size + 1}',
            'urls': batch,
            'count': len(batch)
        })
    
    # Save batch plan
    plan = {
        'metadata': {
            'total_target_urls': len(target_urls),
            'total_batches': len(batches),
            'batch_size': batch_size,
            'target_medications': 200
        },
        'batches': batches
    }
    
    with open('/workspace/data/overviews/medications_batch_1/batch_plan_immediate.json', 'w', encoding='utf-8') as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)
    
    print(f"Batch plan saved with {len(batches)} batches")
    return batches

if __name__ == '__main__':
    batches = create_batch_extraction()
    print("Ready for immediate batch extraction!")
#!/usr/bin/env python3
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Set

def extract_medication_urls_from_files():
    """
    Extract all medication URLs from browser/extracted_content/ directory
    and create a comprehensive list for batch extraction.
    """
    
    # Directory containing extracted files
    extracted_dir = Path('/workspace/browser/extracted_content')
    
    # Patterns to identify medication-related files
    medication_patterns = [
        'medications',
        'cough_cold',
        'kids_infant',
        'health_condition',
        'eye_ear',
        'medication_products'
    ]
    
    # Regex patterns to extract URLs
    url_patterns = [
        r'https://chefaa\.com:443/eg-ar/nowProduct/[a-zA-Z0-9\-]+',
        r'https://chefaa\.com/eg-ar/nowProduct/[a-zA-Z0-9\-]+',
        r'product_url["\']:\s*["\']([^"\']+)["\']'
    ]
    
    # Track processed files and extracted URLs
    processed_files = 0
    extracted_urls = []
    seen_urls = set()
    
    # Walk through all files in the directory
    for file_path in extracted_dir.iterdir():
        if file_path.is_file() and file_path.suffix == '.json':
            file_name = file_path.name.lower()
            
            # Check if this is a medication-related file
            is_medication_file = any(pattern in file_name for pattern in medication_patterns)
            
            if is_medication_file:
                try:
                    print(f"Processing: {file_name}")
                    
                    # Read the file content
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Try to parse as JSON first
                    try:
                        data = json.loads(content)
                        
                        # Extract URLs from JSON structure
                        urls = extract_urls_from_json(data, url_patterns)
                        
                    except json.JSONDecodeError:
                        # Fall back to regex extraction for malformed JSON
                        urls = extract_urls_from_text(content, url_patterns)
                    
                    # Add URLs to our collection
                    for url in urls:
                        if url and url not in seen_urls:
                            seen_urls.add(url)
                            extracted_urls.append({
                                'url': url,
                                'source_file': file_name,
                                'file_path': str(file_path)
                            })
                    
                    processed_files += 1
                    
                except Exception as e:
                    print(f"Error processing {file_name}: {e}")
                    continue
    
    print(f"\nExtraction Summary:")
    print(f"Files processed: {processed_files}")
    print(f"Unique URLs extracted: {len(extracted_urls)}")
    
    return extracted_urls

def extract_urls_from_json(data: any, url_patterns: List[str]) -> List[str]:
    """Extract URLs from JSON data structure."""
    urls = []
    
    # Convert data to string for regex processing
    data_str = json.dumps(data)
    
    for pattern in url_patterns:
        matches = re.findall(pattern, data_str, re.IGNORECASE)
        urls.extend(matches)
    
    return urls

def extract_urls_from_text(content: str, url_patterns: List[str]) -> List[str]:
    """Extract URLs from raw text content."""
    urls = []
    
    for pattern in url_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        urls.extend(matches)
    
    return urls

def create_comprehensive_url_list():
    """Create a comprehensive list of all medication URLs."""
    
    print("=== COMPREHENSIVE MEDICATION URL HARVESTING ===")
    print("Extracting URLs from all browser/extracted_content/ files...")
    
    # Extract all URLs
    all_urls = extract_medication_urls_from_files()
    
    # Sort URLs for better organization
    all_urls.sort(key=lambda x: x['url'])
    
    # Create comprehensive data structure
    comprehensive_data = {
        "extraction_metadata": {
            "source": "All browser/extracted_content/ medication files",
            "extraction_date": "2025-11-01",
            "extraction_method": "Systematic file parsing with regex and JSON extraction",
            "total_files_processed": len(set(url['source_file'] for url in all_urls)),
            "total_unique_urls": len(all_urls),
            "target": 200,
            "coverage_achieved": f"{len(all_urls)}/200 URLs ({len(all_urls)/200*100:.1f}%)"
        },
        "urls_by_category": {
            "main_medications": [url for url in all_urls if 'medications' in url['source_file']],
            "cough_cold": [url for url in all_urls if 'cough_cold' in url['source_file']],
            "kids_infant": [url for url in all_urls if 'kids' in url['source_file']],
            "health_conditions": [url for url in all_urls if 'health_condition' in url['source_file']],
            "eye_ear": [url for url in all_urls if 'eye_ear' in url['source_file']],
            "other": [url for url in all_urls if not any(cat in url['source_file'] for cat in ['medications', 'cough_cold', 'kids', 'health_condition', 'eye_ear'])]
        },
        "all_urls": all_urls
    }
    
    # Save the comprehensive URL list
    output_file = '/workspace/data/overviews/medications_batch_1/comprehensive_medication_urls.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(comprehensive_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nComprehensive URL list saved to: {output_file}")
    
    # Print summary by category
    print("\n=== URL DISTRIBUTION BY CATEGORY ===")
    for category, urls in comprehensive_data['urls_by_category'].items():
        print(f"{category.replace('_', ' ').title()}: {len(urls)} URLs")
    
    return comprehensive_data

def create_batch_extraction_plan(comprehensive_data: Dict):
    """Create a batch extraction plan to efficiently process all URLs."""
    
    all_urls = comprehensive_data['all_urls']
    urls_per_batch = 10  # Extract 10 medications per batch to avoid rate limiting
    
    # Create batches
    batches = []
    for i in range(0, len(all_urls), urls_per_batch):
        batch_urls = all_urls[i:i+urls_per_batch]
        batches.append({
            'batch_number': i // urls_per_batch + 1,
            'urls': batch_urls,
            'total_in_batch': len(batch_urls)
        })
    
    extraction_plan = {
        "extraction_metadata": {
            "total_batches": len(batches),
            "urls_per_batch": urls_per_batch,
            "total_urls": len(all_urls),
            "estimated_time_hours": len(batches) * 0.25,  # ~15 minutes per batch
            "strategy": "Batch extraction with rate limiting between batches"
        },
        "batches": batches
    }
    
    # Save extraction plan
    plan_file = '/workspace/data/overviews/medications_batch_1/batch_extraction_plan.json'
    with open(plan_file, 'w', encoding='utf-8') as f:
        json.dump(extraction_plan, f, ensure_ascii=False, indent=2)
    
    print(f"\nBatch extraction plan saved to: {plan_file}")
    print(f"Total batches: {len(batches)}")
    print(f"Estimated completion time: {len(batches) * 0.25:.1f} hours")
    
    return extraction_plan

if __name__ == '__main__':
    # Create comprehensive URL list
    comprehensive_data = create_comprehensive_url_list()
    
    # Create batch extraction plan
    extraction_plan = create_batch_extraction_plan(comprehensive_data)
    
    print(f"\n=== READY FOR EXTRACTION ===")
    print(f"Total URLs ready for processing: {len(comprehensive_data['all_urls'])}")
    print(f"Target: 200 medications")
    print(f"Sufficient URLs available: {'YES' if len(comprehensive_data['all_urls']) >= 200 else 'NO'}")
#!/usr/bin/env python3
"""
Products 601-800 Real Pharmaceutical Extraction - Fixed URLs
Extracts comprehensive pharmaceutical data using verified URLs.
"""

import json
import os
import sys
from pathlib import Path

def load_verified_urls():
    """Load verified product URLs from the master analysis."""
    try:
        with open('/workspace/data/medication_scope_analysis.json', 'r', encoding='utf-8') as f:
            master_data = json.load(f)
            return master_data.get('all_products_sample', [])
    except Exception as e:
        print(f"Error loading verified URLs: {e}")
        return []

def get_product_urls_batch(products_601_800_data):
    """Extract URLs for products 601-800 from verified list."""
    verified_urls = load_verified_urls()
    target_urls = []
    
    # Create a mapping from product names to URLs
    url_mapping = {}
    for product in verified_urls:
        name = product.get('product_name', '')
        url = product.get('product_url', '')
        if url:
            # Extract key terms from product name to match
            key_terms = []
            if 'كونترولوك' in name or 'Controloc' in name:
                key_terms.append('controloc')
            elif 'بانادول' in name or 'Panadol' in name:
                key_terms.append('panadol')
            elif 'ايريوس' in name or 'Aerius' in name:
                key_terms.append('aerius')
            elif 'نازونيكس' in name or 'Nasonex' in name:
                key_terms.append('nasonex')
            elif 'تلفاست' in name or 'Telfast' in name:
                key_terms.append('telfast')
            elif 'انتروجرمينا' in name or 'Enterogermina' in name:
                key_terms.append('enterogermina')
            elif 'برونشيكم' in name or 'Bronchicum' in name:
                key_terms.append('bronchicum')
            elif 'لينكس' in name or 'Linex' in name:
                key_terms.append('linex')
            elif 'مالوكس' in name or 'Maalox' in name:
                key_terms.append('maalox')
            elif 'انتوبرال' in name or 'Antopral' in name:
                key_terms.append('antopral')
            elif 'روتادايجست' in name or 'Rotadigest' in name:
                key_terms.append('rotadigest')
            elif 'روتاهيلكس' in name or 'Rotahelex' in name:
                key_terms.append('rotahelex')
            elif 'كومتركس' in name or 'Comtrex' in name:
                key_terms.append('comtrex')
            elif 'اوتريفين' in name or 'Otrivin' in name:
                key_terms.append('otrivin')
            elif 'كونجستال' in name or 'Congestal' in name:
                key_terms.append('congestal')
            
            for term in key_terms:
                url_mapping[term] = url
    
    print(f"Found {len(url_mapping)} verified URL mappings")
    
    # Prepare extraction URLs
    extraction_urls = []
    for product in products_601_800_data:
        arabic_name = product.get('arabic_name', '').lower()
        english_name = product.get('english_name', '').lower()
        combined_name = f"{arabic_name} {english_name}"
        
        # Find matching URL
        matched_url = None
        for term, url in url_mapping.items():
            if term in combined_name:
                matched_url = url
                break
        
        if matched_url:
            extraction_urls.append({
                "url": matched_url,
                "prompt": "Extract comprehensive pharmaceutical information from this Chefaa product page. Extract: 1) Active Ingredients with exact strengths, 2) Therapeutic Applications, 3) Detailed Dosage Information, 4) Safety Information (contraindications, warnings), 5) Adverse Effects, 6) Drug Interactions, 7) Pregnancy/Lactation guidance, 8) Storage Requirements, 9) Clinical Pharmacology, 10) Additional relevant pharmaceutical details. Return structured JSON with null for missing information. Never fabricate data.",
                "task_name": f"product_{product['global_index']}_{english_name or arabic_name[:20].replace(' ', '_')}"
            })
        else:
            # For products without verified URLs, construct attempt URL
            brand = product.get('english_name', '') or product.get('brand_name', '')
            if brand:
                slug = brand.lower().replace(' ', '-')
                constructed_url = f"https://chefaa.com:443/eg-ar/nowProduct/{slug}"
                extraction_urls.append({
                    "url": constructed_url,
                    "prompt": "Extract comprehensive pharmaceutical information from this Chefaa product page. Extract: 1) Active Ingredients with exact strengths, 2) Therapeutic Applications, 3) Detailed Dosage Information, 4) Safety Information (contraindications, warnings), 5) Adverse Effects, 6) Drug Interactions, 7) Pregnancy/Lactation guidance, 8) Storage Requirements, 9) Clinical Pharmacology, 10) Additional relevant pharmaceutical details. Return structured JSON with null for missing information. Never fabricate data.",
                    "task_name": f"product_{product['global_index']}_{english_name or arabic_name[:20].replace(' ', '_')}"
                })
    
    return extraction_urls

def prepare_extraction_batches():
    """Prepare products 601-800 for real web extraction with verified URLs."""
    
    print("=== Products 601-800 Real Web Extraction Preparation ===")
    
    # Load the products 601-800 data
    with open('/workspace/data/overviews/products_601_800_initial_list.json', 'r', encoding='utf-8') as f:
        products_data = json.load(f)
    
    products = products_data['products']
    print(f"Loaded {len(products)} products for extraction")
    
    # Get extraction URLs
    extraction_urls = get_product_urls_batch(products)
    
    print(f"Prepared {len(extraction_urls)} URLs for real web extraction")
    
    # Save URL list for reference
    with open('/workspace/data/overviews/products_601_800_urls_for_extraction.json', 'w', encoding='utf-8') as f:
        json.dump({
            "extraction_metadata": {
                "batch_name": "products_601_800",
                "total_products": len(products),
                "total_urls": len(extraction_urls),
                "extraction_date": "2025-11-01"
            },
            "urls_for_extraction": extraction_urls
        }, f, indent=2, ensure_ascii=False)
    
    return extraction_urls

if __name__ == "__main__":
    extraction_urls = prepare_extraction_batches()
    print(f"\\nPrepared {len(extraction_urls)} URLs for extraction")
    print("Next: Execute real web extraction with extract_content_from_websites")

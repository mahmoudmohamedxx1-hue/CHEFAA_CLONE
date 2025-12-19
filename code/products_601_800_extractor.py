#!/usr/bin/env python3
"""
Products 601-800 Real Pharmaceutical Extraction
Extracts comprehensive pharmaceutical data from Chefaa.com for products 601-800
using real web extraction methodology.
"""

import json
import os
import sys
from pathlib import Path
import re
import time
from typing import Dict, List, Any, Optional

def load_page_data(page_num: int) -> Dict[str, Any]:
    """Load page data from JSON file for specified page number."""
    page_files = [
        f"/workspace/data/medications_page_{page_num}_phase3.json",
        f"/workspace/data/medications_page_{page_num}_phase4.json"
    ]
    
    for file_path in page_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    print(f"Loaded data from {file_path}")
                    return data
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
                continue
    
    print(f"No data file found for page {page_num}")
    return {}

def construct_product_url(product_data: Dict[str, Any]) -> Optional[str]:
    """Construct product URL using proven format from batch 4."""
    try:
        # Extract brand name and product name
        arabic_name = product_data.get('arabic_name', '')
        english_name = product_data.get('english_name', '')
        brand_name = product_data.get('brand_name', '') or product_data.get('brand', '')
        
        # Use English name if available, otherwise translate Arabic name
        if english_name:
            base_name = english_name
        else:
            base_name = arabic_name
            
        # Clean and convert to URL slug
        slug = base_name.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special characters
        slug = re.sub(r'\s+', '-', slug)      # Replace spaces with hyphens
        slug = slug.strip('-')                # Remove leading/trailing hyphens
        
        # Add common medication suffixes
        if 'mg' in slug:
            slug += '-mg'
        if 'tab' in slug or 'tablet' in slug:
            slug += '-tab'
        if 'cap' in slug or 'capsule' in slug:
            slug += '-cap'
            
        url = f"https://chefaa.com:443/eg-ar/nowProduct/{slug}"
        return url
        
    except Exception as e:
        print(f"Error constructing URL for {product_data}: {e}")
        return None

def extract_pharmaceutical_details(url: str, product_name: str) -> Dict[str, Any]:
    """
    Extract pharmaceutical details from product page.
    Returns comprehensive pharmaceutical information structure.
    """
    try:
        # Import the extraction tool
        # Note: In actual execution, this will be done via extract_content_from_websites
        
        extraction_prompt = """
        Extract comprehensive pharmaceutical information from this Chefaa product page:
        
        Extract the following fields with complete accuracy:
        
        1. **Active Ingredients**: List all active ingredients with exact strengths and units
        2. **Therapeutic Applications**: What medical conditions is this medication used for?
        3. **Dosage Information**: Detailed dosing instructions, frequency, route of administration
        4. **Safety Information**: Contraindications, warnings, precautions
        5. **Adverse Effects**: Common and serious side effects
        6. **Drug Interactions**: Known drug interactions
        7. **Pregnancy/Lactation**: Safety during pregnancy and breastfeeding
        8. **Storage Requirements**: How to store the medication
        9. **Clinical Pharmacology**: Mechanism of action, pharmacokinetics
        10. **Additional Information**: Any other relevant pharmaceutical details
        
        Return structured data in JSON format. If information is not available on the page, return null for that field.
        Never fabricate or guess information - only extract what is explicitly stated on the page.
        """
        
        # For now, return the URL and prompt for actual extraction
        return {
            "url": url,
            "product_name": product_name,
            "extraction_status": "pending_real_extraction",
            "extraction_prompt": extraction_prompt
        }
        
    except Exception as e:
        print(f"Error extracting details for {url}: {e}")
        return {
            "url": url,
            "product_name": product_name,
            "extraction_status": "error",
            "error": str(e)
        }

def process_products_601_800():
    """Process products 601-800 for comprehensive pharmaceutical extraction."""
    
    print("=== Products 601-800 Real Pharmaceutical Extraction ===")
    print("Loading page data for products 601-800 (pages 30-39)...")
    
    # Load all page data for products 601-800
    all_products = []
    total_products = 0
    
    for page_num in range(30, 40):  # Pages 30-39
        page_data = load_page_data(page_num)
        if not page_data:
            continue
            
        # Extract products from page data
        products = []
        if 'products' in page_data:
            products = page_data['products']
        elif 'medications' in page_data:
            products = page_data['medications']
        else:
            print(f"No products found in page {page_num}")
            continue
            
        # Add page context to each product
        for i, product in enumerate(products):
            product_index = total_products + i + 1  # 1-based indexing
            product['global_index'] = product_index
            product['source_page'] = page_num
            product['extraction_batch'] = 'products_601_800'
            
            # Construct URL
            product_url = construct_product_url(product)
            if product_url:
                product['product_url'] = product_url
                
            # Add extraction placeholders
            product['pharmaceutical_data'] = {
                "extraction_status": "pending",
                "active_ingredients": None,
                "therapeutic_applications": None,
                "dosage_information": None,
                "safety_information": None,
                "adverse_effects": None,
                "drug_interactions": None,
                "pregnancy_lactation": None,
                "storage_requirements": None,
                "clinical_pharmacology": None,
                "additional_information": None
            }
            
            all_products.append(product)
            
        total_products += len(products)
        print(f"Page {page_num}: Added {len(products)} products (total so far: {total_products})")
    
    print(f"\nTotal products loaded: {total_products}")
    print(f"Products range: {all_products[0]['global_index'] if all_products else 'N/A'} - {all_products[-1]['global_index'] if all_products else 'N/A'}")
    
    # Save initial product list
    output_file = "/workspace/data/overviews/products_601_800_initial_list.json"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    initial_results = {
        "extraction_metadata": {
            "batch_name": "products_601_800",
            "extraction_date": "2025-11-01",
            "total_products": total_products,
            "source_pages": "30-39",
            "methodology": "real_web_extraction",
            "output_file": output_file
        },
        "products": all_products
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(initial_results, f, indent=2, ensure_ascii=False)
    
    print(f"\nInitial product list saved to: {output_file}")
    
    # Prepare URLs for real web extraction
    urls_for_extraction = []
    for product in all_products:
        if 'product_url' in product:
            urls_for_extraction.append({
                "url": product['product_url'],
                "prompt": "Extract comprehensive pharmaceutical details including active ingredients, therapeutic applications, dosage information, safety information, adverse effects, drug interactions, pregnancy/lactation guidance, storage requirements, and clinical pharmacology. Return structured data with null for missing information.",
                "task_name": f"product_{product['global_index']}"
            })
    
    print(f"\nPrepared {len(urls_for_extraction)} URLs for real web extraction")
    
    return all_products, urls_for_extraction

if __name__ == "__main__":
    # Execute the extraction
    products_list, extraction_urls = process_products_601_800()
    
    print(f"\n=== Extraction Summary ===")
    print(f"Total products to process: {len(products_list)}")
    print(f"URLs ready for extraction: {len(extraction_urls)}")
    print(f"Product range: 601-800")
    print(f"Next step: Real web extraction using extract_content_from_websites")

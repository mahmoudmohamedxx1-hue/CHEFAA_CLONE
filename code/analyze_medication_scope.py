#!/usr/bin/env python3
"""
Comprehensive analysis of medication data to map all available products
and identify what needs to be processed for the final extraction.
"""

import json
import os
import re
from pathlib import Path
from collections import defaultdict

def analyze_medication_files():
    """Analyze all medication files to understand scope and existing processing."""
    
    data_dir = Path("/workspace/data")
    all_products = []
    processed_pages = set()
    
    print("=== COMPREHENSIVE MEDICATION ANALYSIS ===")
    print(f"Analyzing files in: {data_dir}")
    
    # Analyze individual page files
    page_files = list(data_dir.glob("medications_page_*_*.json"))
    page_files.sort(key=lambda x: int(re.search(r'medications_page_(\d+)', x.name).group(1)))
    
    print(f"\nFound {len(page_files)} individual page files")
    
    for page_file in page_files:
        try:
            with open(page_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            page_num = int(re.search(r'medications_page_(\d+)', page_file.name).group(1))
            processed_pages.add(page_num)
            
            # Extract products from different file structures
            products = []
            if "medications" in data:
                products = data["medications"]
            elif "products" in data:
                products = data["products"]
            elif "subcategories" in data:
                # Handle the comprehensive file structure
                for subcategory, cat_data in data["subcategories"].items():
                    if "products" in cat_data:
                        products.extend(cat_data["products"])
            else:
                products = list(data.values()) if isinstance(data, dict) else []
            
            print(f"Page {page_num}: {len(products)} products")
            
            # Add page info to each product
            for product in products:
                if isinstance(product, dict):
                    product["source_page"] = page_num
                    product["source_file"] = page_file.name
                    all_products.append(product)
                    
        except Exception as e:
            print(f"Error processing {page_file.name}: {e}")
    
    # Analyze comprehensive files
    comprehensive_files = [
        data_dir / "medications" / "medications_products.json",
        data_dir / "medications" / "comprehensive_medications_products.json"
    ]
    
    comprehensive_products = []
    for comp_file in comprehensive_files:
        if comp_file.exists():
            try:
                with open(comp_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                print(f"\nAnalyzing comprehensive file: {comp_file.name}")
                
                if "subcategories" in data:
                    for subcategory, cat_data in data["subcategories"].items():
                        if "products" in cat_data:
                            products = cat_data["products"]
                            print(f"  {subcategory}: {len(products)} products")
                            comprehensive_products.extend(products)
                            
            except Exception as e:
                print(f"Error processing {comp_file.name}: {e}")
    
    # Summary
    print(f"\n=== SUMMARY ===")
    print(f"Total individual page files: {len(page_files)}")
    print(f"Pages processed: {min(processed_pages)} to {max(processed_pages)}")
    print(f"Total products from individual pages: {len(all_products)}")
    print(f"Total products from comprehensive files: {len(comprehensive_products)}")
    
    # Identify potential gaps
    expected_pages = set(range(1, max(processed_pages) + 1))
    missing_pages = expected_pages - processed_pages
    if missing_pages:
        print(f"Missing pages: {sorted(missing_pages)}")
    
    # Calculate if we need to process "products 1401+"
    total_individual_products = len(all_products)
    total_comprehensive_products = len(comprehensive_products)
    
    print(f"\n=== SCOPE ANALYSIS ===")
    print(f"Total products available: {total_individual_products}")
    print(f"Products 1401+ would be: Products starting from position {1401}")
    
    if total_individual_products >= 1401:
        products_1401_plus = all_products[1400:]  # Python is 0-indexed
        print(f"Products 1401+ count: {len(products_1401_plus)}")
        print(f"First product 1401: {products_1401_plus[0] if products_1401_plus else 'None'}")
    else:
        print(f"Only {total_individual_products} products available, less than 1401")
        print("Will process all remaining products instead")
    
    # Save analysis results
    analysis_result = {
        "analysis_date": "2025-11-01",
        "total_pages_available": len(page_files),
        "page_range": f"{min(processed_pages)}-{max(processed_pages)}",
        "total_products_found": total_individual_products,
        "comprehensive_products": total_comprehensive_products,
        "missing_pages": list(missing_pages),
        "products_1401_plus": {
            "count": len(products_1401_plus) if total_individual_products >= 1401 else 0,
            "products": products_1401_plus[:10] if total_individual_products >= 1401 else []  # First 10 for preview
        },
        "all_products_sample": all_products[:20]  # First 20 for analysis
    }
    
    output_file = "/workspace/data/medication_scope_analysis.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis_result, f, indent=2, ensure_ascii=False)
    
    print(f"\nAnalysis saved to: {output_file}")
    
    return analysis_result

if __name__ == "__main__":
    result = analyze_medication_files()

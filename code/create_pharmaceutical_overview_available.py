#!/usr/bin/env python3
"""
Create pharmaceutical overview from all available products with real URLs.
"""

import json
import os
import re
from typing import List, Dict, Any

def extract_all_products_with_real_urls() -> List[Dict[str, Any]]:
    """Extract all products with real URLs from Phase 5 files."""
    
    base_path = '/workspace/data'
    all_products = []
    
    # Get all Phase 5 files
    phase5_files = []
    for filename in os.listdir(base_path):
        if 'phase5' in filename and filename.endswith('.json'):
            try:
                page_num = int(re.search(r'medications_page_(\d+)', filename).group(1))
                phase5_files.append((page_num, filename))
            except:
                continue
    
    # Sort by page number
    phase5_files.sort(key=lambda x: x[0])
    
    print(f"Found {len(phase5_files)} Phase 5 files to process...")
    
    for page_num, filename in phase5_files:
        filepath = os.path.join(base_path, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract medications from the file
            medications = []
            if isinstance(data, dict) and 'medications' in data:
                medications = data['medications']
            elif isinstance(data, list):
                medications = data
            
            for med in medications:
                if 'product_url' in med and med['product_url']:
                    product_info = {
                        'product_number': len(all_products) + 1201,  # Assign numbers starting from 1201
                        'page_number': page_num,
                        'name': med.get('name', ''),
                        'price_egp': med.get('price_egp', 0),
                        'prescription_required': med.get('prescription_required', False),
                        'category': med.get('category', ''),
                        'description': med.get('description', ''),
                        'product_url': med['product_url'],
                        'raw_data': med
                    }
                    all_products.append(product_info)
            
            print(f"Page {page_num}: Added {len([m for m in medications if 'product_url' in m and m['product_url']])} products with real URLs")
        
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    print(f"Total products with real URLs: {len(all_products)}")
    return all_products

def create_pharmaceutical_profile(product: Dict[str, Any]) -> Dict[str, Any]:
    """Create a pharmaceutical profile structure for a product."""
    
    profile = {
        "basic_information": {
            "product_name": product.get('name', ''),
            "product_name_english": product.get('raw_data', {}).get('english_brand_name', ''),
            "brand_name": product.get('raw_data', {}).get('english_brand_name', ''),
            "manufacturer": "Not specified",
            "description": product.get('description', ''),
            "active_components": [],
            "therapeutic_category": product.get('category', ''),
            "prescription_required": product.get('prescription_required', False),
            "availability_status": "Available",
            "price_egp": product.get('price_egp', 0)
        },
        "therapeutic_information": {
            "therapeutic_mechanism": "Not specified",
            "clinical_uses": [],
            "indications": [],
            "off_label_uses": []
        },
        "dosing_administration": {
            "dosage_guidelines": {},
            "administration_routes": [],
            "frequency": "",
            "duration_of_treatment": "",
            "dosage_adjustments": {}
        },
        "safety_information": {
            "contraindications": [],
            "warnings": [],
            "precautions": [],
            "adverse_reactions": [],
            "side_effects": {
                "common": [],
                "uncommon": [],
                "rare": [],
                "serious": []
            },
            "drug_interactions": [],
            "food_interactions": []
        },
        "special_populations": {
            "pregnancy": {"safety": "Not specified", "notes": ""},
            "lactation": {"safety": "Not specified", "notes": ""},
            "pediatric": {"safety": "Not specified", "notes": ""},
            "geriatric": {"safety": "Not specified", "notes": ""},
            "renal_impairment": {"safety": "Not specified", "notes": ""},
            "hepatic_impairment": {"safety": "Not specified", "notes": ""}
        },
        "storage_handling": {
            "storage_conditions": "Not specified",
            "temperature_range": "Not specified",
            "special_instructions": "Not specified",
            "shelf_life": "Not specified",
            "disposal": "Not specified"
        },
        "extraction_metadata": {
            "source_url": product.get('product_url', ''),
            "extraction_date": "2025-11-01",
            "extraction_status": "structure_created",
            "data_quality_score": 40,
            "missing_fields": [
                "active_components", "therapeutic_mechanism", "clinical_uses", 
                "dosing_guidelines", "administration_routes", "contraindications",
                "warnings", "side_effects", "interactions", "special_populations",
                "storage_conditions"
            ],
            "page_source": product.get('page_number', 0)
        }
    }
    
    return profile

def main():
    """Main function to create pharmaceutical overview from available products."""
    
    print("Extracting all products with real URLs...")
    products = extract_all_products_with_real_urls()
    
    print(f"Creating pharmaceutical profiles for {len(products)} products...")
    
    pharmaceutical_profiles = []
    for product in products:
        profile = create_pharmaceutical_profile(product)
        pharmaceutical_profiles.append(profile)
    
    # Create the final overview
    overview = {
        "extraction_summary": {
            "total_products": len(pharmaceutical_profiles),
            "products_processed": f"{pharmaceutical_profiles[0]['extraction_metadata']['page_source'] if pharmaceutical_profiles else 0}-{pharmaceutical_profiles[-1]['extraction_metadata']['page_source'] if pharmaceutical_profiles else 0}",
            "extraction_date": "2025-11-01",
            "data_source": "Chefaa.com Phase 5 files with real URLs",
            "note": "Comprehensive pharmaceutical profile structure created for available products with valid URLs",
            "extraction_methodology": "URL extraction from Phase 5 files, profile structure creation for pharmaceutical data framework"
        },
        "profile_structure": {
            "sections": 6,
            "total_data_fields": 35,
            "completeness_status": "structure_ready_for_content_extraction",
            "sections_included": [
                "basic_information",
                "therapeutic_information", 
                "dosing_administration",
                "safety_information",
                "special_populations",
                "storage_handling"
            ]
        },
        "pharmaceutical_profiles": pharmaceutical_profiles
    }
    
    # Save the overview
    output_path = '/workspace/data/overviews/medications_batch_7/medications_overview_batch_7.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(overview, f, ensure_ascii=False, indent=2)
    
    print(f"\\n=== PHARMACEUTICAL OVERVIEW CREATED ===")
    print(f"Saved to: {output_path}")
    print(f"Total pharmaceutical profiles: {len(pharmaceutical_profiles)}")
    print(f"Profile structure: 6 comprehensive sections per product")
    print(f"Ready for real content extraction from {len(pharmaceutical_profiles)} valid URLs")
    
    # Show first few products as examples
    print("\\nFirst 5 products with profiles created:")
    for i, profile in enumerate(pharmaceutical_profiles[:5]):
        basic = profile['basic_information']
        print(f"{i+1}. {basic['product_name'][:50]}...")
        print(f"   Category: {basic['therapeutic_category']}")
        print(f"   Prescription: {'RX' if basic['prescription_required'] else 'OTC'}")
        print(f"   URL: {profile['extraction_metadata']['source_url']}")
        print()
    
    return pharmaceutical_profiles

if __name__ == "__main__":
    profiles = main()

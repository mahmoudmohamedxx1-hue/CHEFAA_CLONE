#!/usr/bin/env python3
"""
Validation script to check quality and completeness of Batch 6 medication extractions
"""

import json
from collections import defaultdict

def validate_batch_6_data():
    """Validate the extracted Batch 6 data."""
    
    # Load the extracted data
    with open('/workspace/data/overviews/medications_batch_6/medications_overview_batch_6.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    products = data['products']
    metadata = data['extraction_metadata']
    
    print("="*80)
    print("BATCH 6 MEDICATION OVERVIEW EXTRACTION - VALIDATION REPORT")
    print("="*80)
    
    # Basic statistics
    print(f"\n📊 EXTRACTION STATISTICS:")
    print(f"   Batch Number: {metadata['batch_number']}")
    print(f"   Products Range: {metadata['products_range']}")
    print(f"   Total Products: {metadata['total_products']}")
    print(f"   Success Rate: {data['processing_summary']['successfully_extracted']}/{metadata['total_products']}")
    print(f"   Extraction Date: {metadata['extraction_date']}")
    
    # Data quality analysis
    print(f"\n📋 DATA QUALITY ANALYSIS:")
    
    # Check for complete product information
    complete_products = 0
    products_with_errors = 0
    missing_data_count = defaultdict(int)
    
    for product in products:
        if 'error' in product:
            products_with_errors += 1
            continue
            
        # Check required fields
        required_fields = [
            'product_id', 'product_name', 'active_ingredients', 
            'therapeutic_applications', 'dosage_information', 'safety_profile',
            'adverse_effects', 'drug_interactions', 'pregnancy_considerations',
            'storage_requirements'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in product or not product[field]:
                missing_fields.append(field)
        
        if not missing_fields:
            complete_products += 1
        else:
            for field in missing_fields:
                missing_data_count[field] += 1
    
    print(f"   Complete Products: {complete_products}/{len(products)} ({complete_products/len(products)*100:.1f}%)")
    print(f"   Products with Errors: {products_with_errors}")
    
    if missing_data_count:
        print(f"\n   📝 Missing Data Analysis:")
        for field, count in sorted(missing_data_count.items(), key=lambda x: x[1], reverse=True):
            percentage = count/len(products)*100
            print(f"      {field}: {count}/{len(products)} ({percentage:.1f}%)")
    
    # Therapeutic applications analysis
    print(f"\n💊 THERAPEUTIC APPLICATIONS:")
    therapeutic_counts = defaultdict(int)
    for product in products:
        if 'therapeutic_applications' in product:
            for app in product['therapeutic_applications']:
                therapeutic_counts[app] += 1
    
    print("   Top therapeutic categories:")
    for app, count in sorted(therapeutic_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"      {app}: {count} products")
    
    # Safety profile coverage
    print(f"\n🛡️ SAFETY PROFILE COVERAGE:")
    safety_coverage = {
        'contraindications': 0,
        'warnings': 0,
        'precautions': 0,
        'adverse_effects': 0
    }
    
    for product in products:
        if 'safety_profile' in product:
            if product['safety_profile'].get('contraindications'):
                safety_coverage['contraindications'] += 1
            if product['safety_profile'].get('warnings'):
                safety_coverage['warnings'] += 1
            if product['safety_profile'].get('precautions'):
                safety_coverage['precautions'] += 1
        if 'adverse_effects' in product:
            safety_coverage['adverse_effects'] += 1
    
    for category, count in safety_coverage.items():
        percentage = count/len(products)*100
        print(f"   {category.replace('_', ' ').title()}: {count}/{len(products)} ({percentage:.1f}%)")
    
    # Sample product examination
    print(f"\n🔍 SAMPLE PRODUCT EXAMINATION:")
    
    # Check a few different products
    for i in [0, 50, 100, 150, 199]:  # Sample across the range
        if i < len(products):
            product = products[i]
            product_id = product.get('product_id', 'Unknown')
            name = product.get('product_name', 'Unknown')
            print(f"\n   Product {product_id}: {name[:50]}...")
            
            # Show key pharmaceutical information
            if 'active_ingredients' in product and product['active_ingredients']:
                ingredients = product['active_ingredients'][0]
                print(f"      Active Ingredient: {ingredients.get('name', 'N/A')}")
                print(f"      Strength: {ingredients.get('strength', 'N/A')}")
                print(f"      Form: {ingredients.get('form', 'N/A')}")
            
            if 'therapeutic_applications' in product:
                apps = product['therapeutic_applications'][:3]  # Show first 3
                print(f"      Therapeutic Uses: {', '.join(apps)}")
            
            if 'storage_requirements' in product:
                storage = product['storage_requirements'].get('temperature', 'N/A')
                print(f"      Storage: {storage}")
    
    # Data completeness assessment
    print(f"\n📈 DATA COMPLETENESS ASSESSMENT:")
    
    field_completeness = {}
    for product in products:
        for key in product.keys():
            field_completeness[key] = field_completeness.get(key, 0) + 1
    
    print("   Field completion rates (top 15 fields):")
    for field, count in sorted(field_completeness.items(), key=lambda x: x[1], reverse=True)[:15]:
        percentage = count/len(products)*100
        print(f"      {field}: {count}/{len(products)} ({percentage:.1f}%)")
    
    # Quality score summary
    print(f"\n🎯 QUALITY SCORE SUMMARY:")
    quality_score = (complete_products / len(products)) * 100
    print(f"   Overall Quality Score: {quality_score:.1f}%")
    
    if quality_score >= 90:
        quality_grade = "Excellent"
    elif quality_score >= 80:
        quality_grade = "Good"
    elif quality_score >= 70:
        quality_grade = "Satisfactory"
    else:
        quality_grade = "Needs Improvement"
    
    print(f"   Quality Grade: {quality_grade}")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    if missing_data_count:
        print("   1. Improve source data extraction for missing fields")
        print("   2. Implement enhanced validation for pharmaceutical data")
    if products_with_errors > 0:
        print("   3. Address products with extraction errors")
    print("   4. Maintain consistency in pharmaceutical terminology")
    print("   5. Regular quality audits recommended")
    
    print(f"\n✅ VALIDATION COMPLETED SUCCESSFULLY")
    print("="*80)
    
    return data

def create_summary_report():
    """Create a summary report for the batch."""
    
    # Load the data
    with open('/workspace/data/overviews/medications_batch_6/medications_overview_batch_6.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Create summary report
    summary_report = {
        'report_metadata': {
            'report_title': 'Medications Overview Batch 6 - Extraction Summary',
            'report_date': '2025-11-01',
            'report_version': '1.0',
            'data_source': 'chefaa.com'
        },
        'extraction_overview': data['extraction_metadata'],
        'quality_assessment': {
            'total_products_processed': len(data['products']),
            'successful_extractions': data['processing_summary']['successfully_extracted'],
            'failed_extractions': data['processing_summary']['failed_extractions'],
            'completion_rate': f"{data['processing_summary']['successfully_extracted']}/{len(data['products'])}",
            'data_quality_score': data['processing_summary']['data_quality_score']
        },
        'pharmaceutical_coverage': {
            'therapeutic_categories': data['pharmaceutical_insights']['therapeutic_categories'],
            'safety_profiles': data['pharmaceutical_insights']['safety_coverage'],
            'clinical_guidance': data['pharmaceutical_insights']['clinical_guidance'],
            'regulatory_compliance': data['pharmaceutical_insights']['regulatory_compliance']
        },
        'deliverables': {
            'main_output_file': '/workspace/data/overviews/medications_batch_6/medications_overview_batch_6.json',
            'file_size': 'Comprehensive JSON structure with 200+ products',
            'data_structure': 'Structured medical data including ingredients, dosage, safety, and regulatory information'
        }
    }
    
    # Save summary report
    with open('/workspace/data/overviews/medications_batch_6/batch_6_summary_report.json', 'w', encoding='utf-8') as f:
        json.dump(summary_report, f, indent=2, ensure_ascii=False)
    
    print("\n📋 Summary report saved to: /workspace/data/overviews/medications_batch_6/batch_6_summary_report.json")
    
    return summary_report

if __name__ == "__main__":
    # Run validation
    data = validate_batch_6_data()
    
    # Create summary report
    summary = create_summary_report()

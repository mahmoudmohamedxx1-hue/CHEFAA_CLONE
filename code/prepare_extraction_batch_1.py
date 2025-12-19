#!/usr/bin/env python3
"""
Load and prepare URLs for extraction - First batch of 10 products.
"""

import json

# Load the URLs
with open('/workspace/data/medications_batch_7_final_urls.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

products = data['products']

# Get first 10 products for testing
first_batch = products[:10]

# Prepare extraction tasks
extraction_tasks = []
for item in first_batch:
    url = item['product_url']
    
    # Ensure proper URL format
    if not url.startswith('http'):
        if url.startswith('/'):
            url = f"https://chefaa.com{url}"
        else:
            url = f"https://chefaa.com/{url}"
    
    task = {
        "url": url,
        "prompt": """Extract comprehensive pharmaceutical information from this medication product page. 

        Analyze the page content and extract the following information in structured JSON format:

        1. BASIC INFORMATION:
           - Product name (both Arabic and English if available)
           - Brand name and manufacturer
           - Product description
           - Active ingredients/composition
           - Therapeutic category
           - Prescription requirements
           - Availability status

        2. THERAPEUTIC INFORMATION:
           - Mechanism of action (if mentioned)
           - Clinical uses and indications
           - Approved uses
           - Any off-label uses mentioned

        3. DOSING & ADMINISTRATION:
           - Dosage guidelines for different conditions
           - Administration routes (oral, topical, injection, etc.)
           - Frequency of administration
           - Duration of treatment
           - Any dosage adjustments mentioned

        4. SAFETY INFORMATION:
           - Contraindications
           - Warnings and precautions
           - Side effects (common, uncommon, rare, serious)
           - Drug interactions
           - Food interactions

        5. SPECIAL POPULATIONS:
           - Pregnancy considerations
           - Lactation/breastfeeding considerations
           - Pediatric use
           - Geriatric considerations
           - Renal impairment considerations
           - Hepatic impairment considerations

        6. STORAGE & HANDLING:
           - Storage conditions
           - Temperature requirements
           - Special handling instructions
           - Shelf life information
           - Disposal instructions

        Format your response as clear JSON with all sections populated. If specific information is not available on the page, indicate "Not specified" for that field. 

        Please be thorough and extract ALL available pharmaceutical information from the page.""",
        "task_name": f"pharmaceutical_profile_{item['product_number']}"
    }
    
    extraction_tasks.append(task)

print(f"Prepared {len(extraction_tasks)} extraction tasks for the first batch.")
print("First few URLs to be extracted:")
for i, task in enumerate(extraction_tasks[:3]):
    print(f"{i+1}. {task['task_name']}: {task['url']}")

# Save the extraction tasks
with open('/workspace/data/overviews/medications_batch_7/extraction_tasks_batch_1.json', 'w', encoding='utf-8') as f:
    json.dump(extraction_tasks, f, ensure_ascii=False, indent=2)

print("\\nExtraction tasks saved to: extraction_tasks_batch_1.json")

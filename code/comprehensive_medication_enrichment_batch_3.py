#!/usr/bin/env python3
"""
Comprehensive medication enrichment for batch 3 using real pharmaceutical databases
Sources: Mayo Clinic, DrugBank, Cleveland Clinic, pharmaceutical databases
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any

class ComprehensiveMedicationEnricher:
    def __init__(self):
        self.data_dir = Path("/workspace/data")
        self.output_dir = Path("/workspace/data/overviews/medications_batch_3")
        
        # Real pharmaceutical database from extracted sources
        self.pharmaceutical_database = {
            "depram": {
                "active_ingredients": ["Citalopram Hydrobromide 20mg"],
                "therapeutic_indications": ["Major Depressive Disorder (MDD)", "Depression", "Major depressive disorder (MDD)"],
                "drug_class": "Selective Serotonin Reuptake Inhibitor (SSRI)",
                "mechanism_of_action": "Antidepressant belonging to selective serotonin reuptake inhibitors (SSRIs). Thought to work by increasing the activity of serotonin in the brain.",
                "dosage_guidelines": [
                    "Adults: 20mg once daily, either morning or evening. May increase to max 40mg per day after at least 1 week",
                    "Older adults: 20mg once daily, either morning or evening",
                    "Do not exceed 40mg per day",
                    "Take only as directed by doctor, do not take more often or longer than prescribed",
                    "May take a month or longer to feel better"
                ],
                "contraindications": [
                    "Monoamine Oxidase (MAO) inhibitors (isocarboxazid, linezolid, methylene blue injection, phenelzine, selegiline, tranylcypromine)",
                    "Pimozide (Orap®) due to risk of very serious heart problems",
                    "Hypersensitivity to citalopram or any component of the formulation",
                    "Use in children and adolescents under 18 years (safety not established)"
                ],
                "warnings": [
                    "May increase suicidal thoughts/behavior in children, adolescents, and young adults (up to age 24)",
                    "Risk of serotonin syndrome when combined with serotonergic agents",
                    "May cause QT prolongation and cardiac arrhythmias",
                    "Alcohol consumption is not recommended",
                    "May cause drowsiness, trouble thinking, or problems with movement",
                    "Do not stop abruptly - gradual dose reduction required to prevent withdrawal symptoms"
                ],
                "adverse_reactions": [
                    "Common: Drowsiness, nausea, dry mouth, insomnia, fatigue, dizziness, sexual dysfunction",
                    "Less common: Agitation, blurred vision, confusion, fever, sweating",
                    "Rare: Seizures, serotonin syndrome, QT prolongation",
                    "Contact doctor for any concerning symptoms or side effects"
                ],
                "storage_conditions": "Store in a closed container at room temperature, away from heat, moisture, and direct light. Keep from freezing. Keep out of reach of children.",
                "drug_interactions": [
                    "MAO inhibitors - CONTRAINDICATED (14-day washout required)",
                    "Pimozide - CONTRAINDICATED",
                    "Serotonergic drugs - Risk of serotonin syndrome",
                    "Blood thinners (warfarin, aspirin) - Increased bleeding risk",
                    "NSAIDs - Increased bleeding risk",
                    "Alcohol - Not recommended"
                ],
                "pregnancy_category": "Category C (consult healthcare provider)",
                "lactation_info": "Breastfeeding: Harmful infant effects demonstrated; an alternative medication or cessation of breastfeeding is recommended",
                "source": "Mayo Clinic, Drugs.com, FDA Labeling"
            },
            "dermofix": {
                "active_ingredients": ["Ciclopirox 2%"],
                "therapeutic_indications": [
                    "Ringworm of the body (tinea corporis)",
                    "Ringworm of the foot (tinea pedis; athlete's foot)", 
                    "Ringworm of the groin (tinea cruris; jock itch)",
                    "Sun fungus (tinea versicolor; pityriasis versicolor)",
                    "Candida (Monilia) infections",
                    "Seborrheic dermatitis (scalp)",
                    "Ringworm of the nails (tinea unguium)"
                ],
                "drug_class": "Topical Antifungal Agent",
                "mechanism_of_action": "Works by killing the fungus or preventing its growth. Decreases synthesis of proteins, RNA, and DNA, but this appears to result from depletion of precursors rather than a specific inhibitory effect.",
                "dosage_guidelines": [
                    "Cream/Gel/Lotion: Apply twice daily (morning and evening) to affected areas",
                    "Continue for full treatment time even if symptoms clear",
                    "Keep away from eyes",
                    "For nail infections: May take up to 6 months to start improving",
                    "Do not miss doses"
                ],
                "contraindications": [
                    "History of unusual or allergic reaction to ciclopirox or any component"
                ],
                "warnings": [
                    "If skin problem does not improve within 2-4 weeks, or if it becomes worse, check with doctor",
                    "Inform doctor immediately if increased irritation (redness, itching, burning, blistering, swelling, or oozing) occurs",
                    "Nail problems may take up to 6 months to start improving",
                    "Do not apply occlusive dressing unless directed by doctor",
                    "Avoid heat or open flame when using nail lacquer"
                ],
                "adverse_reactions": [
                    "Common: Skin itching, burning, redness (1-4% of patients)",
                    "Less common: Skin irritation, erythema, burning, crusting, peeling",
                    "Seborrhea was most common in some studies",
                    "May cause allergic reactions (rash, hives, swelling)",
                    "Report severe or persistent irritation"
                ],
                "storage_conditions": "Room temperature in closed container, away from heat, moisture, and direct light. Keep from freezing. Keep out of reach of children.",
                "drug_interactions": [
                    "No significant drug interactions reported for topical ciclopirox",
                    "Inform healthcare professional of all other medicines being taken"
                ],
                "pregnancy_category": "Category B (consult healthcare provider)",
                "lactation_info": "Topical use generally safe during breastfeeding",
                "source": "Mayo Clinic, Cleveland Clinic, Drugs.com"
            },
            "dexamethasone": {
                "active_ingredients": ["Dexamethasone"],
                "therapeutic_indications": [
                    "Relief for inflamed areas of the body",
                    "Inflammation (swelling)",
                    "Severe allergies",
                    "Adrenal problems",
                    "Arthritis",
                    "Asthma",
                    "Blood or bone marrow problems",
                    "Kidney problems",
                    "Skin conditions",
                    "Flare-ups of multiple sclerosis",
                    "Multiple myeloma (in combination with other medicines)",
                    "Acute exacerbations of multiple sclerosis",
                    "Allergies, cerebral edema, inflammation, and shock"
                ],
                "drug_class": "Corticosteroid (Glucocorticoid)",
                "mechanism_of_action": "Corticosteroid that works on the immune system to help relieve swelling, redness, itching, and allergic reactions. Has approximately 7 times higher anti-inflammatory potency than prednisolone and 30 times that of hydrocortisone.",
                "dosage_guidelines": [
                    "Adults: 0.75 to 9 mg per day initially, dose may be adjusted by doctor",
                    "Children: 0.02 to 0.3 mg per kilogram of body weight per day initially, divided and taken 3 or 4 times a day",
                    "Multiple myeloma: 20 or 40 mg once daily",
                    "Take exactly as directed by doctor, do not exceed prescribed dose",
                    "Do not stop suddenly; gradually decrease dose under doctor's supervision"
                ],
                "contraindications": [
                    "Fungal infections",
                    "Herpes simplex eye infection"
                ],
                "warnings": [
                    "Regular doctor check-ups very important for long-term use (blood/urine tests may be needed)",
                    "May harm unborn baby - use effective birth control during treatment",
                    "Risk of adrenal gland problems with excessive or long-term use",
                    "May increase susceptibility to infections",
                    "May increase risk of cancer including Kaposi's sarcoma",
                    "Risk of bone thinning (osteoporosis) and growth slowing in children",
                    "May cause mood/behavior changes including depression and mood swings",
                    "Vision changes may occur - check with doctor immediately",
                    "Immunizations may not work properly during treatment"
                ],
                "adverse_reactions": [
                    "Common: Increased appetite, acne, mood changes, difficulty sleeping",
                    "Serious: Blurred vision, irregular heartbeat, muscle weakness, bone fractures",
                    "Signs of infection: Fever, chills, sore throat",
                    "Adrenal problems: Fatigue, dizziness, weakness",
                    "Mood changes: Depression, anxiety, euphoria",
                    "Immediate medical attention needed for severe abdominal pain, bloody stools, vision changes"
                ],
                "storage_conditions": "Store in closed container at room temperature, away from heat, moisture, and direct light. Keep from freezing. Dispose of outdated medicine properly.",
                "drug_interactions": [
                    "Artemether, Desmopressin, Mifepristone, Praziquantel - NOT RECOMMENDED",
                    "Various antibiotics, antifungals, antivirals - increased risk of interactions",
                    "Blood thinners - may increase bleeding risk",
                    "Insulin or oral diabetes medicines - may affect blood sugar levels",
                    "Diuretics - may increase potassium loss"
                ],
                "pregnancy_category": "Category C (consult healthcare provider)",
                "lactation_info": "No adequate studies in women for determining infant risk. Weigh potential benefits against potential risks.",
                "source": "Mayo Clinic, Pfizer Labeling, FDA, StatPearls"
            },
            "diacerein": {
                "active_ingredients": ["Diacerein 50mg"],
                "therapeutic_indications": [
                    "Treatment of osteoarthritis affecting the hip or knee",
                    "Symptomatic treatment of Osteoarthritis in the hip joint",
                    "Symptomatic treatment of Osteoarthritis of the knee",
                    "Joint diseases such as osteoarthritis (swelling and pain in the joints)",
                    "Pain, stiffness and swelling of joints associated with osteoarthritis"
                ],
                "drug_class": "Slow-acting anthraquinone IL-1 inhibitor",
                "mechanism_of_action": "Slow-onset drug that reduces inflammation and cartilage destruction and corrects altered osteoblast activity. Metabolized to rhein, which decreases cartilage destruction by decreasing expression of matrix metalloproteinase (MMP)-1 and -3 while upregulating tissue inhibitor of matrix metalloproteinases.",
                "dosage_guidelines": [
                    "50 mg capsule, twice daily for 2 weeks, then 50 mg once daily",
                    "Take with meals to reduce gastrointestinal side effects",
                    "Full therapeutic effect may take 2-4 weeks to develop",
                    "Take only as directed by healthcare provider"
                ],
                "contraindications": [
                    "Severe hepatic impairment",
                    "Severe renal impairment", 
                    "Known hypersensitivity to diacerein or rhein",
                    "Patients with history of severe diarrhea",
                    "Inflammatory bowel disease"
                ],
                "warnings": [
                    "May cause severe diarrhea - report to doctor if persistent",
                    "Use with caution in elderly patients",
                    "Monitor liver function tests periodically",
                    "Risk of hepatotoxicity - monitor for signs of liver problems",
                    "May cause skin discoloration (yellow-orange urine and feces)",
                    "Restrict use due to severe diarrhea side effects in some patients"
                ],
                "adverse_reactions": [
                    "Common: Diarrhea (most common side effect), abdominal pain, nausea",
                    "Less common: Skin rash, itching, headache",
                    "Serious: Severe diarrhea, liver toxicity",
                    "Report severe diarrhea or signs of liver problems immediately",
                    "Urine and feces may become yellow-orange colored (normal effect)"
                ],
                "storage_conditions": "Store at room temperature in a dry place away from moisture and heat. Keep out of reach of children.",
                "drug_interactions": [
                    "May increase hepatotoxic activities of acetaminophen",
                    "Metabolism decreased with various drugs including abrocitinib, acebutolol, acenocoumarol",
                    "May interact with acetohexamide and other diabetes medications",
                    "Use with caution when combined with hepatotoxic drugs"
                ],
                "pregnancy_category": "Consult healthcare provider (limited safety data)",
                "lactation_info": "Consult healthcare provider - limited data on breastfeeding safety",
                "source": "DrugBank, EMA, PMC, Clinical Studies"
            },
            "diamicron": {
                "active_ingredients": ["Gliclazide"],
                "therapeutic_indications": [
                    "Type 2 Diabetes Mellitus (when diet and exercise alone are insufficient to control blood sugar)",
                    "Management of blood sugar levels in adults with Type 2 Diabetes Mellitus",
                    "Control of hyperglycemia in gliclazide responsive diabetes mellitus"
                ],
                "drug_class": "Sulfonylurea (Oral Antidiabetic Agent)",
                "mechanism_of_action": "Stimulates the pancreas to produce more insulin by acting on beta cells. Improves body's sensitivity to insulin hormone and helps lower and stabilize blood glucose levels throughout the day.",
                "dosage_guidelines": [
                    "30 mg: Starting dose for most patients, once daily with breakfast",
                    "60 mg: May be used for patients requiring higher dose, once daily with breakfast", 
                    "Take exactly as prescribed, typically with breakfast",
                    "Swallow tablet whole with water; do not crush or chew",
                    "Do not skip meals to avoid low blood sugar",
                    "Combine with balanced diet, exercise, and weight management"
                ],
                "contraindications": [
                    "Type 1 Diabetes Mellitus",
                    "Diabetic ketoacidosis",
                    "Severe renal or hepatic impairment",
                    "Hypersensitivity to gliclazide or sulfonylureas"
                ],
                "warnings": [
                    "Risk of hypoglycemia - carry quick sugar source",
                    "Alcohol may enhance or mask blood sugar fluctuations",
                    "Inform doctor of liver, kidney, or heart conditions",
                    "Regular blood sugar monitoring required",
                    "Stress, illness, or surgery may require dose adjustment",
                    "Elderly patients may be more susceptible to hypoglycemia"
                ],
                "adverse_reactions": [
                    "Common: Hypoglycemia (low blood sugar), nausea, headache, dizziness",
                    "Less common: Weight gain, digestive upset, skin rash",
                    "Serious: Severe hypoglycemia, allergic reactions",
                    "Report severe or persistent hypoglycemia immediately"
                ],
                "storage_conditions": "Store at room temperature (below 25°C) in a dry place, away from direct sunlight and moisture.",
                "drug_interactions": [
                    "Increased risk of hypoglycemia with other antidiabetics or alcohol",
                    "Corticosteroids may decrease effectiveness",
                    "Beta-blockers may mask hypoglycemia symptoms",
                    "Diuretics may affect blood sugar levels",
                    "Warfarin may interact with some diabetes medications"
                ],
                "pregnancy_category": "Consult healthcare provider (insulin preferred during pregnancy)",
                "lactation_info": "Consult healthcare provider - insulin preferred during breastfeeding",
                "source": "PharmaServe Canada, TGA, Medical Literature"
            }
        }
        
    def load_existing_data(self):
        """Load existing product data from pages 21-30"""
        products_data = {}
        
        print("Loading existing product data from pages 21-30...")
        
        # Process available page files
        for page_num in [21, 22, 24, 25, 26]:  # Skip rate-limited pages
            page_file = f"/workspace/data/medications_page_{page_num}_phase3.json"
            
            if not Path(page_file).exists():
                print(f"Warning: Page file {page_file} not found")
                continue
                
            try:
                with open(page_file, 'r', encoding='utf-8') as f:
                    page_data = json.load(f)
                
                products = page_data.get('products', [])
                print(f"  Page {page_num}: {len(products)} products")
                
                # Calculate product ID range
                start_product_id = ((page_num - 1) * 20) + 1
                
                for i, product in enumerate(products):
                    product_id = start_product_id + i
                    
                    if 401 <= product_id <= 600:
                        products_data[product_id] = {
                            "product_id": product_id,
                            "page_number": page_num,
                            "position_in_page": i + 1,
                            "arabic_name": product.get('arabic_name', ''),
                            "english_name": product.get('english_name', ''),
                            "brand_name": product.get('brand_name', ''),
                            "price_egp": product.get('price_egp', 0),
                            "availability_status": product.get('availability_status', 'Unknown'),
                            "prescription_required": product.get('prescription_required', False),
                            "dosage_information": product.get('dosage_information', ''),
                            "other_product_details": product.get('other_product_details', ''),
                            # Enhanced fields to be populated
                            "active_ingredients": [],
                            "therapeutic_indications": [],
                            "dosage_guidelines": [],
                            "contraindications": [],
                            "warnings": [],
                            "adverse_reactions": [],
                            "storage_conditions": "",
                            "mechanism_of_action": "",
                            "pharmaceutical_form": "",
                            "strength": "",
                            "pack_size": "",
                            "manufacturer": "",
                            "registration_number": "",
                            "patient_information": "",
                            "drug_interactions": [],
                            "pregnancy_category": "",
                            "lactation_info": "",
                            "data_source": "chefaa_catalog_comprehensive",
                            "enrichment_status": "pending"
                        }
                        
            except Exception as e:
                print(f"Error processing page {page_num}: {e}")
                continue
        
        print(f"Loaded {len(products_data)} products for comprehensive enrichment")
        return products_data
    
    def extract_drug_key(self, product_data):
        """Extract drug key from product information for database lookup"""
        brand_name = product_data.get('brand_name', '').lower()
        english_name = product_data.get('english_name', '').lower()
        
        # Map to pharmaceutical database keys
        database_mapping = {
            "depram": ["depram", "citalopram"],
            "dermofix": ["dermofix", "ciclopirox"],
            "dexamethasone": ["dexamethasone", "dexaflox"],
            "diacerein": ["diacerein", "diacurimab"],
            "diamicron": ["diamicron", "gliclazide", "diamicron mr"],
            "diclac": ["diclac", "diclopro", "diclofenac"],
            "diflucan": ["diflucan", "fluconazole"],
            "dormival": ["dormival", "zolpidem"],
            "duphaston": ["duphaston", "dydrogesterone"],
            "durex": ["durex", "condoms"],
            "elevit": ["elevit", "breastfeeding"],
            "eliquis": ["eliquis", "apixaban"],
            "emo soft": ["emo", "moisturizer"],
            "e-mox": ["e-mox", "amoxicillin"],
            "enterogermina": ["enterogermina", "probiotic"],
            "epicogel": ["epicogel", "simethicone"],
            "eraloner": ["eraloner", "enalapril"],
            "erastapex": ["erastapex", "amlodipine"],
            "esmorap": ["esmorap", "esomeprazole"],
            "eucarbon": ["eucarbon", "charcoal"],
            "evastine": ["evastine", "levocetirizine"],
            "examide": ["examide", "losartan"],
            "exforge": ["exforge", "amlodipine", "valsartan"],
            "extrauma": ["extrauma", "heparinoid"],
            "ezacard": ["ezacard", "clopidogrel"],
            "ezapril": ["ezapril", "lisinopril"],
            "ezogast": ["ezogast", "esomeprazole"],
            "farcocin": ["farcocin", "fusidic acid"],
            "farcolin": ["farcolin", "ipratropium"],
            "faster": ["faster", "ibuprofen"],
            "faverin": ["faverin", "fluvoxamine"],
            "feburic": ["feburic", "febuxostat"],
            "feldene": ["feldene", "piroxicam"],
            "fenistil": ["fenistil", "dimetindene"],
            "fito": ["fito", "paracetamol"],
            "florastor": ["florastor", "saccharomyces"],
            "fluron": ["fluron", "fluconazole"],
            "fluxopride": ["fluxopride", "domperidone"],
            "folicap": ["folicap", "folic acid"],
            "foradil": ["foradil", "formoterol"],
            "forflozin": ["forflozin", "empagliflozin"],
            "fortum": ["fortum", "ceftazidime"],
            "fortymox": ["fortymox", "amoxicillin"],
            "forxiga": ["forxiga", "dapagliflozin"],
            "frost": ["frost", "menthol"],
            "fucicort": ["fucicort", "fusidic acid", "betamethasone"],
            "fucidine": ["fucidine", "fusidic acid"],
            "fungican": ["fungican", "itraconazole"],
            "furazol": ["furazol", "nitrofurantoin"],
            "gabimash": ["gabimash", "gabapentin"],
            "ganaton": ["ganaton", "itopride"],
            "gaptin": ["gaptin", "gabapentin"],
            "garamycin": ["garamycin", "gentamicin"],
            "gast reg": ["gast reg", "domperidone"],
            "gavison": ["gavison", "alginate"],
            "gengigel": ["gengigel", "hyaluronic acid"],
            "genuphil": ["genuphil", "chondroitin"],
        }
        
        # Try to match product to database
        for db_key, keywords in database_mapping.items():
            if any(keyword in brand_name or keyword in english_name for keyword in keywords):
                return db_key
        
        return None
    
    def enrich_with_pharmaceutical_data(self, product_data):
        """Enrich product with comprehensive pharmaceutical information"""
        drug_key = self.extract_drug_key(product_data)
        
        if drug_key and drug_key in self.pharmaceutical_database:
            pharma_data = self.pharmaceutical_database[drug_key]
            
            # Update with comprehensive pharmaceutical data
            product_data.update({
                "active_ingredients": pharma_data.get("active_ingredients", []),
                "therapeutic_indications": pharma_data.get("therapeutic_indications", []),
                "dosage_guidelines": pharma_data.get("dosage_guidelines", []),
                "contraindications": pharma_data.get("contraindications", []),
                "warnings": pharma_data.get("warnings", []),
                "adverse_reactions": pharma_data.get("adverse_reactions", []),
                "storage_conditions": pharma_data.get("storage_conditions", ""),
                "mechanism_of_action": pharma_data.get("mechanism_of_action", ""),
                "drug_class": pharma_data.get("drug_class", ""),
                "drug_interactions": pharma_data.get("drug_interactions", []),
                "pregnancy_category": pharma_data.get("pregnancy_category", ""),
                "lactation_info": pharma_data.get("lactation_info", ""),
                "enrichment_source": pharma_data.get("source", ""),
                "enrichment_status": "comprehensive"
            })
        else:
            # Fallback to basic enrichment for unmatched products
            self.extract_drug_info_from_names(product_data)
            product_data["enrichment_status"] = "basic"
        
        return product_data
    
    def extract_drug_info_from_names(self, product_data):
        """Extract basic pharmaceutical information from product names for unmatched items"""
        # Extract pharmaceutical form, strength, and pack size
        product_data["pharmaceutical_form"] = self.extract_pharmaceutical_form(product_data)
        product_data["strength"] = self.extract_strength(product_data)
        product_data["pack_size"] = self.extract_pack_size(product_data)
        product_data["enrichment_status"] = "basic"
        
    def extract_pharmaceutical_form(self, product_data):
        """Extract pharmaceutical form from product information"""
        forms = {
            "tablet": "Oral tablet",
            "capsule": "Oral capsule", 
            "syrup": "Oral syrup",
            "suspension": "Oral suspension",
            "cream": "Topical cream",
            "ointment": "Topical ointment",
            "drops": "Topical drops",
            "injection": "Injection",
            "gel": "Topical gel"
        }
        
        text_to_search = f"{product_data.get('arabic_name', '')} {product_data.get('english_name', '')} {product_data.get('other_product_details', '')}".lower()
        
        for form_key, form_name in forms.items():
            if form_key in text_to_search:
                return form_name
        
        return "Unknown pharmaceutical form"
    
    def extract_strength(self, product_data):
        """Extract drug strength from product information"""
        dosage_text = product_data.get('dosage_information', '')
        
        # Look for common strength patterns
        strength_patterns = [
            r'(\d+\.?\d*)\s*mg',
            r'(\d+\.?\d*)\s*mcg', 
            r'(\d+\.?\d*)\s*%'
        ]
        
        for pattern in strength_patterns:
            match = re.search(pattern, dosage_text, re.IGNORECASE)
            if match:
                return f"{match.group(1)} mg" if 'mg' in pattern else f"{match.group(1)}%"
        
        return "Strength not specified"
    
    def extract_pack_size(self, product_data):
        """Extract pack size from product information"""
        dosage_text = product_data.get('dosage_information', '')
        
        # Look for pack size patterns
        size_patterns = [
            r'(\d+)\s*(?:tablets|tabs|tab)',
            r'(\d+)\s*(?:capsules|caps|cap)', 
            r'(\d+)\s*(?:vials|vial)',
            r'(\d+)\s*(?:ml|milliliters)',
            r'(\d+)\s*(?:gm|grams|g)'
        ]
        
        for pattern in size_patterns:
            match = re.search(pattern, dosage_text, re.IGNORECASE)
            if match:
                return f"{match.group(1)} units"
        
        return "Pack size not specified"
    
    def process_all_products(self):
        """Process all products for comprehensive enrichment"""
        products_data = self.load_existing_data()
        enriched_data = {}
        
        print("Starting comprehensive enrichment process...")
        
        for product_id, product_data in products_data.items():
            print(f"  Enriching product {product_id}: {product_data.get('brand_name', 'Unknown')}")
            enriched_data[product_id] = self.enrich_with_pharmaceutical_data(product_data)
        
        print(f"Comprehensively enriched {len(enriched_data)} products")
        return enriched_data
    
    def save_comprehensive_data(self, enriched_data):
        """Save the comprehensively enriched data to JSON file"""
        
        # Create output structure
        output_data = {
            "extraction_metadata": {
                "batch_name": "medications_batch_3",
                "target_products": "401-600",
                "total_products_processed": len(enriched_data),
                "extraction_date": "2025-11-01",
                "extraction_method": "Comprehensive pharmaceutical database enrichment",
                "data_sources": [
                    "chefaa.com medications catalog (listing pages)",
                    "Mayo Clinic pharmaceutical database",
                    "DrugBank pharmaceutical database", 
                    "Cleveland Clinic medical database",
                    "FDA labeling and clinical studies",
                    "EMA European Medicines Agency",
                    "PMC PubMed Central clinical research",
                    "Various pharmaceutical manufacturers"
                ],
                "enrichment_completion_date": "2025-11-01",
                "extraction_approach": "Direct listing page access with comprehensive pharmaceutical database lookup",
                "rate_limiting_note": "Some pages rate-limited, used available data + comprehensive pharmaceutical enrichment"
            },
            "enrichment_summary": {
                "products_with_comprehensive_enrichment": sum(1 for p in enriched_data.values() if p.get('enrichment_status') == 'comprehensive'),
                "products_with_basic_enrichment": sum(1 for p in enriched_data.values() if p.get('enrichment_status') == 'basic'),
                "data_quality_metrics": self.calculate_comprehensive_quality_metrics(enriched_data),
                "field_completion_rates": self.calculate_comprehensive_field_completion(enriched_data),
                "pharmaceutical_sources": {
                    "mayo_clinic": "Comprehensive pharmaceutical information",
                    "drugbank": "Detailed mechanism of action and pharmacology",
                    "cleveland_clinic": "Clinical usage guidelines",
                    "fda_labeling": "Official prescribing information",
                    "clinical_studies": "Evidence-based therapeutic information"
                }
            },
            "products": enriched_data
        }
        
        # Save to file
        output_file = self.output_dir / "medications_overview_batch_3_comprehensive.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"Comprehensive enriched data saved to: {output_file}")
        return output_data
    
    def calculate_comprehensive_quality_metrics(self, enriched_data):
        """Calculate comprehensive data quality metrics"""
        total_products = len(enriched_data)
        
        metrics = {
            "total_products": total_products,
            "products_with_active_ingredients": sum(1 for p in enriched_data.values() if p.get('active_ingredients')),
            "products_with_indications": sum(1 for p in enriched_data.values() if p.get('therapeutic_indications')),
            "products_with_drug_class": sum(1 for p in enriched_data.values() if p.get('drug_class')),
            "products_with_mechanism_action": sum(1 for p in enriched_data.values() if p.get('mechanism_of_action')),
            "products_with_dosage_guidelines": sum(1 for p in enriched_data.values() if p.get('dosage_guidelines')),
            "products_with_contraindications": sum(1 for p in enriched_data.values() if p.get('contraindications')),
            "products_with_warnings": sum(1 for p in enriched_data.values() if p.get('warnings')),
            "products_with_adverse_reactions": sum(1 for p in enriched_data.values() if p.get('adverse_reactions')),
            "products_with_storage_info": sum(1 for p in enriched_data.values() if p.get('storage_conditions')),
            "products_with_drug_interactions": sum(1 for p in enriched_data.values() if p.get('drug_interactions')),
            "comprehensive_enrichment": sum(1 for p in enriched_data.values() if p.get('enrichment_status') == 'comprehensive')
        }
        
        # Calculate percentages
        for key, value in list(metrics.items()):
            if key != "total_products" and total_products > 0:
                metrics[key + "_percentage"] = round((value / total_products) * 100, 2)
        
        return metrics
    
    def calculate_comprehensive_field_completion(self, enriched_data):
        """Calculate comprehensive field completion rates"""
        all_fields = [
            "active_ingredients", "therapeutic_indications", "dosage_guidelines",
            "contraindications", "warnings", "adverse_reactions", "storage_conditions",
            "mechanism_of_action", "pharmaceutical_form", "strength", "pack_size",
            "drug_class", "drug_interactions", "pregnancy_category", "lactation_info"
        ]
        
        field_rates = {}
        total_products = len(enriched_data)
        
        for field in all_fields:
            completed = sum(1 for p in enriched_data.values() if p.get(field))
            rate = round((completed / total_products) * 100, 2) if total_products > 0 else 0
            field_rates[field] = rate
        
        return field_rates

def main():
    enricher = ComprehensiveMedicationEnricher()
    enriched_data = enricher.process_all_products()
    output_data = enricher.save_comprehensive_data(enriched_data)
    
    print("\\n=== COMPREHENSIVE ENRICHMENT COMPLETE ===")
    print(f"Products processed: {output_data['extraction_metadata']['total_products_processed']}")
    print(f"Output file: /workspace/data/overviews/medications_batch_3/medications_overview_batch_3_comprehensive.json")
    
    # Print summary statistics
    summary = output_data['enrichment_summary']
    print(f"\\nQuality Metrics:")
    for key, value in summary['data_quality_metrics'].items():
        if 'percentage' in key and value > 0:
            print(f"  {key}: {value}%")
    
    print(f"\\nComprehensive Enrichment: {summary['products_with_comprehensive_enrichment']} products")
    print(f"Basic Enrichment: {summary['products_with_basic_enrichment']} products")

if __name__ == "__main__":
    main()

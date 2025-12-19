# Pharmaceutical Data Extraction from Chefaa.com for Products ≥1401 — Evidence-Aligned Progress and Completion Plan

## Executive Summary: What Has Been Achieved and Why It Matters

This report consolidates concrete progress and presents a completion plan for the pharmaceutical dataset covering Chefaa products indexed 1401 and above. The objective is to deliver a single, authoritative JSON dataset that merges commerce-ready fields (name, brand, strength, pack size, price, availability) with clinically relevant attributes (indications, dosing, contraindications, side effects, interactions, storage) and reliable provenance.

Progress to date is evidenced by seven detailed product packs spanning antibiotics, non-steroidal anti-inflammatory drugs (NSAIDs), glucagon-like peptide-1 (GLP-1) receptor agonists, antihistamines, and laxatives. The evidence set calibrates our schema, pricing normalization rules (EGP and SAR), and market context (Egypt and Saudi Arabia). It also reveals variability in clinical completeness by page, which in turn shapes a pragmatic completion strategy emphasizing batch link discovery, targeted re-crawls, and staged enrichment.[^4][^5][^6][^7][^8][^9][^10][^11]

To visualize the operational context, Figure 1 shows the Chefaa medications category landing—our canonical entry point for structured traversal and taxonomy alignment.

![Chefaa medications category landing (operational context)](/workspace/docs/chefaa_homepage/chefaa_medications_category.png)

This category anchors the link-harvesting approach, supports controlled vocabularies for therapeutic classes, and provides the backbone for reliable pagination and anomaly handling.[^2]

Table 1 summarizes the current snapshot used for governance, QA, and planning.

Table 1. Progress Snapshot

| Metric | Current Status | Source Basis |
|---|---|---|
| Evidence-backed products extracted | 7 detailed packs | Chefaa product pages[^4][^5][^6][^7][^8][^9][^11] |
| Therapeutic categories covered | 5 classes | Antibiotics; NSAIDs; GLP-1 RA; Antihistamine; Laxative |
| Pricing anchors | EGP and SAR | Egypt and Saudi Arabia product pages[^4][^5][^6][^7][^8][^9][^11] |
| Market context | Egypt and Saudi | Locale differences on Chefaa (eg-ar; sa-ar)[^3] |
| Sequence anchor (product ≥1401) | Planned and documented | Anchored to Deconadal; page-based enumeration plan[^16] |
| Information gaps | Identified and mapped | Field sparsity on some pages; constructed URL validation required[^2] |

Why it matters. The evidence set validates that Chefaa’s product pages can support a clinically credible schema at scale, but with uneven completeness. By institutionalizing field mapping, normalization, and price reconciliation, we can accelerate toward the remaining products while preserving data quality and clinical usefulness.

## Source Landscape, Inventory, and Target Product Anchor

Source architecture. The dataset is built from Chefaa’s medications category pages and product detail pages across eg-ar and sa-ar locales. Listing pages expose pagination, product cards, slugs, and occasional breadcrumbs—enabling systematic traversals and link harvesting. Product detail pages provide core identification fields and, variably, richer clinical content.[^2][^3]

Inventory summary. The 130-page corpus contains documented gaps and zero-result ranges, necessitating gap-aware enumeration and reconciliation. Subcategory summaries (nine groups; 168 products) provide secondary taxonomy and cross-validation when clinical fields are sparse on listing pages.[^2]

Target sequence anchor. The 1401+ slice will be assembled via ascending enumeration, deduplication, canonicalization, and stable indexing. The anchor product for ID 1401 is “ديكونادال” (Deconadal) 10 mg, 21 tablets, located on page 90. This anchor ensures the target sequence aligns with the intended catalog segment.[^16]

Figure 2 shows the listing pattern used for link harvesting and cross-checks when detail pages are intermittently unavailable.

![Medications listing pattern (pagination and link harvesting evidence)](/workspace/docs/chefaa_homepage/chefaa_medications_listing.png)

As shown, card titles and slugs enable candidate URL construction, while pagination provides consistent traversal points—even under dynamic loading.[^2][^3]

### Page Files Inventory and Gaps

Zero-result ranges and missing files are documented, and must be explicitly flagged in metadata to preserve auditability. The anomaly map is foundational to QA checks.

Table 2. Page Files Inventory (summary)

| Page Range | Approximate Products per Page | Key Anomalies |
|---|---|---|
| 1–4 | 20 each | None |
| 5–7 | N/A | Missing pages |
| 8–9 | 40, 44 | Above typical |
| 10–54 | 20 each | None |
| 55–61 | 0 | Zero-result pages |
| 62 | 13 | Below typical |
| 63–67 | 20 each | None |
| 68 | N/A | Missing page |
| 69–72 | 20 each | None |
| 73–83 | 0 | Zero-result pages |
| 84–134 | 20 each (with occasional 21) | Page 134 has 4 products |

These anomalies will be carried forward into acceptance tests and metadata for transparency and traceability.[^2]

## Data Model, Mapping, and Normalization

Field catalog. The schema integrates identification, commercial, clinical, regulatory, provenance, and multilingual fields. It is designed to accommodate the variability observed across product pages and to standardize dosage, strength, pack size, and therapeutic categories.

Table 3. Data Field Catalog (selected highlights)

| Field | Type | Example | Source Priority |
|---|---|---|---|
| product_id | Integer | 1401 | Derived |
| product_name_ar / en | String | اوجمنتين / Augmentin | Page files / Detail page |
| brand_name | String | GSK; SPIMACO; Abbott | Detail page |
| therapeutic_class | String | Antibiotic (Penicillin combination) | Detail page / Subcategory |
| active_ingredient | String | Amoxicillin; Clavulanic acid | Detail page |
| strength | String | 625 mg; 400 mg; 3.335 g/5 ml | Page files / Detail page |
| dosage_form | String | Tablet; Syrup | Detail page |
| pack_size | String | 10 tablets; 16 tablets; 150 ml | Page files / Detail page |
| route | String | Oral; Subcutaneous | Detail page |
| price_egp / price_sar | Number | 117; 10; 397 | Page files |
| availability_status | String | In stock | Page files |
| prescription_required | Boolean | true/false | Detail page / Inference |
| storage_conditions | String | Store below 25°C (dry place) | Detail page |
| contraindications | Array[String] | “Penicillin allergy” | Detail page |
| side_effects | Array[String] | “Diarrhea; nausea” | Detail page |
| interactions | Array[String] | “Antacids; fruit juices” | Detail page |
| pregnancy_lactation | String | “Consult a physician” | Detail page |
| clinical_data | String | “Onset ~1 hour” | Detail page |
| product_link | String | Constructed | Derived |
| source_file / source_page | String / Integer | medications_page_90.json / 90 | Provenance |
| extraction_timestamp | ISO-8601 | 2025-11-01T13:37:23Z | Workflow |
| language | String | ar/en | Metadata |

![Detail page field pattern (schema calibration evidence)](/workspace/research_output/screenshots/chefaa_doliprane_product_detail_page.png)

The detail page pattern above confirms expected field presence and informs standardized parsing for names, strengths, dosages, and clinical notes.[^7]

Normalization rules. Strip diacritics, collapse whitespace, and generate transliterated names; enforce “X mg,” “X mg/5 ml,” or “X%”; unify pack sizes to “N units”; map categories to controlled vocabulary; normalize brands and retain aliases. These rules are essential for cross-market consistency and deduplication.

### Clinical and Safety Field Alignment

Observed clinical field coverage varies by class and page:

- Antibiotics: Floxamo provides comprehensive content; Augmentin’s page is basic, deferring to the leaflet. This necessitates a staged enrichment approach—capturing minimal viable records now and prioritizing leaflet-backed re-crawls for high-importance classes.[^4][^5]
- NSAIDs: Sapofen exposes robust dosing ranges, contraindications, and side effects; Nurofen syrup emphasizes pediatric dosing and temporary use. Default safety flags (GI precautions, cardiovascular risk with prolonged use, age restrictions) should be applied when fields are missing.[^6][^8]
- GLP-1 agonist: Victoza provides exhaustive guidance for administration, side effects, and precautions, making it a strong calibration source for injectables.[^9]
- Antihistamine: Telfast includes class-consistent non-sedating properties, explicit interactions (antacids, fruit juices), dosing, and storage—ideal for antihistamine standardization.[^10]
- Laxative: Duphalac covers indications, adult dosing, onset, and side effects; price anomaly requires reconciliation during QA.[^11]

Table 4. Clinical Field Coverage Matrix (selected products)

| Product | Indications | Dosing | Contraindications | Side Effects | Interactions | Storage | Pregnancy/Lactation |
|---|---|---|---|---|---|---|---|
| Augmentin | Partial | Partial | Limited | Limited | Limited | Not stated | Not stated |
| Floxamo | Yes | Yes | Yes | Yes | Yes | General | Consult physician |
| Sapofen | Yes | Yes | Yes | Yes | N/A explicit | Not stated | Precautions stated |
| Nurofen Syrup | Yes | Yes | Not explicit | Not explicit | Not explicit | Not stated | Temporary use |
| Victoza | Yes | Yes | Yes | Yes | Caution (insulin) | N/A | Caution |
| Telfast | Yes | Yes | Yes | Yes | Yes | Yes | Consult physician |
| Duphalac | Yes | Yes | Not explicit | Yes | Not explicit | Not stated | Consult physician |

This matrix informs both extraction priorities and inference rules where pages are sparse.

## Evidence Deep-Dive and Field Calibration

The following product analyses calibrate the schema and demonstrate market-specific pricing and clinical content.

Figure 3 anchors schema calibration against a detail page example.

![Detail page example used to calibrate field presence](/workspace/research_output/screenshots/chefaa_doliprane_product_detail_page.png)

This reference pattern guides parsing for dosage forms, strengths, pack sizes, and clinical notes—critical for consistent normalization across locales.[^7]

Antibiotics: Augmentin 625 mg (10 tablets). The page provides core identification (brand: GSK; strength: 625 mg; pack: 10 tablets) and price (117 EGP). Clinical details are limited; the leaflet is the expected source for comprehensive prescribing information. This anchors basic commercial fields and flags clinical enrichment as a near-term re-crawl priority.[^4]

Antibiotics: Floxamo 1 g (16 tablets). A robust, clinically rich page: fixed-dose amoxicillin 500 mg + flucloxacillin 500 mg; extensive indications (respiratory, bone/joint, ENT, GI, gallbladder, typhoid, kidney, prostatitis, gonorrhea, skin/soft tissue, post-surgical wounds, intra-abdominal, dental abscess, middle ear, bronchitis, pneumonia, paratyphoid); adult dosing (1 g every 8 hours, oral); administration guidance (swallow whole; preferably 1 hour before or 2 hours after food); contraindications (penicillin allergy); side effects (mild diarrhea, indigestion); pregnancy/lactation (consult physician); interactions (anticoagulants, other antibiotics); renal impairment precautions; general storage. Pricing anchors: 110 EGP per pack; 55 EGP per strip.[^5]

NSAIDs: Sapofen 400 mg (20 tablets). Ibuprofen 400 mg; mechanism (COX-1 & COX-2 inhibition); broad indications (fever, headaches/migraines, muscle pain, arthritis, cold/flu aches, menstrual pain, dental pain, bone pain, lower back pain); dosing (1–2 tablets up to three times daily; max 6/day; not >10 days); administration (after food; avoid GI irritation); contraindications (hypersensitivity, post–heart surgeries, peptic ulcers, severe hypertension, lupus, pregnancy); precautions (elderly, breastfeeding); side effects (common: GI upset, heartburn, nausea/vomiting, gas, diarrhea/constipation, headache, dizziness; rare/serious: ulcers, allergic reactions, cardiovascular events, bleeding/bruising, hypertension, anemia, severe skin reactions, vision changes, liver/kidney damage); no drowsiness. Manufacturer: SPIMACO; price: 10 SAR; alternatives listed.[^6]

NSAIDs: Nurofen children’s syrup (strawberry, 150 ml). Ibuprofen; analgesic/antipyretic/anti-inflammatory; indications (pain, inflammation, fever in adults and children, colds/flu, toothache, headache, menstrual pain, joint/muscle inflammation); dosing (5–15 ml up to three times daily; tailored by weight/age; temporary use only; not for long-term); flavor notes (strawberry; orange available); pricing: 17.15 SAR (alternative 15.3 SAR). Market: Saudi Arabia.[^8]

Diabetes: Victoza (liraglutide 6 mg/ml; 2 pens × 3 ml). GLP-1 agonist; indications (Type 2 diabetes in adults and children ≥10 years; adjunct to diet/exercise; cardiovascular risk reduction in adults with established CVD; weight loss adjunct via appetite regulation and delayed gastric emptying); dosage (once daily; subcutaneous injection; abdomen/thigh/upper arm; rotate sites; do not mix with insulin; do not share pens); side effects (common: nausea, vomiting, diarrhea, appetite loss, constipation; serious: pancreatitis, hypoglycemia with insulin, kidney problems, gallbladder issues, severe allergic reactions); contraindications (Type 1 diabetes, hypersensitivity to liraglutide, concomitant liraglutide-containing products, <10 years); comparative notes vs Saxenda, Trulicity, Ozempic; price: 397 SAR.[^9]

Allergy: Telfast 180 mg (20 tablets). Fexofenadine hydrochloride 180 mg tablets; syrup 30 mg/5 ml; indications (seasonal allergic rhinitis, urticaria; cold symptoms relief); dosing (adults and children ≥12 years: 180 mg once daily for seasonal allergic rhinitis; 60 mg twice daily as needed; urticaria 180 mg once daily); syrup dosing for infants ≥6 months and children 2–12 years; storage (below 25°C in a dry place); contraindications (hypersensitivity; avoid antacids with aluminum/magnesium); food interactions (avoid grapefruit, orange, apple juices); side effects (headache, drowsiness, dizziness, nausea); safety (insufficient pregnancy data—consult physician; lactation—consult physician; non-cortisone). Price: 160 EGP. Comparative positioning vs cetirizine, loratadine, dimetindene.[^10]

Laxative: Duphalac (lactulose 3.335 g/5 ml; 200 ml). Osmotic laxative; indications (constipation; treatment/prevention of hepatic encephalopathy; acute constipation); adult dosing (1–2 large spoons, preferably after breakfast; single dose; adjust per response; do not exceed recommended dose; do not double on missed dose); onset (~48 hours); side effects (nausea; mild vomiting resolving in days; severe diarrhea; electrolyte imbalance); pregnancy (consult a doctor); weight gain (not expected). Price: 143 EGP (alternative detailed-section price noted as approximately 87 EGP—flagged for reconciliation in QA).[^11]

These exemplars confirm field availability across identification, commercial, clinical, and safety domains—and demonstrate currency handling across EGP and SAR.

## Synthesis: Clinical Patterns, Pricing Anchors, and Category Mapping

Clinical completeness patterns. Floxamo and Sapofen provide exemplary clinical detail; Victoza and Telfast are strong references for injectables and antihistamines, respectively. Augmentin’s page is sparse, indicating the need for leaflet-backed enrichment for antibiotics. Nurofen syrup validates pediatric dosing norms and safety phrasing for temporary use. This variance underscores the need for staged enrichment, inference rules, and targeted re-crawls.

Dosing and safety themes. For NSAIDs, take with food, avoid in specified comorbidities, and use the lowest effective dose for the shortest duration. For antihistamines like fexofenadine, avoid antacids and certain fruit juices to preserve absorption. For GLP-1 agonists like liraglagide, rotate injection sites, avoid sharing pens, and monitor for pancreatitis and hypoglycemia when used with insulin. These themes guide default safety flags for products with sparse pages.

Pricing anchors and normalization. The evidence set establishes EGP and SAR anchors—critical for cross-market analytics. Price reconciliation is required where multiple prices appear on the same page (e.g., Duphalac), with preference rules applied during QA.

Category mapping. Controlled vocabulary is stable for antibiotics (penicillin combinations), NSAIDs, GLP-1 agonists, antihistamines (non-sedating), and osmotic laxatives. Subcategory hints improve mapping confidence where detail pages are sparse.

Table 5. Market/Price Anchor Table (selected)

| Product | Strength/Pack | Price | Currency | Market | Notes |
|---|---|---:|---|---|---|
| Augmentin | 625 mg; 10 tablets | 117 | EGP | Egypt | Page-basic |
| Floxamo | 1 g; 16 tablets | 110 | EGP | Egypt | Pack price |
| Floxamo | 1 g; strip | 55 | EGP | Egypt | Strip price |
| Victoza | 6 mg/ml; 2 pens × 3 ml | 397 | SAR | Saudi | Comprehensive |
| Nurofen Syrup | 150 ml | 17.15 | SAR | Saudi | Alternative 15.3 noted |
| Sapofen 400 | 400 mg; 20 tablets | 10 | SAR | Saudi | Manufacturer SPIMACO |
| Telfast 180 | 180 mg; 20 tablets | 160 | EGP | Egypt | Non-sedating antihistamine |
| Duphalac | 3.335 g/5 ml; 200 ml | 143 | EGP | Egypt | Alternative ~87 EGP (to reconcile) |

Table 6. Clinical Completeness Scorecard (selected)

| Product | Indications | Dosing | Contraindications | Side Effects | Interactions | Storage | Pregnancy/Lactation |
|---|---|---|---|---|---|---|---|
| Augmentin | Partial | Partial | Limited | Limited | Limited | Not stated | Not stated |
| Floxamo | Yes | Yes | Yes | Yes | Yes | General | Consult physician |
| Sapofen | Yes | Yes | Yes | Yes | N/A explicit | Not stated | Precautions stated |
| Nurofen Syrup | Yes | Yes | Not explicit | Not explicit | Not explicit | Not stated | Temporary use |
| Victoza | Yes | Yes | Yes | Yes | Caution (insulin) | N/A | Caution |
| Telfast | Yes | Yes | Yes | Yes | Yes | Yes | Consult physician |
| Duphalac | Yes | Yes | Not explicit | Yes | Not explicit | Not stated | Consult physician |

![Reference listing pattern used for category-to-field cross-checks](/workspace/docs/chefaa_homepage/chefaa_medications_listing.png)

The listing pattern supports taxonomy cross-checks and helps resolve ambiguous cases—especially useful for class-level defaults when clinical fields are sparse.[^2]

## Completion Plan: Scale to 880 Products under Constraints

Execution must balance scale, reliability, and step efficiency:

- Batch URL discovery by class: antibiotics (amoxicillin/clavulanic acid; flucloxacillin combinations), antihypertensives (amlodipine combinations; ACE inhibitors; ARBs), anticoagulants (ticagrelor; clopidogrel; DOACs when present), diabetes (metformin XR; sulfonylureas; DPP-4 inhibitors; GLP-1 RAs), respiratory (montelukast), allergy (fexofenadine; loratadine; cetirizine), GI (PPIs; antacids; laxatives), and pain (ibuprofen; naproxen; paracetamol).
- Field coverage prioritization: identification → commercial → clinical → safety → regulatory. Where leafets are referenced (e.g., Augmentin), capture minimal viable records and schedule re-crawls for high-importance classes.
- URL validation protocol: slug harvesting from listing titles; multi-locale validation (eg-ar vs sa-ar); listing corroboration; retries with exponential backoff; failed-link logging and staged re-attempts.
- Operational efficiency: concurrent extractions where safe; class-based batch schedules; evidence-informed default flags for safety and prescription status; rapid anomaly triage.

Table 7. Priority Target Matrix (category → exemplar products)

| Category | Product | Market | Source Ref | Field Coverage Goal |
|---|---|---|---|---|
| Antibiotic | Augmentin 625 mg | Egypt | [^4] | Enrich clinical via leaflet |
| Antibiotic | Floxamo 1 g | Egypt | [^5] | Maintain completeness |
| Antihistamine | Telfast 180 | Egypt | [^10] | Standardize class |
| NSAID | Sapofen 400 | Saudi | [^6] | Maintain completeness |
| NSAID | Nurofen Syrup | Saudi | [^8] | Pediatric dosing |
| Diabetes (GLP-1) | Victoza | Saudi | [^9] | Maintain completeness |
| Laxative | Duphalac | Egypt | [^11] | Reconcile price; maintain clinical |
| Antihypertensive | Blokatens | Egypt | [^12] | Harvest detailed fields |
| Anticoagulant | Brilique | Egypt | [^13] | Interactions and dosing |
| Antihistamine (alt) | Fastel 180 | Egypt | [^14] | Comparator enrichment |

### Risk-Aware Operations

- URL failures and dynamic content errors: mitigate with retries/backoff; staggered schedules; alternate slug harvesting.
- Partial clinical fields: employ class-based defaults for safety warnings (e.g., NSAIDs: take with food; avoid in peptic ulcer disease; monitor for cardiovascular risk) and prescription norms (antibiotics, antihypertensives, anticoagulants, GLP-1 RAs as likely prescription).
- Language and transliteration: robust normalization (diacritics, spacing) and alias handling for cross-variant matching.
- Provenance retention: maintain source_file, source_page, product_link, and extraction_timestamp in each record for auditability.

## Validation, QA, and Acceptance

QA pipeline. Apply deduplication via composite key (normalized name + strength + pack_size + brand). Enforce controlled vocabulary for therapeutic classes. Normalize prices with currency tags (EGP/SAR). Reconcile anomalies (e.g., Duphalac alternative price) using source preference rules.

Acceptance tests. Verify record counts and the 1401 anchor (Deconadal), scan for duplicates, ensure required fields are present, validate a sample of constructed URLs, and confirm category mapping and price normalization.

Table 8. Acceptance Test Checklist

| Test | Description | Result |
|---|---|---|
| Record count | Total and 1401+ counts match expected | Pass/Fail |
| Anchor verification | Product 1401 is “ديكونادال” | Pass/Fail |
| Duplicate scan | Zero duplicates by composite key | Pass/Fail |
| Required fields | No nulls in product_id, names, category | Pass/Fail |
| URL validity | Constructed product_link resolves (sample) | Pass/Fail |
| Price format | Numeric EGP/SAR; currency tagged | Pass/Fail |
| Category mapping | Controlled vocabulary applied | Pass/Fail |

![QA visual check: detail page structure confirmation](/workspace/research_output/screenshots/chefaa_doliprane_product_page.png)

This visual check confirms the presence of critical fields and structure, informing acceptance tests and extraction heuristics.[^7]

## Output Delivery and File Specification

Final dataset. Serialize to data/overviews/medications_final/medications_overview_final.json, with a metadata block and a deduplicated, normalized products array for 1401+, sorted by product_id. Compute and record integrity checksums.

Table 9. Output JSON Metadata Schema

| Field | Type | Example | Required |
|---|---|---|---|
| schema_version | String | “1.0.0” | Yes |
| source_catalog | String | “Chefaa Medications Category” | Yes |
| extraction_date | ISO-8601 | “2025-11-01T13:37:23Z” | Yes |
| total_products | Integer | 2280 | Yes |
| products_1401_plus_count | Integer | 880 | Yes |
| page_range_processed | String | “1–134” | Yes |
| missing_pages | Array[Integer] | [5,6,7,68] | Yes |
| zero_result_pages | Array[String] | [“55–61”, “73–83”] | Yes |
| deduplication_policy | String | “Normalized name + strength + pack_size + brand” | Yes |
| category_taxonomy_version | String | “v2025.11” | Yes |
| notes | String | “Final run after QC pass” | No |

### Change Log and Audit

Maintain a change log capturing counts, rule versions applied, exceptions (failed links, missing fields), and QC outcomes. Store the log alongside the dataset to ensure auditability and reproducibility.

## Appendices: Evidence, Media, and References

Media inventory (evidence for source structure and field calibration):

![Category landing evidence](/workspace/docs/chefaa_homepage/chefaa_medications_category.png)

![Listing pattern reference](/workspace/docs/chefaa_homepage/chefaa_medications_listing.png)

![Detail page field calibration](/workspace/research_output/screenshots/chefaa_doliprane_product_detail_page.png)

Information gaps carried forward:

- Aerius: active ingredient not explicitly stated on the page; dosage and uses visible; clinical fields partially missing.[^17]
- Nepvol: contraindications, side effects, storage missing.[^15]
- Constructed product detail links: require validation against live listings or slug harvesting.[^2]
- Subcategory overlaps: deduplication policies must be confirmed during production runs.[^2]
- Dedup and brand normalization: codify rules prior to serialization.
- Sequence mapping to IDs (1…2280): confirm during assembly.[^2]
- Cross-market pricing normalization: EGP vs SAR tagging; reconcile anomalies during QA.[^4][^5][^6][^7][^8][^9][^10][^11]

## References

[^1]: Chefaa Homepage (EN). https://chefaa.com  
[^2]: Chefaa Medications Category (AR). https://chefaa.com/eg-ar/now/category/medications  
[^3]: Chefaa Medications Category Pagination Example: Page 2. https://chefaa.com/eg-ar/now/category/medications/page/2  
[^4]: Chefaa Product Page: Augmentin 625 mg (10 tablets). https://chefaa.com/eg-ar/nowProduct/augmentin-antibiotic-625mg-10tab-x5fp  
[^5]: Chefaa Product Page: Floxamo 1 g (16 tablets). https://chefaa.com/eg-ar/nowProduct/floxamo-antibiotic-1g-16tab-udwg  
[^6]: Chefaa Product Page: Sapofen 400 mg (20 tablets). https://chefaa.com/sa-ar/nowProduct/sapofen-400mg-20tab  
[^7]: Chefaa Product Page: Doliprane 1000 mg (Novaldol). https://chefaa.com/eg-ar/nowProduct/novaldol-analgesic-and-pain-killer-1000-mg-15-tablets_duYpVP2r_duzDVQep  
[^8]: Chefaa Product Page: Nurofen Children’s Syrup (Strawberry, 150 ml). https://chefaa.com/sa-ar/nowProduct/nurofen-syrup-strowberry-150ml  
[^9]: Chefaa Product Page: Victoza (liraglutide, 6 mg/ml, 2 pens × 3 ml). https://chefaa.com/sa-ar/nowProduct/victoza-6mg-ml-2-penfill-3ml  
[^10]: Chefaa Product Page: Telfast 180 mg (20 tablets). https://chefaa.com/eg-ar/nowProduct/telfast-antihistamine-allergy-tablets-180-mg-20-tablets  
[^11]: Chefaa Product Page: Duphalac Syrup (200 ml). https://chefaa.com/eg-ar/nowProduct/duphalac-syrup  
[^12]: Chefaa Product Page: Blokatens 5/80 mg (28 tablets). https://chefaa.com/eg-ar/nowProduct/blokatens-high-blood-pressure-580mg-28tab-alua  
[^13]: Chefaa Product Page: Brilique 90 mg (56 tablets). https://chefaa.com/eg-ar/nowProduct/brilique-to-prevent-clots-90mg-56tab-nlwj  
[^14]: Chefaa Product Page: Fastel 180 mg (20 tablets). https://chefaa.com/eg-ar/nowProduct/fastel-180mg-20tab-gvw1  
[^15]: Chefaa Product Page: Nepvol 5 mg (30 tablets). https://chefaa.com/eg-ar/nowProduct/nepvol-5-mg-30-tabs-jdsf  
[^16]: Chefaa Product Page: Deconadal 20 mg (21 tablets). https://chefaa.com/nowProduct/deconadal-20-mg-21-tablets-zmlh  
[^17]: Chefaa Product Page: Aerius 5 mg (30 tablets). https://chefaa.com/eg-ar/nowProduct/aerius-5mg-30-tab
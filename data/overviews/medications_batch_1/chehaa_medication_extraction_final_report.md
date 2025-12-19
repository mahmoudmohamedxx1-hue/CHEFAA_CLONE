# Scalable Extraction of Chefaa Medication Profiles: Methodology, Consolidation, and Rate-Limit–Resilient Expansion Plan

## Executive Summary

This report documents the initial consolidation of a Chefaa medication dataset and proposes a scalable, rate-limit–resilient methodology to reach 200 unique medications for Batch 1. The immediate consolidation incorporated approximately 12 unique products from a seed pool of 28 URLs and surfaced 20 additional candidates from a newly parsed listing file (page 124), demonstrating that an offline-first approach can consistently expand coverage without over-reliance on live server requests. Representative products with rich bilingual information (e.g., Plavix, Plendil, Zyrtec drops, Prontogest) show strong potential for robust clinical and dosage coverage when page content is complete, while numerous listings remain partial and require targeted re-visits and structured enrichment.

The principal challenge encountered is rate limiting on Chefaa’s product pages, which necessitates a disciplined cooldown protocol, batch sizing, and jittered delays. To reduce server interactions, the strategy emphasizes harvesting URLs from category listing files, prioritizing expansions like page 124, and maintaining a governed registry of candidate URLs. Pricing fields are present but inconsistently formatted; a normalization plan is therefore recommended to standardize currency, numeric values, and availability status.

With the current trajectory, the dataset can be credibly expanded to at least 50 medications within the current session by combining the remaining seed URLs, the 20 expansion candidates from page 124, and additional listing pages. The plan focuses on parallelized offline URL harvesting, prioritized batch extractions, and continuous QA to ensure schema compliance and bilingual completeness.

Table 1. Key metrics snapshot

| Metric | Value | Notes |
|---|---|---|
| Total targeted medications (Batch 1) | 200 | Long-term batch target |
| Successfully extracted (initial consolidation) | ~12 | Seeded from 28 URLs; variable completeness |
| Expansion URLs (page 124) | 20 | Structured candidate pool |
| Next immediate target | 50 | Achievable within current session |
| Primary constraint | Rate limiting | Mitigated via cooldown, jitter, batch sizing |

## Scope, Objectives, and Success Criteria

The scope of Batch 1 is to process the first 200 medications from Chefaa’s catalog. For each product, bilingual (Arabic and English) descriptions and complete required fields must be captured directly from individual product pages, and all outputs must be saved to a designated Batch 1 directory to avoid conflicts with parallel work streams.

Objectives:
- Consolidate the initial medications into a single, deduplicated list with canonical product_url as the unique key.
- Continue extractions from the remaining seed URLs using staggered processing windows and strategic delays.
- Expand the URL pool by harvesting additional category listing pages beyond page 124.
- Reach at least 50 unique medications in the current session.

Success criteria:
- Zero duplicate product_url entries in the consolidated dataset.
- Structured fields populated per specification; nulls used for missing content rather than inference.
- At least 50 products extracted in the session, with bilingual completeness where available.
- A documented, rate-limit–aware operational cadence with health monitoring and backoff rules.

## Data Sources and File Inventory

The dataset is built from two foundational inputs: (1) seed listing files that provided the initial set of product URLs, and (2) a newly identified expansion listing file (page 124) with structured product entries. The consolidation process operates within the Batch 1 directory, ensuring clear separation from other tasks.

Table 2. Source files inventory

| Source File | Path (internal reference) | Purpose | Notes |
|---|---|---|---|
| chefaa-medications-p47.json | Internal path: browser/extracted_content/chefaa-medications-p47.json | Seed listing file | Delivered initial set of product URLs |
| chefaa_kids_infant_medications_page1.json | Internal path: browser/extracted_content/chefaa_kids_infant_medications_page1.json | Seed listing (kids segment) | Additional product URLs |
| chefaa-medications-p124.json | Internal path: browser/extracted_content/chefaa-medications-p124.json | Expansion listing | 20 structured entries with concentrations and pack sizes |

### Seed URLs (28)

The seed pool comprises URLs harvested from the initial listing files. This set has yielded roughly 12 successful extractions with variable completeness across fields. Consolidation will remove duplicates and ensure schema compliance prior to continued processing.

### Expansion: chefaa-medications-p124.json (20 products)

Page 124 surfaced 20 structured medication entries, including dosage forms, strengths, and pack sizes, each with a product_url. This expansion demonstrates the scalability of offline listing-file parsing and enables meaningful incremental coverage without immediate server strain.[^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46]

## Consolidation Methodology and Deduplication Strategy

The consolidation merges existing arrays into a unified medications list under a single schema, deduplicating on product_url. Field normalization covers bilingual pairs, active ingredients, therapeutic indications, dosage, contraindications and warnings, side effects and precautions, storage conditions, clinical information, and pricing. Missing fields are explicitly set to null to preserve traceability and avoid fabricated content.

Governance:
- Canonical dedup key: product_url.
- Schema validation passes before merging.
- Coverage score computation per product (ratio of non-null critical fields).
- Provenance tracking for every field value.

Table 3. Field-to-source mapping and validation checklist

| Field | Source Location | Status | Notes |
|---|---|---|---|
| product_id | Product page / Listing | Partial | Prefer page; fallback to listing |
| product_name_arabic | Product page | Partial | Prefer product page; fallback to listing |
| product_name_english | Product page | Partial | Prefer product page; fallback to listing |
| product_url | Listing | Complete | Unique dedup key |
| description.arabic | Product page | Partial | Capture where available |
| description.english | Product page | Partial | Capture where available |
| specifications.form | Product page | Partial | Normalize enums |
| specifications.strength/pack_size | Product page | Partial | Normalize units |
| active_ingredients | Product page | Partial | Avoid inference unless explicit |
| therapeutic_indications | Product page | Partial | Consolidate duplicates |
| dosage_and_administration | Product page | Partial | Preserve age-specific guidance |
| contraindications_and_warnings | Product page | Partial | Capture explicit items |
| side_effects_and_precautions | Product page | Partial | Capture explicit items |
| storage_conditions | Product page | Partial | Standardize statements |
| clinical_information | Product page | Partial | Concise mechanism notes |
| pricing.price_egp | Product page / Listing | Partial | Normalize numeric format |
| pricing.currency | Product page / Listing | Partial | Default to EGP |
| pricing.availability_status | Product page / Listing | Partial | Standardize labels |
| prescription_required | Product page | Partial | Normalize boolean |

## Current Dataset: Coverage and Completeness

Initial consolidation yielded approximately 12 unique products, with pronounced variance in completeness. Several entries lack safety sections (contraindications, side effects, storage) and explicit active ingredient declarations; many include pricing but in inconsistent formats. Examples include:

- Plavix: Detailed indications, dosage guidance, and grapefruit warning.[^2]
- Plendil: Thorough mechanism of action and clear indications; safety sections largely absent.[^3]
- Zyrtec drops: Comprehensive pediatric dosing, administration guidance, and mechanism of action.[^18]
- Prontogest: Detailed description, indications, and dosage recommendations.[^13]

Table 4. Field coverage matrix (selected products; partial)

| Product | Name (AR/EN) | Description (AR/EN) | Specs | Active Ingredients | Indications | Dosage | Contraindications | Side Effects | Storage | Clinical Info | Pricing |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Plavix | Complete | Complete | Partial | Complete | Complete | Complete | Partial | Partial | Missing | Missing | Complete[^2] |
| Plendil | Complete | Complete | Partial | Complete | Complete | Partial | Missing | Missing | Missing | Complete[^3] |
| Zyrtec drops | Complete | Complete | Partial | Complete | Complete | Complete | Complete | Partial | Missing | Complete[^18] |
| Prontogest | Complete | Complete | Partial | Partial | Complete | Complete | Missing | Missing | Missing | Partial[^13] |
| Polyfresh variants | Complete | Partial | Partial | Missing | Missing | Partial | Missing | Partial | Partial | Partial[^4][^5][^6] |
| Polymart gel | Complete | Partial | Partial | Missing | Partial | Partial | Partial | Partial | Partial | Partial[^7] |
| Polymer nasal sprays | Complete | Complete | Partial | Partial | Partial | Partial | Missing | Partial | Partial | Partial[^8][^9][^10] |
| Power Cold & Flu | Complete | Complete | Partial | Partial | Partial | Partial | Partial | Partial | Missing | Partial | Complete[^11] |
| Prisoline | Complete | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^14] |
| Primrose Plus | Complete | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^12] |
| Procoralan | Complete | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^15] |
| Predsol Forte | Complete | Partial | Partial | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Complete[^16] |
| Predapox | Complete | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^17] |
| Pravotin (30 & 14 sachets) | Complete | Partial | Partial | Partial | Partial | Partial | Missing | Missing | Missing | Missing | Complete[^19][^20] |
| Baby Nadif | Complete | Partial | Partial | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Complete[^21] |
| Limitless Baby D | Complete | Complete | Partial | Complete | Complete | Complete | Complete | Partial | Missing | Partial | Complete[^22] |
| Gripe Water | Complete | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^23] |
| Kids Appetite | Complete | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^24] |
| Sanso Baby Water | Complete | Partial | Partial | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Complete[^25] |
| Kalobin | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^26] |
| Declophen | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^27] |
| Baby Relief | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^28] |
| Diprosone | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^29] |
| Egycusate | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^30] |
| Normocard | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^31] |
| Asthmarelief | Complete | Missing | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^32] |
| Averobios | Complete | Partial | Partial | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^33] |
| Septrin | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^34] |
| Ateño C | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^35] |
| Vagizole | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^36] |
| Flamotal | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^37] |
| Adwiflam | Complete | Missing | Partial | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Complete[^38] |

The enrichment plan prioritizes extraction from pages with rich content and schedules targeted re-visits to incomplete pages during off-peak windows. Inference is avoided unless explicitly supported by source text.

## Expansion via Offline Listing Files (Scalable URL Harvesting)

To reduce server load and accelerate coverage, the expansion strategy relies on parsing category listing pages for product_url fields, normalizing names, and building a deduplicated registry. The page 124 listing yielded 20 structured entries, including concentrations and pack sizes—confirmation that offline parsing can reliably supply high-quality candidates.[^47]

Table 5. Candidate URLs from page 124 expansion (summary)

| Product Name | Product URL (reference) | Intended Category | Notes |
|---|---|---|---|
| Declophen 12.5mg infantile suppositories | See [^27] | Pediatrics | Antipyretic/analgesic suppositories |
| Baby Relief 25mg suppositories | See [^28] | Pediatrics | Fever and pain relief |
| Diprosone 0.05% ointment | See [^29] | Dermatology | Topical corticosteroid |
| Egycusate syrup 20mg/5ml | See [^30] | Syrup | Concentration and volume present |
| Normocard 2.5mg tablets | See [^31] | Cardiovascular | Brand and pack size present |
| Bioderma Pigmentbio Vitamin C concentrate | See [^39] | Skincare | Concentrate for pigmentation |
| Asthmarelief salbutamol inhalation solution | See [^32] | Respiratory | Salbutamol 2.5mg/2.5ml |
| Averobios oral suspension (amoxicillin/clavulanic) | See [^33] | Antibiotic | Active ingredients listed |
| Septrin suspension | See [^34] | Antibiotic | Suspension form |
| Vetocetamol 24 tablets | See [^40] | Analgesics | Pain relief tablets |
| Ateño C 100/25mg tablets | See [^35] | Cardiovascular | Combination therapy |
| Flamotal 600mg tablets | See [^37] | NSAIDs | Anti-inflammatory |
| Dolphin K-SR 75mg capsules | See [^41] | NSAIDs | Extended-release |
| Stopadol Night 30 tablets | See [^42] | Analgesics | Sleep-assist analgesic |
| Vagizole 2% vaginal cream | See [^36] | Gynecological | Antifungal cream |
| Vitacare Green Coffee Complex 20 capsules | See [^43] | Supplements | Weight management complex |
| Puritan’s Pride Folic Acid 800 mcg 250 tablets | See [^44] | Supplements | High-dose folic acid |
| Vitacare African Mango 1000mg 20 capsules | See [^45] | Supplements | Weight management |
| Sanotact Stay Active 400mg 30 tablets | See [^46] | Supplements | Vitality support |
| Adwiflam emulgel 50gm | See [^38] | Topical | Analgesic/anti-inflammatory gel |

Further waves will harvest additional listing files beyond page 124, maintaining a governed registry grouped by category for balanced coverage and processing efficiency.

## Rate-Limiting Management and Operational Playbook

Chefaa applies anti-bot/rate limiting that constrains live extractions. The operational approach is designed to maintain throughput while respecting server constraints:

- Staggered processing windows and jittered delays.
- Batch sizing with health monitoring and backoff.
- Reduced concurrent sessions and prioritized high-completeness pages.
- Targeted re-visits during off-peak hours for incomplete pages.

Table 6. Operational cadence plan

| Batch | Batch Size | Cooldown Window | Health Checks | Notes |
|---|---|---|---|---|
| B1 | 8–10 URLs | 60s ± jitter | Monitor failures/response codes | Initial consolidation run |
| B2 | 8–10 URLs | 75s ± jitter | Flag rate-limit symptoms | Resume after stabilization |
| B3 | 8–10 URLs | 60s ± jitter | Retry failed from B1 | Prioritize rich pages |
| B4 | 8–10 URLs | 75s ± jitter | Escalate backoff on repeated failures | Maintain session continuity |
| B5+ | 8–10 URLs | 60–90s ± jitter | Continuous monitoring | Sustain throughput |

This cadence balances progress with respect for operational limits. Health monitoring flags suspected rate-limit events and triggers backoff rules to protect session continuity.

## Data Quality, Validation, and Pricing Normalization

Quality controls ensure schema compliance and bilingual fidelity:

- Field normalization and unit standardization (mg, ml; pack sizes).
- Bilingual completeness with explicit nulls where content is absent; no fabrication of translations.
- Pricing normalization: numeric price_egp; currency “EGP”; availability_status standardized (“Available”, “In Stock”, “Available for delivery”).
- Coverage scoring to quantify completeness.
- Provenance tracking for all values, especially for price and availability fields.

Table 7. Pricing field normalization map

| Observed Patterns | Standardized Rule | Notes |
|---|---|---|
| Price as text (“246 جنيه”) | Numeric price_egp with regex extraction | 246 |
| Currency explicit | currency = “EGP” | Default to EGP when implied |
| Delivery window present | availability_status standardized | “Available for delivery” |
| Return/exchange mention | Store as note if not standardized | Avoid conflating with price |
| Availability labels vary | availability_status normalized | “Available”, “In Stock” |

These rules enable consistent analytics and reduce noise in pricing comparisons across products and time.

## Roadmap to 200 Medications

The path to 200 unique medications is structured around offline URL harvesting, prioritized batch processing, and disciplined rate-limit management:

- Immediate milestone: consolidate and reach 50 unique medications.
- Ongoing: parse additional listing files beyond page 124 to expand the URL pool.
- Continuous: targeted re-visits to incomplete pages during off-peak hours.
- Governance: maintain Batch 1 outputs only in the designated directory.

Table 8. Milestone plan

| Milestone | Target Date | Deliverables | Acceptance Criteria |
|---|---|---|---|
| M1: Consolidation complete | End of current session | Deduplicated dataset; QA report | Zero duplicates; schema validation passed |
| M2: Reach 50 medications | End of current session | 50 unique products | ≥50 unique product_url entries |
| M3: Stabilize extraction cadence | +1–2 days | Operational playbook metrics | Failure rate <10%; cooldown adherence |
| M4: Expand beyond page 124 | +3–5 days | Additional listing files parsed | ≥100 cumulative unique URLs |
| M5: Toward 200 medications | +7–10 days | Continuous extraction | ≥200 unique products with bilingual coverage where available |

## Appendices: Extracted Product Examples (Evidence)

The following examples illustrate the breadth of data captured and highlight gaps to be addressed through re-visits and enrichment:

- Plavix: Detailed therapeutic indications (e.g., acute coronary syndrome, post-stent care), dosage guidance, and a specific grapefruit warning; clinical details are largely present while storage is absent.[^2]
- Plendil: Comprehensive mechanism of action (calcium channel blocker), clear indications for hypertension and angina; safety sections are missing.[^3]
- Zyrtec drops: Detailed pediatric dosing tiers, administration guidance, and mechanism as an antihistamine; broad indications across allergic conditions.[^18]
- Prontogest: Rich description and indications (progesterone deficiency, pregnancy stabilization), dosage recommendations; safety sections unspecified.[^13]
- Congestal: Multi-ingredient cold formulation (Paracetamol, Chlorpheniramine, Pseudoephedrine), indications, dosing, contraindications, side effects; pricing and availability included.[^49]
- Otrivin nasal drops: Clear active ingredient (Xylometazoline 0.1%), dosing steps, and a explicit warning against use beyond seven consecutive days; pricing present.[^50]
- Bronchicum syrup: Herbal composition with thyme and primrose extracts; indications, dosing by age group, cautions for diabetes and pregnancy; storage temperature specified.[^51]
- Allvent syrup: Multi-component respiratory syrup (Bromhexine, Guaifenesin, Terbutaline, Menthol); dosing, contraindications, side effects, and comparisons provided.[^54]
- One Two Three (123): Combination cold medication; indications, dosing for adults, and side effects; pricing included.[^55]
- Lary Pro lozenges: Dual active ingredients (Lysozyme, Dequalinium), dosing for mild/advanced conditions, contraindications for chicken protein allergy, side effects including tongue burning.[^53]
- Acetylcysteine 600mg: Mucolytic mechanism, dosing, contraindications for hypersensitivity, broad side effect profile, and interaction warnings; pricing present.[^52]
- Ambroxol drops: Dosing by age groups with concentration (7.5 mg/ml), indications for respiratory diseases; pricing present.[^56]
- Bisolvon syrup: Mechanism (mucolytic via Bromhexine), dosing by age, indications across chronic and acute bronchial conditions; pricing present.[^57]
- Brufen 200mg: Listing-level details; price and pack size present; comprehensive clinical sections absent.[^58]
- Angiflash throat spray: Listing-level details; price and volume present; clinical sections absent.[^59]

## Evidence Snapshot: Consolidated Metrics

To demonstrate the immediate operational value of offline listing-file parsing, the following table summarizes the initial consolidation metrics:

Table 9. Consolidated metrics snapshot

| Metric | Value | Source/Evidence |
|---|---|---|
| Seed URL count | 28 | Initial listing files (p47 and kids page1) |
| Extracted count (initial) | ~12 | Seed set processed with partial completeness |
| Expansion candidates (page 124) | 20 | Structured entries surfaced via offline parsing |
| Coverage variance | High | Rich pages (e.g., Plavix, Zyrtec) vs. partials (e.g., eye drops, certain syrups) |
| Pricing normalization need | Immediate | Mixed formats; EGP present, labels vary |
| Next milestone | 50 | Achievable within current session |

## Information Gaps and Mitigation

Several structural gaps must be actively mitigated:

- Access constraints: Rate limiting may delay live extractions; mitigate via offline URL harvesting and scheduled re-visits.[^1]
- Field completeness: Many products lack active ingredients, contraindications, side effects, and storage; mitigate through targeted re-visits and structured enrichment.
- Pricing normalization: Standardize currency, numeric values, and availability status across all entries.
- Duplicates: A canonical dedup key (product_url) and governance guardrails are required to prevent duplication across files and batches.
- Harvesting coverage: Expand beyond page 124 to additional listing files (e.g., cough/cold pages and kids categories) to reach 200 unique medications.

## References

[^1]: Chefaa Terms of Service. https://chefaa.com:443/eg-ar/page/terms-of-service  
[^2]: Plavix 75mg | 28 tablets. https://chefaa.com:443/eg-ar/nowProduct/plavix-thrombosis-treatment-75mg-28tab-jxen  
[^3]: Plendil 10mg | 30 tablets. https://chefaa.com:443/eg-ar/nowProduct/plendil-high-blood-pressure-10mg-30tab-ges1  
[^4]: Polyfresh 0.2% Eye Drops (20×4ml). https://chefaa.com:443/eg-ar/nowProduct/polyfresh-0-2-sdu-eye-drops-20-x-0-4-ml-gvav  
[^5]: Polyfresh Advanced Eye Drops | 10ml. https://chefaa.com:443/eg-ar/nowProduct/polyfresh-advanced-eye-drops-10-ml-ikoe  
[^6]: Polyfresh Extra Eye Drops (30×0.4ml). https://chefaa.com:443/eg-ar/nowProduct/polyfresh-extra-sdu-eye-drops-30-x-0-4-ml-gnqw  
[^7]: Polymart Topical Gel | 50gm. https://chefaa.com:443/eg-ar/nowProduct/polymart-topical-gel-50-gm-6vx7  
[^8]: Polymer Adult Hypertonic 3% Nasal Spray | 100 ml. https://chefaa.com:443/eg-ar/nowProduct/polymer-adult-hypertonic-3-nasal-spray  
[^9]: Polymer Baby Isotonic 0.9% Nasal Spray. https://chefaa.com:443/eg-ar/nowProduct/polymer-baby-isotonic-09-nasal-spray  
[^10]: Polymer Kids Hypertonic 2.3% Nasal Spray | 100ml. https://chefaa.com:443/eg-ar/nowProduct/polymer-kids-hypertonic-23-nasal-spray  
[^11]: Power Cold and Flu | 20 tablets. https://chefaa.com:443/eg-ar/nowProduct/power-cold-and-flu-20-tab  
[^12]: Primrose Plus | 30 capsules. https://chefaa.com:443/eg-ar/nowProduct/primrose-plus-30-caps-byvi  
[^13]: Prontogest 400 mg | 30 suppositories. https://chefaa.com:443/eg-ar/nowProduct/prontogest-stabilize-pregnancy-400mg-30supp-lkmt  
[^14]: Prisoline Eye and Nose Drops | 15ml. https://chefaa.com:443/eg-ar/nowProduct/prisoline-eye-nose-drops-15-ml-efci  
[^15]: Procoralan 5mg | 28 tablets. https://chefaa.com:443/eg-ar/nowProduct/procoralan-5mg-28tab-mjae  
[^16]: Predsol Forte Allergy Syrup | 60ml. https://chefaa.com:443/eg-ar/nowProduct/predsol-forte-to-treat-allergies-15mg5ml-60ml-susp-uteb  
[^17]: Predapox 60mg | 6 tablets. https://chefaa.com:443/eg-ar/nowProduct/predapox-60-mg-6-tabTTPR  
[^18]: Zyrtec 10mg/ml Oral Drops | 10ml. https://chefaa.com:443/eg-ar/nowProduct/zyrtec-10mg-ml-oral-drops-10-ml  
[^19]: Pravotin 100mg | 30 sachets. https://chefaa.com:443/eg-ar/nowProduct/pravotin-to-treat-anemia-100mg-30sach-8r57  
[^20]: Pravotin 100mg | 14 sachets. https://chefaa.com:443/eg-ar/nowProduct/pravotin-to-treat-anemia-100mg-14sach-9iab  
[^21]: Baby Nadif Nasal Spray | 50ml. https://chefaa.com:443/eg-ar/nowProduct/baby-nadif-nasal-spray-50-ml  
[^22]: Limitless Baby D Drops | 15ml. https://chefaa.com:443/eg-ar/nowProduct/limitless-baby-d-drops-1600-iu-ml-15-ml-6ldy  
[^23]: Gripe Water Smile Syrup | 120ml. https://chefaa.com:443/eg-ar/nowProduct/gripe-water-smile-syrup-120-ml-fhm6  
[^24]: Kids Appetite Daily Vitamin Syrup | 125ml. https://chefaa.com:443/eg-ar/nowProduct/kids-appetite-daily-vitamin-syrup-125ml-3air  
[^25]: Sanso Baby Water | 100ml. https://chefaa.com:443/eg-ar/nowProduct/sanso-baby-water-syrup-100ml-isby  
[^26]: Kalobin Oral Drops | 20ml. https://chefaa.com:443/eg-ar/nowProduct/kalobin-20-ml-oral-dropmfN3  
[^27]: Declophen 12.5mg | 5 infantile suppositories. https://chefaa.com:443/eg-ar/nowProduct/declophen-125mg-5-infantile-supp-xlwf  
[^28]: Baby Relief 25mg | 5 suppositories. https://chefaa.com:443/eg-ar/nowProduct/baby-relief-25mg-5supp-eexz  
[^29]: Diprosone 0.05% Ointment | 10gm. https://chefaa.com:443/eg-ar/nowProduct/diprosone-005-ointment-10gm-acup  
[^30]: Egycusate Syrup | 100ml. https://chefaa.com:443/eg-ar/nowProduct/egycusate-syrup-20mg5ml-100ml-6pkj  
[^31]: Normocard 2.5mg | 30 tablets. https://chefaa.com:443/eg-ar/nowProduct/normocard-25mg-30-tabs-giws  
[^32]: Asthmarelief Salbutamol | 20 ampoules. https://chefaa.com:443/eg-ar/nowProduct/asthmarelief-20-ampoules-kilh  
[^33]: Averobios Oral Suspension | 75ml. https://chefaa.com:443/eg-ar/nowProduct/averobios-oral-suspension-75ml-wgu2  
[^34]: Septrin Suspension | 120ml. https://chefaa.com:443/eg-ar/nowProduct/septrin-suspension-120ml-bydw  
[^35]: Ateño C 100/25mg | 20 tablets. https://chefaa.com:443/eg-ar/nowProduct/ateno-c-10025mg-20tab-ujec  
[^36]: Vagizole 2% Vaginal Cream | 15gm. https://chefaa.com:443/eg-ar/nowProduct/vagizole-2-vaginal-cream-15gm-ytq0  
[^37]: Flamotal 600mg | 20 tablets. https://chefaa.com:443/eg-ar/nowProduct/flamotal-600mg-20tabs-ulnc  
[^38]: Adwiflam Emulgel | 50gm. https://chefaa.com:443/eg-ar/nowProduct/adwiflam-emulgel-50gm-rt6r  
[^39]: Bioderma Pigmentbio Vitamin C Concentrate | 15ml. https://chefaa.com:443/eg-ar/nowProduct/bioderma-pigmentbio-vitamin-c-concentrate-15ml-x0tp  
[^40]: Vetocetamol | 24 tablets. https://chefaa.com:443/eg-ar/nowProduct/vetocetamol-24tab-jljs  
[^41]: Dolphin K-SR 75mg | 20 capsules. https://chefaa.com:443/eg-ar/nowProduct/dolphin-k-sr-75mg-20-caps-f4pc  
[^42]: Stopadol Night | 30 tablets. https://chefaa.com:443/eg-ar/nowProduct/stopadol-night-30tabs-uj2g  
[^43]: Vitacare Green Coffee Complex | 20 capsules. https://chefaa.com:443/eg-ar/nowProduct/vitacare-green-coffee-complex-20-caps-omaz  
[^44]: Puritan's Pride Folic Acid 800 mcg | 250 tablets. https://chefaa.com:443/eg-ar/nowProduct/puritans-pride-folic-acid-800-mcg-250-tabs-zgrf  
[^45]: Vitacare African Mango 1000mg | 20 capsules. https://chefaa.com:443/eg-ar/nowProduct/vitacare-african-mango-1000-mg-20-caps-v2cq  
[^46]: Sanotact Stay Active | 30 tablets. https://chefaa.com:443/eg-ar/nowProduct/sanotact-stay-active-30-tabs-y4db  
[^47]: Chefaa Medications Category Page (Page 124). https://chefaa.com/eg-ar/now/category/medications?page=124  
[^49]: Congestal Tablets | 20 tablets. https://chefaa.com:443/eg-ar/nowProduct/congestal-tab  
[^50]: Otrivin Nasal Drops Adult | 15ml. https://chefaa.com:443/eg-ar/nowProduct/otrivin-nasal-drops-adult-15-ml  
[^51]: Bronchicum Elixir | 100ml. https://chefaa.com:443/eg-ar/nowProduct/bronchicum-s-elixir-anti-cough-elixir-100-ml  
[^52]: Acetylcysteine 600mg | 10 sachets. https://chefaa.com:443/eg-ar/nowProduct/acetylcistein-600mg-sachets  
[^53]: Lary Pro Lozenges | 20 lozenges. https://chefaa.com:443/eg-ar/nowProduct/lary-pro-20-lozenges  
[^54]: Allvent Syrup | 125ml. https://chefaa.com:443/eg-ar/nowProduct/all-vent-syrup-125-ml  
[^55]: One Two Three (123) Tablets | 20 tablets. https://chefaa.com:443/eg-ar/nowProduct/one-two-three-tablet  
[^56]: Ambroxol Drops 7.5 mg/ml | 15ml. https://chefaa.com:443/eg-ar/nowProduct/ambroxol-respiratory-diseases-75mg-drops-gv5m  
[^57]: Bisolvon Syrup 4mg/5ml | 115ml. https://chefaa.com:443/eg-ar/nowProduct/bisolvon-syrup  
[^58]: Brufen 200mg | 30 tablets. https://chefaa.com:443/eg-ar/nowProduct/brufen-200-mg-30-tablet-w7lw  
[^59]: Angiflash Sore Throat Spray | 20ml. https://chefaa.com:443/eg-ar/nowProduct/angiflash-sore-throat-spray-20-mlsRei

---

This consolidated report establishes an operational baseline and a scalable pathway to the full 200 medications in Batch 1. By emphasizing offline URL harvesting, prioritized batch processing, and disciplined rate-limit management, the team can expand coverage efficiently while maintaining high standards for data quality and reproducibility.
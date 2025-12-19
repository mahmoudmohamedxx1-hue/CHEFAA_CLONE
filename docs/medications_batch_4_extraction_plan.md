# Medications Batch 4 (Products 601–800) Extraction and Analysis Plan

## Executive Summary

This plan defines the approach to extract, validate, enrich, and deliver comprehensive pharmaceutical overviews for products 601–800 from the Chefaa catalog. The primary objective is to transform partial listing data (names, brands, prices, pack sizes) into complete, standardized product dossiers aligned to clinical documentation standards, suitable for medical writers, pharmacists, data engineers, and regulatory reviewers. Deliverables will be saved to data/overviews/medications_batch_4/medications_overview_batch_4.json, with robust quality controls and a transparent audit trail.

Given current context constraints, the full list of products 601–800 is not yet available. Accordingly, this plan also includes: (1) a mechanism to acquire the target product list; (2) exact extraction and enrichment methods; (3) data structures, field mapping, and normalization rules; and (4) QA, audit, and delivery specifications. The Chefaa website serves as the authoritative source for product pages and category listings[^1].

![Chefaa medications listing context for extraction planning](docs/chefaa_homepage/chefaa_medications_listing.png)

## Objectives and Scope

The scope of Batch 4 encompasses up to 200 distinct medication product pages from Chefaa, spanning diverse dosage forms, therapeutic classes, and brand variations. For each product, the aim is to compile a complete overview, including identity (proprietary and INN where determinable), composition (active ingredient(s) and strength(s)), dosage forms and routes, therapeutic indications, contraindications, warnings, adverse reactions, drug interactions, storage requirements, and clinical pharmacology. Ancillary clinical fields—such as pregnancy/lactation considerations, pediatric/geriatric usage, and relevant regulatory notes—will be captured when present.

Completeness criteria are defined field-by-field. Where a product page lacks explicit detail, fields will be populated with explicit “unknown” markers and captured in an exceptions log to drive targeted follow-up extraction. The target output is a consolidated JSON object saved at data/overviews/medications_batch_4/medications_overview_batch_4.json.

Constraints arise from mixed-language content (Arabic with occasional English), variable page structures, dynamic content, and inconsistent presence of clinical details in listing pages. This plan therefore emphasizes a page-level extraction workflow, normalization against canonical pharmacological categories, and thorough QA.

## Data Sources and Input Inventory

The available input files include three Chefaa medication datasets:

- data/medications/medications_products.json (148 products),
- data/medications/comprehensive_medications_products.json (287 products),
- data/medications/final_comprehensive_extraction_results.json (summary metadata of 2,504 products).

The listing metadata indicates products span multiple subcategories (e.g., kids_infant_medications, stomach_bowel_medications, cough_cold_medications, eye_ear_medications, pain_relief_medications, skin_treatment_medications, allergy_medications, health_condition_medications, main_medications_category). Typical listing fields include product name, brand, price in Egyptian Pounds (EGP), availability status, prescription requirement, pack size, dosage information (e.g., strength/volume), and category classification.

Two constraints are relevant for Batch 4:
1) The exact list for products 601–800 is not yet provided. A supplemental extraction or file provision is required.
2) Listing pages typically lack the detailed clinical sections; comprehensive fields must be sourced from individual product detail pages.

To mitigate variability, the extraction strategy relies on navigating product detail pages and applying consistent selectors and normalization routines. Chefaa is the authoritative catalog source[^1].

Table 1 provides an inventory summary of the available input files and their relevance.

Table 1. Input file inventory and relevance to Batch 4
| File path                                             | Product count | Subcategories covered            | Typical fields present                                     | Relevance for Batch 4                                         |
|-------------------------------------------------------|---------------|----------------------------------|------------------------------------------------------------|----------------------------------------------------------------|
| data/medications/medications_products.json            | 148           | 9                                | product_name, brand, price_egp, dosage_information, category | Baseline structure; partial coverage for mapping experiments   |
| data/medications/comprehensive_medications_products.json | 287           | 9 (mostly complete)             | Same as above; expanded lists per subcategory             | Broader structure; informs normalization across categories     |
| data/medications/final_comprehensive_extraction_results.json | Metadata only | N/A                              | Project-scale summaries                                    | Confirms larger catalog scope; not a direct product feed       |

![Example medications listing page structure](docs/chefaa_homepage/chefaa_medications_listing.png)

### Input File Schema Notes

Listing-level fields are generally consistent across files: product_name, brand_name (nullable), description, price_egp, availability_status, prescription_required, dosage_information (frequently shorthand for strength/pack), category, and occasionally volume or concentration for liquids. The comprehensive file adds extraction_status and pages_processed for subcategories, evidencing pagination and reliability. Notably absent at the listing level are direct URLs to individual product detail pages—a gap that requires navigation from category/listing pages to product-level content.

## Target Product List Acquisition (Products 601–800)

Two pathways are available to obtain the definitive list for products 601–800:

- Option A (Recommended): A batch catalog extraction pipeline that paginates through the main medications listing, consolidating product entries from the relevant page range (post-600). This aligns with how prior batches were assembled and confirmed by summary metadata of prior large-scale extraction (final_comprehensive_extraction_results.json).  
- Option B: Receive a structured JSON or CSV of product identifiers and canonical names corresponding to positions 601–800, with optional product URLs for direct detail-page scraping.

In the absence of an explicit list, this plan assumes Option A. The acquisition process will:
1) Identify the exact page range that yields product positions 601–800, using a sequential enumeration across category listings.
2) Capture product identifiers and infer product detail URLs by traversing item cards.
3) Generate a lightweight index mapping global positions to product IDs and canonical labels for auditability.

Acceptance criteria include:
- Count: Exactly 200 distinct products, uniquely identified.
- Positional integrity: Products correspond to the 601–800 sequence across the catalog.
- Traceability: Each entry has a source page and a navigable path to a product detail page.

![Pagination-based enumeration to locate products 601–800](docs/chefaa_homepage/chefaa_medications_listing.png)

### Traceability and Indexing

A positional index will maintain the mapping from global catalog position to product ID. Index fields include: position (1-based), product_name, brand_name (if available), inferred product_detail_ref (relative path reference), subcategory, source_page, and extraction_timestamp. This index underpins completeness checks, deduplication, and downstream audit.

## Product Page Discovery and URL Resolution

Given that listing pages seldom expose direct product detail links in structured fields, page discovery will rely on link traversal from item cards within category/listing views. The process will:
- Enumerate clickable item tiles within the medications listing pagination.
- Resolve a stable product detail reference (relative path) from each tile.
- Store the reference for deterministic retrieval and re-extraction if necessary.
- If a product detail reference cannot be determined, mark the item as “link_unavailable” and escalate for interactive navigation.

![Chefaa product page context used to validate detail extraction](docs/chefaa_homepage/chefaa_product_page.png)

In the event that automated extraction is hindered by dynamic content or load timing, interactive browsing may be required. Where content loads asynchronously, extraction scripts will wait for key selectors or apply retry logic with bounded timeouts to minimize flakiness.

### Failure Handling and Retries

Retry logic will target common error signatures, such as HTTP errors (e.g., 404), aborted requests (ERR_ABORTED), and dynamic load timeouts. If a page repeatedly fails, the entry will be flagged in an exceptions log with error type, timestamp, and suggested resolution. Persistent failures will trigger interactive navigation for manual verification, followed by automated re-extraction once the issue is resolved. A bounded exponential backoff will be used to avoid overwhelming the server while preserving batch throughput[^1].

## Comprehensive Field Extraction Methodology

The extraction flow begins at the product detail page, where textual and structured content is captured, parsed, and normalized into a schema tailored for pharmaceutical overviews. Mixed-language content (Arabic with occasional English) will be handled by preserving original strings and adding an English translation when explicitly available in the page. All prices will be stored in EGP, with pack sizes and strengths retained verbatim to support unit-aware downstream validation.

![Chefaa product page sections targeted for pharmaceutical detail capture](docs/chefaa_homepage/chefaa_product_page.png)

Table 2 provides the master field mapping between listing-level data, product page selectors/patterns, and output schema fields.

Table 2. Field mapping and normalization rules
| Source location on product page | Extraction method                       | Output schema field              | Normalization rules and examples                                                |
|----------------------------------|-----------------------------------------|----------------------------------|----------------------------------------------------------------------------------|
| Product title                    | Primary text parse                      | product_name                     | Preserve Arabic; set product_name_english if explicitly present                  |
| Brand label                      | Text parse near title                   | brand_name                       | Null when missing; trim qualifiers (e.g., “ Brand X (English)”)                  |
| Strength/concentration           | Text parse (dose field, highlights)     | strength, concentration          | Parse numeric values and units; unify mg/mL; handle ranges if present            |
| Pack size                        | Parse text near price or description    | pack_size                        | Tokenize counts/units; e.g., “20 tablets,” “30 × 0.4 mL”                         |
| Volume/vial count                | Parse labeled quantities                | volume                           | Retain mL units; unify decimals; map vial counts to unit_count if helpful        |
| Dosage form                      | Parse form (tablet, syrup, drops)       | dosage_form                      | Normalize to controlled vocabulary (tablet, capsule, syrup, gel, drops, spray)   |
| Administration route             | Parse explicit route or infer from form | route                            | Infer rules: nasal spray → intranasal; eye drops → ophthalmic; ear drops → otic |
| Price                            | Price block                             | price_egp                        | Numeric (EGP); no currency symbol                                               |
| Availability                     | Stock status block                      | availability_status              | Map to controlled terms (In Stock, Limited Quantity, Out of Stock)               |
| Prescription requirement         | Label near title/price                  | prescription_required            | Boolean or controlled text; “Not specified” when ambiguous                      |
| Category                         | Listing/product label                   | category                         | Preserve listing label; map to canonical therapeutic_class where feasible        |

### Field Definitions and Normalization Rules

The following rules govern field synthesis and validation:
- product_name: The full product title as displayed; if English is explicitly shown, populate product_name_english.
- active_ingredients: Capture INNs/generic names if present; when only brand names or Arabic descriptors exist, use “unknown” and capture raw notes in a separate exceptions log.
- strengths/concentrations: Normalize to numeric values with units (mg, mcg, % w/w, % w/v, mg/mL). For combination products, store array format with per-component strengths.
- dosage_form and route: Normalize to controlled vocabularies to harmonize across products (e.g., “tablet,” “capsule,” “effervescent tablet,” “syrup,” “suspension,” “drops,” “spray,” “gel,” “cream,” “ointment,” “injection”). Route is inferred when explicit but not labeled (e.g., nasal spray → intranasal).
- indications, contraindications, warnings, adverse_reactions: Capture as free text arrays; dedupe and normalize to sentence case for consistency.
- interactions, storage, pharmacology: Capture as labeled free text arrays; if absent, set to “unknown.”
- price_egp: Numeric EGP. Keep pack_size and strength separate to avoid conflating price with quantity.
- prescription_required: Boolean; where page ambiguity exists, set “not_specified.”

Bilingual handling preserves the original Arabic while maintaining any English labels. Where only Arabic is available, a best-effort transliteration may be retained in the product_name_english field only if explicitly present on the page; otherwise it remains null.

## Quality Control, Validation, and Audit

A multi-stage QA framework ensures completeness, correctness, and traceability:

- Completeness checks: Every required field must be present; if a field is missing on the product page, mark as “unknown” and add an entry to an exceptions log with source page reference and extraction timestamp.
- Correctness checks: Unit and strength normalization are validated (e.g., mg/mL, % w/v). Dosage_form and route mappings conform to controlled vocabularies.
- Traceability: Each record stores source_page (relative path reference), extraction_timestamp, and an extract_version to support audit and reproducibility.
- Deduplication: Products are deduplicated based on a canonical key combining product_name + brand_name + strength + pack_size + dosage_form.
- Bilingual consistency: Arabic and English strings are checked for parity; when only one is present, the other is explicitly null rather than inferred.

![QA checkpoint visualization during extraction](browser/screenshots/chefaa_current_view.png)

Table 3 provides a validation checklist for core fields.

Table 3. Validation checklist by field group
| Field group                 | Validation rule                                               | Severity | Remediation action                                      |
|----------------------------|---------------------------------------------------------------|----------|---------------------------------------------------------|
| Identity (name, brand)     | product_name present; brand_name may be null                 | High     | Re-extract; mark unknown brand                          |
| Composition (strength)     | Numeric units normalized; combination arrays where applicable | High     | Re-parse; flag unknown if absent                        |
| Dosage form and route      | Controlled vocabulary applied; route inferred when explicit   | High     | Manual mapping review                                   |
| Indications/contraindications | Presence if available; normalized sentence case              | Medium   | Set unknown; add to exceptions log                      |
| Warnings/adverse reactions | Captured as arrays; deduplicated                              | Medium   | Normalize; re-crawl if missing                          |
| Interactions/storage       | Labeled text captured; else unknown                           | Medium   | Add exceptions log; revisit if later updates available  |
| Pricing and availability   | Numeric price_egp; stock status controlled terms              | High     | Re-parse price block; retry page                        |
| Prescription requirement   | Boolean or controlled text                                    | High     | Re-extract; set not_specified if ambiguous              |
| Bilingual fields           | No inferred translations; preserve explicit English only      | Medium   | Correct schema; do not auto-translate                   |
| Source traceability        | source_page and extraction_timestamp present                  | High     | Regenerate audit trail                                  |

### Exceptions and Resolution

The exceptions log records every “unknown” or ambiguous field with sufficient context (product ID, source page reference, timestamp). Where feasible, secondary passes attempt interactive navigation or alternative selector patterns to recover missing data. Resolution status is tracked (open/pending/closed), and once remedied, records are updated with a new extract_version.

## Data Model and Output Specification

The output dataset will be a single JSON object saved to data/overviews/medications_batch_4/medications_overview_batch_4.json. The JSON structure captures pharmaceutical details in a normalized, clinical-friendly schema. Prices are in EGP.

Table 4 defines the output schema, including types and validation constraints.

Table 4. Output JSON schema
| Field name                          | Type          | Required | Controlled vocabulary / format                      | Notes                                                                 |
|-------------------------------------|---------------|----------|------------------------------------------------------|-----------------------------------------------------------------------|
| product_id                          | string        | Yes      | N/A                                                  | Unique product identifier within batch                                 |
| product_name                        | string        | Yes      | N/A                                                  | Full title as shown (Arabic preserved)                                 |
| product_name_english                | string/null   | No       | N/A                                                  | Only if explicitly shown on page                                       |
| brand_name                          | string/null   | No       | N/A                                                  | Nullable                                                               |
| active_ingredients                  | array/null    | No       | INN/generic names                                    | [{name: string, strength?: string}]                                    |
| strength                            | string/null   | No       | e.g., “500 mg”, “0.1%”, “4 mg/5 mL”                  | For single-entity products; for combos use active_ingredients          |
| concentration                       | string/null   | No       | e.g., “0.3%”, “50 mcg/dose”                          | Use when expressed as % or per-dose                                   |
| dosage_form                         | string        | Yes      | tablet, capsule, syrup, suspension, drops, spray, gel, cream, ointment, injection, lozenge, effervescent | Controlled vocabulary                                                  |
| route                               | string        | No       | oral, intranasal, ophthalmic, otic, topical, rectal, injection | Controlled vocabulary; infer if necessary                              |
| indications                         | array/null    | No       | Free text                                            | Normalize and deduplicate                                              |
| contraindications                   | array/null    | No       | Free text                                            | Normalize and deduplicate                                              |
| warnings                            | array/null    | No       | Free text                                            | Normalize and deduplicate                                              |
| adverse_reactions                   | array/null    | No       | Free text                                            | Normalize and deduplicate                                              |
| drug_interactions                   | array/null    | No       | Free text                                            | Normalize and deduplicate                                              |
| storage_requirements                | string/null   | No       | Free text                                            | Preserve explicit labels                                               |
| clinical_pharmacology               | string/null   | No       | Free text                                            | Mechanism of action, PK/PD if available                                |
| pack_size                           | string/null   | No       | e.g., “20 tablets”, “30 × 0.4 mL”                    | Do not conflate with price                                             |
| volume                              | string/null   | No       | e.g., “150 mL”, “5 mL vial”                          | For liquids                                                            |
| price_egp                           | number        | Yes      | Numeric EGP                                          | No currency symbol                                                     |
| availability_status                 | string        | Yes      | In Stock, Limited Quantity, Out of Stock             | Controlled vocabulary                                                  |
| prescription_required               | boolean/null  | Yes      | true/false/null (not_specified)                      | Set null only when truly ambiguous                                     |
| category                            | string        | No       | N/A                                                  | Listing-level category if present                                      |
| therapeutic_class                   | string/null   | No       | N/A                                                  | Canonicalized where feasible                                           |
| language_notes                      | string/null   | No       | N/A                                                  | e.g., “Arabic-only content”                                            |
| source_page                         | string        | Yes      | Relative path reference                              | For audit and re-extraction                                            |
| extraction_timestamp                | string        | Yes      | ISO 8601                                             | UTC                                                                    |
| extract_version                     | string        | Yes      | N/A                                                  | Bump on any re-extraction                                              |

### Therapeutic Classification Normalization

Listing-level categories (e.g., “Pain Relief,” “Antihistamine,” “Nasal Steroid”) will be mapped to canonical therapeutic classes, recognizing that one product can span multiple indications (e.g., decongestant plus antihistamine combinations). The normalization process will:
- Inherit the listing label where stable.
- Map to a controlled taxonomy (e.g., analgesics, antihistamines, nasal corticosteroids, proton pump inhibitors, probiotics, antispasmodics, mucolytics).
- Record the mapping decisions and exceptions in a classification log to maintain transparency and enable future reclassification.

## Operational Workflow and Execution Steps

The operational pipeline follows a linear, auditable sequence from index creation to final delivery:

1) Build the positional index for products 601–800 (via Option A or Option B).
2) Resolve product detail references and compile an extraction queue.
3) For each product, fetch the product page content and extract fields per the mapping.
4) Normalize dosage_form/route, strengths/units, and price to controlled vocabularies and numeric formats.
5) Validate completeness, run deduplication, and generate bilingual strings where explicit.
6) Update exceptions log with unresolved fields and retry where feasible.
7) Save the consolidated JSON to data/overviews/medications_batch_4/medications_overview_batch_4.json.
8) Run end-to-end QA checks and produce the extraction completion report.

![Operational checkpoint screenshot during batch processing](browser/screenshots/chefaa_current_state.png)

Table 5 details the operational checklist and ownership.

Table 5. Operational checklist
| Step | Description                                            | Input                               | Output                                     | Owner        | Acceptance criteria                                        |
|------|--------------------------------------------------------|-------------------------------------|--------------------------------------------|--------------|------------------------------------------------------------|
| 1    | Acquire product list 601–800                           | Catalog listings                    | Positional index                           | Data engineer | 200 unique products; source page recorded                  |
| 2    | Resolve product detail references                      | Listing tiles                       | product_detail_ref per product             | Data engineer | ≥95% reference resolution rate                             |
| 3    | Extract product page content                           | Product pages                       | Raw parsed fields                          | Data engineer | ≥95% success per item                                      |
| 4    | Normalize and map fields                               | Raw fields                          | Normalized fields per schema               | Data engineer | 100% schema conformity; unit normalization                 |
| 5    | Validate and deduplicate                               | Normalized records                  | QA-ready records                           | QA analyst   | 0 duplicate keys; QA checklist pass                        |
| 6    | Exceptions handling and retries                        | Exceptions log                      | Updated records                            | Data engineer | ≥70% exception resolution where feasible                   |
| 7    | Save JSON and artifacts                                | QA-ready records                    | Consolidated output JSON                   | Data engineer | Valid JSON; fields present                                 |
| 8    | Final QA and completion report                         | Output JSON                         | QA report and audit files                  | QA analyst   | All checks pass; discrepancies documented                  |

### Progress Tracking and Checkpoints

Progress will be tracked per product with milestone gates (e.g., extraction queue built, 25% extracted, 50% normalized, 75% validated, 100% complete). Each gate will run a mini-QA cycle, comparing observed yields against targets and documenting any systematic gaps (e.g., missing clinical sections across a subcategory). Exceptions will be triaged by severity and resolution effort, with recurring issues escalated for interactive navigation or selector pattern revision.

## Risk Management and Mitigation

- Dynamic loading and pagination redirects: Apply bounded exponential backoff and retry with distinct selectors. Persist session state and limit concurrent requests to reduce triggers for anti-bot behavior. Escalate persistent failures to interactive navigation and record remediation.
- Incomplete clinical data on detail pages: Many retail pages emphasize usage and composition rather than full prescribing information. In such cases, set “unknown” for missing sections and maintain an exceptions log. If product labeling is present elsewhere (e.g., leaflets), capture as text where visible; otherwise, do not infer.
- Language ambiguity: Preserve Arabic content and avoid translation unless explicitly available. Record bilingual status in language_notes to support downstream clinical editorial review.
- Data drift: Prices, stock status, and even pack sizes may change. The extract_timestamp and extract_version fields ensure auditable versioning for price and availability deltas across time.

![Risk scenario: redirect and dynamic loading pattern observed](browser/screenshots/chefaa_after_scroll.png)

## Acceptance Criteria and Deliverables

Deliverables include:
- Consolidated output: data/overviews/medications_batch_4/medications_overview_batch_4.json (200 distinct products).
- Audit and QA artifacts: positional index, validation checklist outputs, exceptions log with resolutions, and the completion report.

Acceptance criteria:
- Count and uniqueness: 200 distinct products, deduplicated by canonical key.
- Completeness: 100% population of required identity and commercial fields; clinical sections populated where present, else marked “unknown.”
- Traceability: Every record contains source_page (relative reference), extraction_timestamp, and extract_version.
- Language fidelity: Arabic preserved; English captured only when explicit.
- Price in EGP: Numeric format without currency symbols.

## Timeline and Milestones

The pipeline is designed for a 1–2 day delivery window under normal site responsiveness. Milestones align with operational throughput and QA gates.

Table 6. Timeline by milestone
| Milestone                                 | Duration estimate | Dependencies                     | Target completion       |
|-------------------------------------------|-------------------|----------------------------------|-------------------------|
| Product list acquisition (601–800)        | 4–6 hours         | Catalog pagination               | Day 1                   |
| Detail URL resolution and queueing        | 3–4 hours         | Product list                     | Day 1                   |
| Extraction (200 products)                 | 6–8 hours         | Queue ready                      | End of Day 1            |
| Normalization and mapping                 | 4–6 hours         | Extraction complete              | Morning, Day 2          |
| Validation, dedupe, exceptions            | 3–4 hours         | Normalization complete           | Midday, Day 2           |
| Final QA and delivery                     | 2–3 hours         | Validation complete              | End of Day 2            |

![Milestone checkpoint visualization](browser/screenshots/chefaa_final_analysis.png)

## Appendices

### Appendix A: Controlled vocabularies for dosage_form and route

- Dosage_form: tablet, capsule, effervescent tablet, syrup, suspension, drops, spray, gel, cream, ointment, injection, lozenge, vaginal suppository, eye solution, eye gel, ear drops, nasal spray.
- Route: oral, intranasal, ophthalmic, otic, topical, rectal, injection (IM/IV/SC as available), vaginal.

When the route is not explicitly stated, infer based on dosage_form (e.g., “nasal spray” → “intranasal”). Explicit route statements supersede inferences.

### Appendix B: Field synonym dictionary (selection patterns)

- product_name: “name,” “title,” “product headline”
- brand_name: “brand,” “manufacturer,” “by”
- strength: “strength,” “dose,” “mg,” “mcg,” “%”
- concentration: “%,” “mcg/dose,” “per spray”
- pack_size: “pack,” “package,” “box of,” “strip,” “sachet,” “vial”
- volume: “ml,” “mL,” “cc”
- dosage_form: “tablet,” “capsule,” “syrup,” “drops,” “spray,” “gel,” “cream,” “ointment,” “injection”
- availability_status: “in stock,” “limited,” “out of stock”
- prescription_required: “prescription,” “OTC,” “rx”

### Appendix C: Unit and strength normalization rules

- Milligrams (mg), micrograms (mcg), and grams (g) are retained as labeled; prefer base units for consistency when mathematically stable.
- Percent concentrations: preserve as “%” and capture whether w/w or w/v is specified; if not specified, record as “% (unspecified)”.
- Ratios such as “4 mg/5 mL” are preserved in the strength field and decomposed into active_ingredients where applicable.
- Combination products: represent each active ingredient with its strength in an array; ensure strength field is used for single-entity products only.

### Appendix D: Example JSON objects (sanitized)

Example 1 (tablet, single ingredient)
```
{
  "product_id": "chefaa-001-601",
  "product_name": "بروفين 400 ملجم",
  "product_name_english": "Brufen 400 mg",
  "brand_name": "Brufen",
  "active_ingredients": [{"name": "Ibuprofen", "strength": "400 mg"}],
  "dosage_form": "tablet",
  "route": "oral",
  "indications": ["Pain relief", "Fever reduction"],
  "contraindications": ["Not specified"],
  "warnings": ["Not specified"],
  "adverse_reactions": ["Not specified"],
  "drug_interactions": ["Not specified"],
  "storage_requirements": "Not specified",
  "clinical_pharmacology": "Not specified",
  "pack_size": "30 tablets",
  "price_egp": 78.0,
  "availability_status": "In Stock",
  "prescription_required": false,
  "category": "Pain Relief",
  "therapeutic_class": "Analgesic",
  "language_notes": "Arabic-only content",
  "source_page": "medications/pain-relief/proden-brufen-400",
  "extraction_timestamp": "2025-11-01T12:00:00Z",
  "extract_version": "b4.0.1"
}
```

Example 2 (nasal spray)
```
{
  "product_id": "chefaa-001-615",
  "product_name": "نازونيكس 0.05% بخاخ للأنف",
  "product_name_english": "Nasonex 0.05% Nasal Spray",
  "brand_name": "Nasonex",
  "active_ingredients": [{"name": "Mometasone furoate monohydrate", "strength": "0.05%"}],
  "dosage_form": "spray",
  "route": "intranasal",
  "indications": ["Allergic rhinitis"],
  "contraindications": ["Not specified"],
  "warnings": ["Not specified"],
  "adverse_reactions": ["Not specified"],
  "drug_interactions": ["Not specified"],
  "storage_requirements": "Not specified",
  "clinical_pharmacology": "Not specified",
  "pack_size": "120 doses",
  "price_egp": 157.0,
  "availability_status": "Available",
  "prescription_required": false,
  "category": "Nasal Steroid",
  "therapeutic_class": "Corticosteroid (intranasal)",
  "language_notes": "Arabic and English labels present",
  "source_page": "medications/allergy/nasonex-005",
  "extraction_timestamp": "2025-11-01T12:10:00Z",
  "extract_version": "b4.0.1"
}
```

### Appendix E: Extraction variables

- batch_id: medications_batch_4
- output_path: data/overviews/medications_batch_4/medications_overview_batch_4.json
- source_base_reference: relative path references resolved via listing tiles (no absolute URLs in data fields)

![Visual reference for product page layout](docs/chefaa_homepage/chefaa_product_page.png)

## Information Gaps and Resolution Plan

- The full list of products 601–800 is not included in the current context; it must be obtained via Option A (catalog pagination) or Option B (structured feed).
- Product detail pages may not include full clinical sections; capture what is present and set “unknown” for missing fields.
- Mixed-language content and inconsistent naming conventions require normalization rules; preserve explicit English, avoid translations.
- Unit and strength formats vary (mg, %, mcg/dose); enforce canonical units and record exceptions.
- Product detail URLs are not explicitly provided; they will be resolved via listing traversal and, if necessary, interactive navigation.
- The final output path must be confirmed prior to execution to avoid overwriting prior batches; the target directory is specified in this plan.

## Conclusion

This plan translates the available listing-level metadata into a robust, end-to-end pipeline for comprehensive pharmaceutical overview extraction in Batch 4. It balances rigor with pragmatism: standardized schemas, controlled vocabularies, bilingual handling, traceability, and a staged QA framework that explicitly accounts for incomplete or dynamic content. If the list of products 601–800 is provided or extracted via the defined pagination approach, the team can execute delivery within 1–2 days, producing a reliable, audit-ready dataset aligned with the needs of medical writers, pharmacists, data engineers, and regulatory reviewers.

## References

[^1]: Chefaa Online Pharmacy. https://chefaa.com
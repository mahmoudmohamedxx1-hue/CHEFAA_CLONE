# Medications Batch 4 (Products 601–800) Comprehensive Extraction and Analysis Blueprint

## Executive Overview

This analytical execution and validation blueprint sets out the approach, schema, and quality controls to deliver comprehensive pharmaceutical overviews for products 601–800 from the Chefaa catalog. The primary objective is to transform partial listing data into complete, standardized product dossiers that align with clinical documentation standards and support medical writing, pharmacy operations, data engineering, and regulatory review.

Within the current context, the exact list for products 601–800 is not provided. This plan therefore includes two parallel tracks: (1) a precise acquisition method to derive the definitive product list using catalog pagination, and (2) the end-to-end extraction, normalization, validation, and delivery specifications. Chefaa serves as the authoritative source for product detail pages and category listings[^1].

![Chefaa product page context for pharmaceutical overview extraction](docs/chefaa_homepage/chefaa_product_page.png)

To ground expectations and align stakeholders, Table 1 summarizes the expected deliverables and core key performance indicators (KPIs).

Table 1. Deliverables and KPIs summary
| Deliverable / KPI                         | Target / Standard                                                                 |
|-------------------------------------------|------------------------------------------------------------------------------------|
| Product coverage                          | Exactly 200 distinct products (601–800)                                           |
| Completeness                              | 100% for identity/commercial fields; clinical sections captured where present     |
| Traceability                              | 100% of records with source_page reference and extraction_timestamp               |
| Language fidelity                         | Arabic preserved; explicit English captured; no inferred translations             |
| Pricing                                   | Numeric EGP values                                                                 |
| Success metrics                           | ≥95% page fetch success; ≥90% field completeness where page content is available  |
| Output                                    | Structured JSON at the designated batch directory                                  |
| Acceptance                                | Pass/fail per defined criteria; discrepancy logs maintained                        |

## Objectives and Scope

Batch 4 targets a clearly delineated set of 200 products (positions 601–800) from the Chefaa medications catalog. For each product, the aim is to assemble a comprehensive overview encompassing identity, composition, dosage form and route, therapeutic indications, contraindications, warnings, adverse reactions, interactions, storage requirements, and clinical pharmacology. The scope explicitly includes bilingual content (Arabic with English translations where available), pricing in Egyptian Pounds (EGP), and pack-size/strength normalization.

Constraints are material and shape the methodology:
- Mixed-language content requires careful normalization and preservation.
- Listing pages often lack deep clinical sections; individual product pages must be the primary source.
- Dynamic content and pagination can introduce fetch failures and structural variability.
- Controlled vocabularies for dosage forms and routes must be consistently applied.

![Overview of medications listing structure on Chefaa](docs/chefaa_homepage/chefaa_medications_listing.png)

Success will be measured by completeness, correctness, traceability, and language fidelity across all records, with exceptions logged and resolved wherever feasible.

## Source Inventory and Constraints

Three input files inform the pipeline design and field mapping:
- data/medications/medications_products.json (148 products)
- data/medications/comprehensive_medications_products.json (287 products)
- data/medications/final_comprehensive_extraction_results.json (project-scale summary metadata)

The listing-level fields typically include product name, brand, price in EGP, availability status, prescription requirement, dosage information (often shorthand for strength/pack), and category classification. Critical gap: product detail URLs are not explicitly present in these files and must be resolved via navigation from category/listing views.

Table 2. Input file inventory
| File path                                             | Product count | Typical fields                                                                 | Relevance for Batch 4                                           |
|-------------------------------------------------------|---------------|--------------------------------------------------------------------------------|------------------------------------------------------------------|
| data/medications/medications_products.json            | 148           | product_name, brand, price_egp, availability, dosage_information, category     | Baseline schema and mapping experiments                          |
| data/medications/comprehensive_medications_products.json | 287           | As above; expanded coverage across subcategories                               | Broader structure and pagination handling                        |
| data/medications/final_comprehensive_extraction_results.json | Metadata only | Project-level completion statistics                                            | Confirms larger catalog; not a direct source of product entries  |

## Target Product List Acquisition (601–800)

Because the current context does not include the explicit list of products 601–800, acquisition must be completed prior to extraction. Two pathways are defined:

- Option A (Recommended): Run a pagination-based enumeration across the main medications listing to collect product entries corresponding to positions 601–800. Generate a positional index that maps global catalog positions to product identifiers and detail references.
- Option B: Ingest a structured feed (JSON/CSV) of product identifiers and names for positions 601–800, optionally including product URLs.

Table 3. Product list acquisition plan
| Option | Method                                         | Output artifacts                                 | Acceptance criteria                                           |
|--------|------------------------------------------------|--------------------------------------------------|---------------------------------------------------------------|
| A      | Catalog pagination and enumeration             | Positional index, product IDs, detail references | Exactly 200 unique products; traceable source pages           |
| B      | Structured ingestion of provided list          | Canonical product list with optional URLs        | 200 unique entries matching positions 601–800; validated IDs  |

![Catalog pagination interface used to identify products 601–800](docs/chefaa_homepage/chefaa_medications_listing.png)

### Traceability and Indexing

Each entry in the positional index must capture:
- Position (1-based)
- product_name
- brand_name (nullable)
- product_detail_ref (relative path)
- subcategory
- source_page (relative path reference)
- extraction_timestamp

The index ensures auditability, supports deduplication, and enables precise re-extraction.

## Product Page Discovery and URL Resolution

Product detail references are not provided in listing-level files and must be inferred by traversing item cards in category/listing pages. This process enumerates clickable tiles, resolves stable detail references, and queues them for extraction. If a reference cannot be determined, the item is flagged and escalated for interactive navigation.

![Product page layout illustrating detail fields](docs/chefaa_homepage/chefaa_product_page.png)

Table 4. URL resolution patterns and fallback strategies
| Scenario                                   | Strategy                                                                 | Outcome                                                  |
|--------------------------------------------|--------------------------------------------------------------------------|----------------------------------------------------------|
| Standard item card with link               | Parse relative detail reference                                          | Reference captured; queued for extraction                |
| Dynamic content load                       | Wait for key selectors; retry with bounded timeouts                      | Reference captured or flagged for interactive navigation |
| Missing or ambiguous link                  | Mark as link_unavailable; escalate to interactive navigation             | Resolved reference or logged exception                   |
| Repeated fetch failures (404/ERR_ABORTED)  | Retry with exponential backoff; session persistence                      | Success or exception with remediation notes              |

### Failure Handling and Retries

- Retry logic targets HTTP errors, dynamic load timeouts, and aborted requests.
- Persistent failures are logged with error type and timestamp; interactive navigation is invoked for resolution.
- A bounded exponential backoff prevents server overload and maintains batch throughput[^1].

## Extraction Methodology and Field Mapping

Extraction begins at the product detail page. Text and structured elements are captured, parsed, and mapped into a normalized pharmaceutical schema. Price is recorded in EGP. Mixed-language content is preserved; English is captured only when explicitly present. Units and strengths are normalized to canonical forms.

![Target sections on a Chefaa product detail page](docs/chefaa_homepage/chefaa_product_page.png)

Table 5. Field mapping matrix
| Source location (product page) | Extraction method              | Output schema field              | Normalization rules                                                                |
|--------------------------------|--------------------------------|----------------------------------|------------------------------------------------------------------------------------|
| Product title                  | Text parse                      | product_name                     | Preserve Arabic; populate product_name_english if explicit                         |
| Brand label                    | Text parse                      | brand_name                       | Trim qualifiers; null if missing                                                   |
| Strength/concentration         | Text parse                      | strength, concentration          | Normalize to mg, %, mg/mL; ranges preserved as stated                               |
| Pack size                      | Text parse                      | pack_size                        | Tokenize counts/units; “30 × 0.4 mL” preserved                                     |
| Volume/vial count              | Labeled quantities              | volume                           | mL units; unify decimals                                                            |
| Dosage form                    | Form label                      | dosage_form                      | Controlled vocabulary                                                               |
| Administration route           | Explicit or inferred            | route                            | Controlled vocabulary; inference rules applied                                      |
| Price                          | Price block                     | price_egp                        | Numeric; no currency symbol                                                         |
| Availability                   | Stock status                    | availability_status              | Controlled terms                                                                    |
| Prescription requirement       | Label near title/price          | prescription_required            | Boolean; “not specified” when ambiguous                                             |
| Category                       | Listing/product label           | category                         | Retained; map to canonical therapeutic_class where feasible                         |
| Clinical sections              | Labeled text blocks             | indications, contraindications, warnings, adverse_reactions, interactions, storage_requirements, clinical_pharmacology | Captured as arrays; deduplicated; normalized sentence case |

### Normalization Rules for Dosage Forms and Routes

Apply controlled vocabularies consistently:
- dosage_form: tablet, capsule, syrup, suspension, drops, spray, gel, cream, ointment, injection, lozenge, effervescent tablet.
- route: oral, intranasal, ophthalmic, otic, topical, rectal, injection.

When the route is not explicitly labeled, infer from dosage_form (e.g., nasal spray → intranasal). Explicit route statements supersede inferences.

## Data Model and Output Specification

The output is a single JSON object saved at the designated batch directory. The schema ensures clinical-friendly normalization while preserving traceable metadata. Prices are in EGP. Controlled vocabularies are used for dosage_form and route. Clinical sections are stored as arrays with normalized sentence case.

Table 6. Output schema definition
| Field name                   | Type          | Required | Controlled vocabulary / format                 | Notes                                                                      |
|------------------------------|---------------|----------|-----------------------------------------------|----------------------------------------------------------------------------|
| product_id                   | string        | Yes      | N/A                                           | Unique identifier within batch                                             |
| product_name                 | string        | Yes      | N/A                                           | Full title as displayed (Arabic preserved)                                 |
| product_name_english         | string/null   | No       | N/A                                           | Only if explicitly shown                                                   |
| brand_name                   | string/null   | No       | N/A                                           | Nullable                                                                    |
| active_ingredients           | array/null    | No       | INN/generic names                             | [{name: string, strength?: string}]                                        |
| strength                     | string/null   | No       | e.g., “500 mg”, “0.1%”, “4 mg/5 mL”           | For single-entity products                                                 |
| concentration                | string/null   | No       | e.g., “0.3%”, “50 mcg/dose”                   | Percentage or per-dose                                                     |
| dosage_form                  | string        | Yes      | Controlled vocabulary                         | Harmonized forms                                                           |
| route                        | string        | No       | Controlled vocabulary                         | Harmonized routes                                                          |
| indications                  | array/null    | No       | Free text                                     | Normalized and deduplicated                                                |
| contraindications            | array/null    | No       | Free text                                     | Normalized and deduplicated                                                |
| warnings                     | array/null    | No       | Free text                                     | Normalized and deduplicated                                                |
| adverse_reactions            | array/null    | No       | Free text                                     | Normalized and deduplicated                                                |
| drug_interactions            | array/null    | No       | Free text                                     | Normalized and deduplicated                                                |
| storage_requirements         | string/null   | No       | Free text                                     | Preserve explicit labels                                                   |
| clinical_pharmacology        | string/null   | No       | Free text                                     | Mechanism of action; PK/PD if available                                    |
| pack_size                    | string/null   | No       | e.g., “20 tablets”, “30 × 0.4 mL”             | Do not conflate with price                                                 |
| volume                       | string/null   | No       | e.g., “150 mL”, “5 mL vial”                   | For liquids                                                                |
| price_egp                    | number        | Yes      | Numeric EGP                                   | No currency symbol                                                         |
| availability_status          | string        | Yes      | Controlled terms                              | In Stock, Limited Quantity, Out of Stock                                   |
| prescription_required        | boolean/null  | Yes      | true/false/null                               | Null only when truly ambiguous                                             |
| category                     | string        | No       | N/A                                           | Listing-level category                                                     |
| therapeutic_class            | string/null   | No       | N/A                                           | Canonicalized where feasible                                               |
| language_notes               | string/null   | No       | N/A                                           | e.g., “Arabic-only content”                                                |
| source_page                  | string        | Yes      | Relative path reference                       | For audit                                                                  |
| extraction_timestamp         | string        | Yes      | ISO 8601                                      | UTC                                                                        |
| extract_version              | string        | Yes      | N/A                                           | Bump on any re-extraction                                                  |

### Therapeutic Classification Normalization

Listing categories (e.g., “Pain Relief,” “Antihistamine,” “Nasal Steroid”) will be mapped to canonical therapeutic classes, recognizing combination indications. The normalization process:
- Retains the listing label for transparency.
- Maps to a controlled taxonomy (e.g., analgesics, antihistamines, nasal corticosteroids, proton pump inhibitors).
- Documents mapping decisions in a classification log to enable reclassification as needed.

## Validation, QA, and Audit

Quality assurance is multi-layered and emphasizes completeness, correctness, and traceability:
- Completeness: All required fields must be present; “unknown” is used when a field is missing on the page and added to an exceptions log.
- Correctness: Units and strengths normalized; dosage_form/route conform to controlled vocabularies.
- Traceability: Each record includes source_page (relative path reference), extraction_timestamp, and extract_version.
- Deduplication: Canonical keys (product_name + brand_name + strength + pack_size + dosage_form).
- Bilingual fidelity: Arabic preserved; English captured only if explicit.

![QA checkpoint screenshot during batch processing](browser/screenshots/chefaa_current_state.png)

Table 7. Validation checklist
| Field group               | Validation rule                                                   | Severity | Remediation                                           |
|--------------------------|-------------------------------------------------------------------|----------|-------------------------------------------------------|
| Identity                 | product_name present; brand_name nullable                         | High     | Re-extract; mark unknown brand                        |
| Composition              | Numeric units normalized; combination arrays                      | High     | Re-parse; flag unknown                                |
| Dosage form/route        | Controlled vocabulary; route inferred when explicit               | High     | Manual mapping review                                 |
| Clinical sections        | Present if available; normalized sentence case                    | Medium   | Set unknown; exceptions log                           |
| Interactions/storage     | Labeled text captured; else unknown                               | Medium   | Add exceptions; revisit if updates                    |
| Pricing/availability     | Numeric price_egp; controlled stock terms                         | High     | Re-parse price block                                  |
| Prescription requirement | Boolean or controlled text                                        | High     | Re-extract; set not_specified if ambiguous            |
| Language fidelity        | No inferred translations; preserve explicit English               | Medium   | Correct schema                                        |
| Traceability             | source_page and extraction_timestamp present                      | High     | Regenerate audit trail                                |

### Exceptions and Resolution

All “unknown” or ambiguous fields are recorded with context (product ID, source page reference, timestamp). Secondary passes attempt interactive navigation or alternative selector patterns to recover missing data. Resolution status is tracked (open/pending/closed). Once remedied, records are updated with a new extract_version.

## Operational Workflow and Execution Steps

The operational pipeline is designed for predictability and auditability:
1) Acquire the definitive list (601–800) via pagination or structured feed.
2) Resolve product detail references; compile extraction queue.
3) Extract product page content per field mapping.
4) Normalize dosage_form/route, strengths/units, and price.
5) Validate completeness, deduplicate, and apply bilingual rules.
6) Update exceptions log; run targeted retries.
7) Save consolidated JSON to the designated directory.
8) Final QA and produce the completion report.

![Final analysis checkpoint in the extraction process](browser/screenshots/chefaa_final_analysis.png)

Table 8. Operational checklist
| Step | Description                                 | Input                       | Output                    | Owner        | Acceptance criteria                                      |
|------|---------------------------------------------|-----------------------------|---------------------------|--------------|----------------------------------------------------------|
| 1    | Acquire product list (601–800)              | Catalog listings            | Positional index          | Data engineer| 200 unique entries; source page recorded                 |
| 2    | Resolve detail references                   | Listing tiles               | product_detail_ref        | Data engineer| ≥95% reference resolution                                |
| 3    | Extract product pages                       | Product pages               | Raw parsed fields         | Data engineer| ≥95% success per item                                    |
| 4    | Normalize fields                            | Raw fields                  | Normalized schema fields  | Data engineer| 100% schema conformity                                   |
| 5    | Validate and deduplicate                    | Normalized records          | QA-ready records          | QA analyst   | 0 duplicate keys; checklist pass                         |
| 6    | Exceptions handling and retries             | Exceptions log              | Updated records           | Data engineer| ≥70% resolution where feasible                           |
| 7    | Save JSON and artifacts                     | QA-ready records            | Consolidated output JSON  | Data engineer| Valid JSON; fields present                               |
| 8    | Final QA and completion report              | Output JSON                 | QA report and audit files | QA analyst   | All checks pass; discrepancies documented                |

### Progress Tracking and Checkpoints

Progress is tracked per product through milestone gates (e.g., queue built, 25% extracted, 50% normalized, 75% validated, 100% complete). Each gate includes a mini-QA cycle comparing observed yields to targets and documenting systematic gaps (e.g., missing clinical sections within a subcategory). Exceptions are triaged by severity and resolution effort, with recurring issues escalated for interactive navigation or selector revision.

## Risk Management and Mitigation

- Dynamic loading and redirects: Employ bounded exponential backoff, retry with distinct selectors, persist session state, and limit concurrency. Persistent failures escalate to interactive navigation.
- Incomplete clinical data: Many retail pages emphasize usage and composition. Set “unknown” for missing sections and maintain an exceptions log; avoid inference beyond explicit content.
- Language ambiguity: Preserve Arabic and capture English only when explicit; do not translate.
- Data drift: Prices and availability may change. The extract_timestamp and extract_version fields enable auditable versioning across updates.

![Risk scenario: redirect/dynamic loading behavior observed](browser/screenshots/chefaa_after_scroll.png)

## Acceptance Criteria and Deliverables

Deliverables:
- Consolidated JSON output for products 601–800 at the designated batch directory.
- Audit artifacts: positional index, validation checklists, exceptions log with resolutions, completion report.

Acceptance criteria:
- Count and uniqueness: 200 distinct products; deduplicated by canonical key.
- Completeness: 100% of required identity/commercial fields; clinical sections captured where present, otherwise “unknown.”
- Traceability: 100% records include source_page (relative reference), extraction_timestamp, extract_version.
- Language fidelity: Arabic preserved; English captured only when explicit.
- Pricing: Numeric EGP without currency symbols.

![Deliverable review checkpoint](browser/screenshots/chefaa_final_hair_care_view.png)

## Timeline and Milestones

A 1–2 day execution window is feasible under normal site responsiveness. Milestones align throughput with QA gates.

Table 9. Timeline and milestones
| Milestone                                 | Duration estimate | Dependencies               | Target completion      |
|-------------------------------------------|-------------------|----------------------------|------------------------|
| Product list acquisition (601–800)        | 4–6 hours         | Catalog pagination         | Day 1                  |
| Detail URL resolution and queueing        | 3–4 hours         | Product list               | Day 1                  |
| Extraction (200 products)                 | 6–8 hours         | Queue ready                | End of Day 1           |
| Normalization and mapping                 | 4–6 hours         | Extraction complete        | Morning, Day 2         |
| Validation, dedupe, exceptions            | 3–4 hours         | Normalization complete     | Midday, Day 2          |
| Final QA and delivery                     | 2–3 hours         | Validation complete        | End of Day 2           |

![Milestone visualization during batch processing](browser/screenshots/chefaa_after_scroll.png)

## Appendices

### Appendix A: Controlled vocabularies

- Dosage_form: tablet, capsule, effervescent tablet, syrup, suspension, drops, spray, gel, cream, ointment, injection, lozenge, vaginal suppository, eye solution, eye gel, ear drops, nasal spray.
- Route: oral, intranasal, ophthalmic, otic, topical, rectal, injection (IM/IV/SC as available), vaginal.

Explicit routes supersede inferences; inferences used only when the route is not stated.

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

- Milligrams (mg), micrograms (mcg), and grams (g) are retained as labeled; base units preferred when stable.
- Percent concentrations preserved as “%”; note w/w or w/v when specified; if not specified, record as “% (unspecified).”
- Ratios such as “4 mg/5 mL” preserved in the strength field; decomposed into active_ingredients for combinations.
- Combination products represented as arrays with per-component strengths.

### Appendix D: Example JSON (sanitized)

Example (tablet, single ingredient):
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

### Appendix E: Extraction variables

- batch_id: medications_batch_4
- output_path: data/overviews/medications_batch_4/medications_overview_batch_4.json
- source_base_reference: relative path references resolved via listing tiles (no absolute URLs in data fields)

![Example of product detail page layout used in extraction](docs/chefaa_homepage/chefaa_product_page.png)

## Information Gaps

- The exact list for products 601–800 is not provided in the current context; the acquisition plan must be executed to obtain the definitive set.
- Product detail pages may not include full clinical sections (e.g., contraindications, interactions, pharmacology); these may be missing or partial on retail pages.
- Mixed-language content and inconsistent naming conventions necessitate robust normalization rules.
- Unit and strength formats vary; normalization requires careful parsing (mg, %, mcg/dose).
- Product detail URLs are not explicitly provided; they must be inferred via listing navigation.
- Final output path confirmation is required prior to execution to avoid conflicts with prior batches.

## Conclusion

This blueprint provides a pragmatic and rigorous approach to deliver comprehensive pharmaceutical overviews for products 601–800 from Chefaa. It integrates a clear acquisition plan, a robust extraction and normalization methodology, controlled vocabularies, bilingual handling, and a thorough QA framework. With the positional index and product detail references resolved, the pipeline can achieve high completeness, correctness, and traceability within a 1–2 day window, producing a reliable dataset suitable for clinical documentation and regulatory review.

## References

[^1]: Chefaa Online Pharmacy. https://chefaa.com
# Medications Batch 4 (Products 601–800) — Real Web Extraction, Enrichment, and QA Blueprint

## Executive Summary

This blueprint sets out a definitive, audit-ready plan to deliver comprehensive pharmaceutical overviews for Chefaa products 601–800. The design addresses the full lifecycle from target list acquisition through product detail page discovery, field normalization, validation, and delivery. It also documents a pragmatic fallback for time-limited runs in which page access is constrained, ensuring immediate value while preserving traceability and the ability to scale.

Within the present context, the precise list of products 601–800 is not yet available. The plan therefore embeds a catalog pagination and enumeration method to derive the definitive targets, coupled with robust mechanisms to resolve product detail references, normalize clinical fields, and enforce a rigorous quality regime. Deliverables are anchored to the designated batch directory for Batch 4, with structured outputs ready for medical writing, pharmacy operations, data engineering, and regulatory review.

Chefaa is the authoritative source for product pages and category listings[^1].

![Chefaa category context anchoring the extraction scope](docs/chefaa_homepage/chefaa_medications_category.png)

Table 1. Deliverables and KPIs
| Area                   | Definition                                                                                  |
|------------------------|----------------------------------------------------------------------------------------------|
| Product coverage       | Exactly 200 distinct products (positions 601–800)                                           |
| Completeness targets   | Identity/commercial fields: 100%; Clinical sections: captured where available; else “unknown” |
| Traceability           | 100% records with source_page (relative path) and extraction_timestamp                      |
| Validation outcomes    | ≥95% page fetch success; ≥90% field completeness where page content is available            |
| Bilingual fidelity     | Arabic preserved; English captured only when explicit                                       |
| Pricing                | Numeric EGP; no currency symbols                                                             |
| Output                 | data/overviews/medications_batch_4/medications_overview_batch_4.json                         |

## Objectives and Scope

The objective is to produce comprehensive medication overviews for products 601–800 that align to clinical documentation standards. Required fields include identity, composition, dosage form and route, therapeutic indications, contraindications, warnings, adverse reactions, drug interactions, storage requirements, and clinical pharmacology. Secondary considerations such as pregnancy/lactation, pediatric/geriatric usage, and regulatory notes will be captured when available on product pages.

Constraints and implications:
- Mixed-language content: Arabic with occasional English requires preservation and controlled mapping.
- Product pages are the primary source of clinical detail; listings alone are insufficient.
- Dynamic content and variable page structures mandate resilient traversal, retry strategies, and session management.
- Controlled vocabularies for dosage_form and route are required to ensure inter-product consistency.

Success will be measured by completeness (identity/commercial 100%; clinical sections where available), correctness (normalized units and canonical categories), traceability (source pages and timestamps), and language fidelity.

![Listing-to-detail flow, highlighting scope boundaries](docs/chefaa_homepage/chefaa_medications_listing.png)

## Source Inventory and Data Gaps

Current inputs provide listing-level metadata rather than the 601–800 target list or direct product URLs:
- data/medications/medications_products.json (148 products)
- data/medications/comprehensive_medications_products.json (287 products)
- data/medications/final_comprehensive_extraction_results.json (summary metadata)

Typical fields include product_name, brand_name, price_egp, availability_status, prescription_required, dosage_information, and category. The critical gap is the absence of a definitive 601–800 index and direct product detail URLs.

Table 2. Input file inventory
| Path                                                | Count | Key fields                                           | Relevance                                                  |
|-----------------------------------------------------|-------|------------------------------------------------------|------------------------------------------------------------|
| data/medications/medications_products.json          | 148   | product_name, brand, price_egp, dosage_information, category | Baseline schema; partial coverage for mapping experiments |
| data/medications/comprehensive_medications_products.json | 287   | As above with expanded subcategory coverage          | Broader structure for normalization across categories      |
| data/medications/final_comprehensive_extraction_results.json | Metadata | Project-scale summary                             | Confirms larger catalog scope; not a direct product feed   |

![Homepage reference for site structure understanding](docs/chefaa_homepage/chefaa_homepage_final.png)

## Target Product List Acquisition (Products 601–800)

The definitive list of products 601–800 must be acquired before extraction. Two pathways are defined:

- Option A (Recommended): Enumerate products 601–800 by traversing the medications catalog with pagination controls and building a positional index that maps global catalog positions to product IDs and detail references.
- Option B: Ingest a provided list (JSON/CSV) of product identifiers for positions 601–800; optionally include product URLs for direct detail scraping.

Table 3. Acquisition methods and outputs
| Option | Method                                 | Output                                               | Acceptance criteria                                  |
|--------|----------------------------------------|------------------------------------------------------|------------------------------------------------------|
| A      | Catalog pagination enumeration         | Positional index with product IDs and detail refs    | 200 unique entries; traceable source pages           |
| B      | Structured ingestion (JSON/CSV)        | Canonical product list with optional URLs            | 200 unique entries matching positions 601–800        |

![Catalog view used to derive positional range](docs/chefaa_homepage/chefaa_medications_listing.png)

### Indexing and Audit Trail

The positional index includes position (1-based), product_name, brand_name (nullable), product_detail_ref (relative path), subcategory, source_page (relative path), and extraction_timestamp. This structure supports deduplication, re-extraction, and completeness checks across the batch.

## Product Detail Discovery and URL Resolution

Where direct product URLs are not available, detail references will be resolved by traversing item cards within category/listing pages. The pipeline enumerates clickable tiles, extracts stable relative references, and queues them for extraction. Items with ambiguous links will be flagged and escalated to interactive navigation if needed.

![Target detail page model used for field capture](docs/chefaa_homepage/chefaa_product_page.png)

Table 4. Discovery heuristics and fallback rules
| Scenario                               | Approach                                                                 | Outcome                                          |
|----------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------|
| Link visible in item card              | Parse relative detail reference                                          | Reference captured; queued                       |
| Dynamic content or delayed load        | Wait for key selectors; apply retry with bounded timeouts                | Reference captured or escalated                  |
| Ambiguous or missing link              | Mark link_unavailable; interactive navigation                            | Resolved reference or logged as exception        |
| Persistent fetch failures (404/timeout)| Retry with exponential backoff; maintain session                         | Success or exception with remediation notes      |

### Session and Retry Strategy

Maintain session state, limit concurrency, and apply bounded exponential backoff to minimize triggers for anti-bot protections and dynamic loading failures. Persistent failures are logged and escalated to interactive navigation for manual resolution[^1].

## Comprehensive Field Extraction (Real Web Pages)

Field extraction is anchored to product detail pages. Arabic content is preserved; English labels are captured when explicitly present. Strengths and units are normalized; dosage_form and route adhere to controlled vocabularies. Clinical sections (indications, contraindications, warnings, adverse reactions, interactions, storage, pharmacology) are captured as arrays when present; otherwise, they are marked “unknown.”

![Chefaa product page showing sections targeted for extraction](docs/chefaa_homepage/chefaa_product_page.png)

Table 5. Field mapping matrix
| Source element (product page) | Extraction method           | Output field                       | Normalization rules                                                                 |
|-------------------------------|-----------------------------|------------------------------------|-------------------------------------------------------------------------------------|
| Title                         | Text parse                   | product_name                       | Preserve Arabic; set product_name_english if explicit                               |
| Brand label                   | Text parse                   | brand_name                         | Nullable; trim qualifiers                                                           |
| Strength/concentration        | Text parse                   | strength, concentration            | Numeric units (mg, %, mg/mL); preserve ranges                                       |
| Pack size                     | Text parse                   | pack_size                          | Tokenize counts/units (e.g., “30 × 0.4 mL”)                                         |
| Volume/vial count             | Labeled quantities           | volume                             | Retain mL units; unify decimals                                                     |
| Dosage form                   | Form label                   | dosage_form                        | Controlled vocabulary (tablet, capsule, syrup, drops, spray, gel, cream, ointment, injection, lozenge, effervescent tablet) |
| Administration route          | Explicit or inferred         | route                              | Controlled vocabulary (oral, intranasal, ophthalmic, otic, topical, rectal, injection) |
| Price                         | Price block                  | price_egp                          | Numeric; no currency symbol                                                         |
| Availability                  | Stock status                 | availability_status                | Controlled terms (In Stock, Limited Quantity, Out of Stock)                         |
| Prescription requirement      | Label near title/price       | prescription_required              | Boolean or controlled text; “not specified” if ambiguous                            |
| Clinical sections             | Labeled text blocks          | indications, contraindications, warnings, adverse_reactions, interactions, storage_requirements, clinical_pharmacology | Capture as arrays; deduplicate; normalize sentence case |

### Normalization Rules for Forms and Routes

- dosage_form: tablet, capsule, effervescent tablet, syrup, suspension, drops, spray, gel, cream, ointment, injection, lozenge.
- route: oral, intranasal, ophthalmic, otic, topical, rectal, injection.

Inference is applied when the route is not explicit (e.g., nasal spray → intranasal). Explicit route statements supersede inferences.

## Data Model and Output Specification

The output is a single JSON object at the designated batch directory. The schema balances clinical normalization with traceability. Prices are in EGP. Bilingual content is preserved; English is captured only if explicitly available.

Table 6. Output schema
| Field name                 | Type          | Required | Controlled vocabulary/format                 | Notes                                                                                         |
|---------------------------|---------------|----------|----------------------------------------------|-----------------------------------------------------------------------------------------------|
| product_id                | string        | Yes      | N/A                                          | Unique identifier within batch                                                                |
| product_name              | string        | Yes      | N/A                                          | Full title as displayed (Arabic preserved)                                                    |
| product_name_english      | string/null   | No       | N/A                                          | Only if explicitly shown on page                                                              |
| brand_name                | string/null   | No       | N/A                                          | Nullable                                                                                      |
| active_ingredients        | array/null    | No       | INN/generic names                            | [{name: string, strength?: string}]                                                           |
| strength                  | string/null   | No       | e.g., “500 mg”, “0.1%”, “4 mg/5 mL”          | For single-entity products                                                                    |
| concentration             | string/null   | No       | e.g., “0.3%”, “50 mcg/dose”                  | Percentage or per-dose                                                                        |
| dosage_form               | string        | Yes      | Controlled vocabulary                         | Harmonized forms                                                                              |
| route                     | string        | No       | Controlled vocabulary                         | Harmonized routes                                                                             |
| indications               | array/null    | No       | Free text                                    | Normalized and deduplicated                                                                   |
| contraindications         | array/null    | No       | Free text                                    | Normalized and deduplicated                                                                   |
| warnings                  | array/null    | No       | Free text                                    | Normalized and deduplicated                                                                   |
| adverse_reactions         | array/null    | No       | Free text                                    | Normalized and deduplicated                                                                   |
| drug_interactions         | array/null    | No       | Free text                                    | Normalized and deduplicated                                                                   |
| storage_requirements      | string/null   | No       | Free text                                    | Preserve explicit labels                                                                      |
| clinical_pharmacology     | string/null   | No       | Free text                                    | Mechanism of action; PK/PD if available                                                       |
| pack_size                 | string/null   | No       | e.g., “20 tablets”, “30 × 0.4 mL”            | Do not conflate with price                                                                    |
| volume                    | string/null   | No       | e.g., “150 mL”, “5 mL vial”                  | For liquids                                                                                   |
| price_egp                 | number        | Yes      | Numeric EGP                                  | No currency symbol                                                                            |
| availability_status       | string        | Yes      | Controlled terms                              | In Stock, Limited Quantity, Out of Stock                                                      |
| prescription_required     | boolean/null  | Yes      | true/false/null                              | Null only when truly ambiguous                                                                |
| category                  | string        | No       | N/A                                          | Listing-level category                                                                        |
| therapeutic_class         | string/null   | No       | N/A                                          | Canonicalized where feasible                                                                  |
| language_notes            | string/null   | No       | N/A                                          | e.g., “Arabic-only content”                                                                   |
| source_page               | string        | Yes      | Relative path reference                       | For audit and re-extraction                                                                   |
| extraction_timestamp      | string        | Yes      | ISO 8601                                      | UTC                                                                                           |
| extract_version           | string        | Yes      | N/A                                          | Bump on any re-extraction                                                                     |

### Therapeutic Classification Normalization

Listing categories (e.g., “Pain Relief,” “Antihistamine,” “Nasal Steroid”) are mapped to canonical therapeutic classes (e.g., analgesics, antihistamines, nasal corticosteroids) while acknowledging combination products. Mapping decisions are recorded in a classification log to support future reclassification and transparency.

## Validation, QA, and Audit

Quality assurance is multi-layered and document-driven:
- Completeness: Required fields must be present; missing clinical data captured as “unknown” and logged.
- Correctness: Units and strengths normalized; dosage_form/route mapped to controlled vocabularies.
- Traceability: Each record includes source_page (relative path reference), extraction_timestamp, and extract_version.
- Deduplication: Canonical key (product_name + brand_name + strength + pack_size + dosage_form).
- Bilingual fidelity: Arabic preserved; explicit English only.

![QA checkpoint visualization during extraction](browser/screenshots/chefaa_current_view.png)

Table 7. Validation checklist by field group
| Field group               | Validation rule                                           | Severity | Remediation                                      |
|--------------------------|-----------------------------------------------------------|----------|--------------------------------------------------|
| Identity                 | product_name present; brand_name nullable                 | High     | Re-extract; mark unknown brand                   |
| Composition              | Numeric units normalized; combinations arrays             | High     | Re-parse; flag unknown                           |
| Dosage form/route        | Controlled vocabulary; inference rules                    | High     | Manual mapping review                            |
| Clinical sections        | Present if available; normalized                          | Medium   | Set unknown; exceptions log                      |
| Interactions/storage     | Captured if available; else unknown                       | Medium   | Add exceptions; revisit upon updates             |
| Pricing/availability     | Numeric price_egp; controlled stock terms                 | High     | Re-parse price block                             |
| Prescription requirement | Boolean or controlled text                                | High     | Re-extract; “not specified” if ambiguous         |
| Language fidelity        | No inferred translations; preserve explicit English only   | Medium   | Correct schema                                   |
| Traceability             | source_page and extraction_timestamp present              | High     | Regenerate audit trail                           |

### Exceptions and Resolution

All “unknown” or ambiguous fields are documented with context (product ID, source page reference, timestamp). Secondary passes apply interactive navigation or alternate selectors to recover data. Resolution status is tracked (open/pending/closed). Upon remediation, records are updated and extract_version is incremented.

## Operational Workflow and Execution Steps

A linear, auditable pipeline underpins Batch 4:
1) Acquire the definitive list (601–800) via catalog pagination (Option A) or structured ingestion (Option B).
2) Resolve product detail references and compile an extraction queue.
3) Extract product page content per field mapping.
4) Normalize dosage_form/route, strengths/units, and price.
5) Validate completeness, deduplicate, and ensure bilingual fidelity.
6) Update exceptions log; run targeted retries.
7) Save consolidated JSON to the designated batch directory.
8) Final QA and produce the completion report.

![Operational checkpoint visualization](browser/screenshots/chefaa_current_state.png)

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

Progress is tracked per product with milestone gates (e.g., queue built, 25% extracted, 50% normalized, 75% validated, 100% complete). Mini-QA cycles are run at each gate, comparing observed yields to targets and documenting systematic gaps. Exceptions are triaged by severity and resolution effort; recurring issues escalate for interactive navigation or selector revisions.

## Risk Management and Mitigation

- Dynamic loading and redirects: Employ bounded exponential backoff, distinct selectors, session persistence, and controlled concurrency. Persistent failures escalate to interactive navigation.
- Incomplete clinical data: Many retail pages emphasize usage and composition. Capture what is present; mark missing sections “unknown”; avoid inference beyond explicit content.
- Language ambiguity: Preserve Arabic; avoid translation unless explicit. Note language status in language_notes.
- Data drift: Prices, stock status, and pack sizes may change. Use extract_timestamp and extract_version for auditable versioning.

![Dynamic loading risk scenario visualization](browser/screenshots/chefaa_after_scroll.png)

## Acceptance Criteria and Deliverables

Deliverables:
- Consolidated output: data/overviews/medications_batch_4/medications_overview_batch_4.json (200 distinct products).
- Audit artifacts: positional index, validation checklist outputs, exceptions log with resolutions, and completion report.

Acceptance criteria:
- Count and uniqueness: 200 distinct products; deduplicated by canonical key.
- Completeness: 100% for identity and commercial fields; clinical sections captured where present, otherwise “unknown.”
- Traceability: 100% records include source_page (relative reference), extraction_timestamp, and extract_version.
- Language fidelity: Arabic preserved; English captured only when explicit.
- Pricing: Numeric EGP without currency symbols.

![Deliverable review checkpoint visualization](browser/screenshots/chefaa_final_analysis.png)

## Timeline and Milestones

A 1–2 day window is feasible under normal site responsiveness, aligned to QA gates and throughput constraints.

Table 9. Timeline by milestone
| Milestone                                 | Duration estimate | Dependencies             | Target completion       |
|-------------------------------------------|-------------------|--------------------------|-------------------------|
| Product list acquisition (601–800)        | 4–6 hours         | Catalog pagination       | Day 1                   |
| Detail URL resolution and queueing        | 3–4 hours         | Product list             | Day 1                   |
| Extraction (200 products)                 | 6–8 hours         | Queue ready              | End of Day 1            |
| Normalization and mapping                 | 4–6 hours         | Extraction complete      | Morning, Day 2          |
| Validation, dedupe, exceptions            | 3–4 hours         | Normalization complete   | Midday, Day 2           |
| Final QA and delivery                     | 2–3 hours         | Validation complete      | End of Day 2            |

![Milestone checkpoint visualization](browser/screenshots/chefaa_current_view.png)

## Appendices (Operational Support)

Table 10. Controlled vocabularies and normalization references
| Vocabulary domain  | Values                                                                                                                          | Notes                                                       |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| dosage_form        | tablet, capsule, effervescent tablet, syrup, suspension, drops, spray, gel, cream, ointment, injection, lozenge                 | Harmonize across products                                   |
| route              | oral, intranasal, ophthalmic, otic, topical, rectal, injection                                                                  | Inference used only when not explicitly stated              |
| strength_units     | mg, mcg, g, %, mg/mL                                                                                                            | Preserve ranges; normalize base units                       |
| stock_status       | In Stock, Limited Quantity, Out of Stock                                                                                        | Controlled terms                                            |
| prescription       | true/false/null                                                                                                                 | Null reserved for truly ambiguous cases                     |
| availability       | Controlled terms consistent with site                                                                                           | Avoid free-form variants                                    |

### Fallback: Simulated Extraction When Pages Are Inaccessible

In constrained access environments, a fallback pipeline ensures immediate value while maintaining audit integrity:
- Use validated listing metadata to populate identity and commercial fields with high confidence.
- Mark clinical sections “unknown”; do not infer beyond explicit content.
- Preserve language fidelity (Arabic and explicit English only).
- Record source_page (relative path), extraction_timestamp, and extract_version; set extraction_method = “fallback_simulation.”
- Maintain an exceptions log for clinical sections and unresolved references.
- Upon access restoration, re-run full extraction to replace fallback records and update extract_version.

This approach keeps outputs usable, traceable, and replaceable without compromising quality standards.

## Information Gaps

- The definitive list for products 601–800 is not present in the current context and must be acquired via catalog pagination or provided as a structured feed.
- Product detail pages may omit full clinical sections; capture what is present and set “unknown” for missing fields.
- Mixed-language content and inconsistent naming necessitate controlled vocabularies and mapping.
- Unit and strength formats vary; normalization must handle mg, %, mcg/dose, and ratios.
- Product detail URLs are not explicitly available; discovery relies on listing traversal and, if needed, interactive navigation.
- Final output path confirmation is required to avoid conflicts with prior batches.

## Conclusion

This blueprint operationalizes a complete, defensible approach to deliver comprehensive pharmaceutical overviews for products 601–800, integrating catalog acquisition, product detail discovery, clinical field extraction, controlled normalization, rigorous QA, and audit-ready outputs. Where page access is limited, a pragmatic fallback is defined to preserve traceability and facilitate seamless upgrades upon restoration of full access. With Chefaa as the authoritative source and this plan in place, Batch 4 can be executed reliably and at scale[^1].

## References

[^1]: Chefaa Online Pharmacy. https://chefaa.com
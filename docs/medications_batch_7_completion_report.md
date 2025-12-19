# Medications Batch 7 (Products 1201–1400) Extraction Blueprint and Quality Assurance Plan

## Executive Summary

This blueprint defines the end-to-end plan to process 200 medication products (IDs 1201–1400), extract comprehensive pharmaceutical profiles from Chefaa product pages, and deliver a consolidated dataset under data/overviews/medications_batch_7/medications_overview_batch_7.json. The plan anticipates heterogeneity in page completeness and prescribes rigorous quality controls, structured fallbacks, and transparent logging to ensure that the dataset is both usable and defensible.

Scope and feasibility. The available Phase 5 files provide real product URLs for pages 77–134, with mixed page formats: some include product URLs (notably pages 116–126), while others (e.g., 90–94) list medications without product_url fields. Initial extraction tests on real product pages confirm a common pattern: product pages reliably provide price, pack size, availability, implied prescription status, and sometimes strength/form, but often omit detailed pharmaceutical content such as mechanism of action, dosing, contraindications, interactions, and storage conditions. This necessitates a data fusion approach that enriches listing-level data with standardized fields and carefully controlled textual inference, while preserving source provenance.

Output schema. The final dataset will adhere to a section-based schema encompassing six domains: basic information, therapeutic information, dosing/administration, safety information, special populations, and storage/handling. For each product, the record will include a source_url, extraction date, and a data_quality_score, along with any deviations (e.g., inferred content, 404 errors).

Key risks and mitigation. Four risks are material: (1) constructed URLs (e.g., slug patterns) that resolve to 404, (2) real product pages that lack detailed pharmaceutical content, (3) listing pages without product_url fields, and (4) gaps in special population guidance. The mitigation strategy relies on: (a) consolidating only verified product URLs from Phase 5 files, (b) applying controlled enrichment rules for missing dosage form/route/strength, (c) implementing a structured fallback hierarchy that preserves the distinction between observed and inferred data, and (d) flagging any non-evidence-based fields for clinical review.

Success criteria. Completion is defined as a consolidated JSON containing 200 products, each with required fields populated to at least a minimum viable level (see Data Completeness Targets) and an audit trail (source_url, extraction timestamp, data_quality_score, and deviation flags). To maintain clinical and scientific integrity, safety- and population-related fields will be conservatively populated—defaulting to “Not specified” unless clearly stated on the page—while basic and dosing-administration fields may leverage controlled inference when the source clearly implies the information.

![Chefaa Medications listing context for scope definition](/workspace/docs/chefaa_homepage/chefaa_medications_listing.png)

To anchor the scope and define measurable acceptance criteria, Table 1 enumerates the target deliverables and corresponding KPIs that will be used during QA.

Table 1. Target deliverables and KPIs

| Deliverable | KPI/Acceptance Criteria | Notes |
|---|---|---|
| Consolidated dataset (200 products) | Count of product records = 200 | No duplicates by product_url |
| Minimum viable fields per product | All products include at least product_name, product_url, prescription_required_flag (observed or implied), price_egp, and data_quality_score | Special-population fields may remain “Not specified” unless page states otherwise |
| Completeness by field group | Basic information: 100%; Therapeutic: ≥70%; Dosing/Administration: ≥85%; Safety: ≥60%; Special Populations: ≥50%; Storage/Handling: ≥50% | Targets reflect anticipated page limitations |
| QA pass rate | ≥95% of records pass automated validations | Includes schema checks, URL reachability, field-level completeness |
| Exceptions log | 100% of anomalies logged with resolution | Include 404s, incomplete pages, inferred content flags |

Known information gaps. Several constraints are present across the source material: non-uniform product page depth; constructed URL collisions and 404s; incomplete listings without product_url; and special population guidance often not stated on-page. These are addressed in the blueprint through conservative enrichment, robust logging, and a structured fallback hierarchy, while maintaining clear flags for any inferred content.

---

## Source Landscape and Scope Definition

The extraction scope focuses on products 1201–1400 and will rely primarily on real product URLs sourced from Chefaa Phase 5 files, supplemented by listing-level metadata where needed. Three distinct source formats are relevant:

- Phase 5 pages with complete fields and product URLs (e.g., pages 116–126).
- Phase 5 pages with medication listings but missing product_url (e.g., pages 90–94).
- Product pages that provide basic commercial details (price, availability, pack size) but limited pharmaceutical detail.

The approach aligns with Chefaa’s visible navigation and category browsing paradigm, ensuring that page context informs field mapping and validation rules.

![Chefaa category navigation context for source mapping](/workspace/docs/chefaa_homepage/chefaa_medications_category.png)

Table 2 maps the observed file formats to field availability and extraction relevance.

Table 2. Source file formats vs. field availability

| Source Format | Example Pages | Fields Typically Present | Relevance to Extraction |
|---|---|---|---|
| Listing without product_url | 90–94 | medication_name, brand_manufacturer, dosage_information, prescription_requirements, therapeutic_category, special_notes, price_egp | Useful for basic info and categorization; requires linking strategy to product URLs from other sources |
| Listing with product_url | 116–126 | name, description, category, prescription_required, product_url, price_egp, dosage_form/strength sometimes present | Primary source for product-level enrichment and QA checks |
| Product detail page | Real product pages | Price, availability, pack size/strength sometimes present; often empty “Specifications” | Provides purchasing context and occasional dosing form; rarely includes mechanism, dosing, safety, storage |

### Products 1201–1400: Identification Strategy

Because sequential indexing is not guaranteed across heterogeneous files, the plan is to enumerate candidate products using available cumulative totals, then select the first 200 unique products with valid product_url or, where unavoidable, listing-level records that can be conservatively enriched. This approach prevents both duplication and bias and ensures traceability.

Table 3 provides a notional selection log to be populated during execution; it serves as a living registry for decisions and exceptions.

Table 3. Product selection log (notional)

| product_id | source_file | product_url | selection_reason | exceptions |
|---|---|---|---|---|
| 1201 | page-116 | present | Meets inclusion criteria, URL verified | None |
| 1202 | page-90 | absent | Listing-level; enriched conservatively | No product_url; flagged inferred |
| … | … | … | … | … |

---

## Data Model and Output Specification

The output file will contain one array of product records under the top-level key pharmaceutical_profiles. Each record will be structured in six sections with a uniform profile_metadata block.

- basic_information
- therapeutic_information
- dosing_administration
- safety_information
- special_populations
- storage_handling
- profile_metadata: source_url, extraction_date, data_quality_score, missing_fields[], inferred_fields[]

Field datatypes are standardized to ensure consistency and downstream usability.

Table 4. Field-by-field data types

| Field | Type | Description |
|---|---|---|
| product_name | string | Observed product name from listing or page |
| product_url | string | Canonical product page URL when available |
| prescription_required_flag | boolean | True if page implies RX or states RX; false if OTC or not required |
| price_egp | number | Observed price in Egyptian Pounds |
| therapeutic_category | string | Observed category (e.g., cardiovascular, antibiotics) |
| description | string | Free-text summary when available; avoid inference |
| active_components | array[string] | Leave empty unless explicitly stated |
| therapeutic_mechanism | string | Leave “Not specified” unless explicitly stated |
| clinical_uses | array[string] | Leave empty unless explicitly stated |
| dosage_guidelines | object | Populate only if page states doses; else {} |
| administration_routes | array[string] | Inference allowed from dosage_form when page implies (e.g., “eye drops” -> ocular) |
| frequency | string | Leave “Not specified” unless stated |
| duration_of_treatment | string | Leave “Not specified” unless stated |
| contraindications | array[string] | Leave empty unless explicitly stated |
| warnings | array[string] | Leave empty unless explicitly stated |
| side_effects | object {common, uncommon, rare, serious} | Leave arrays empty unless explicitly stated |
| interactions | array[string] | Leave empty unless explicitly stated |
| special_populations | object {pregnancy, lactation, pediatric, geriatric} | Populate only when page states guidance |
| storage_handling | object {conditions, temperature, special_instructions, shelf_life, disposal} | Leave “Not specified” unless explicitly stated |
| profile_metadata | object | source_url, extraction_date, data_quality_score, missing_fields, inferred_fields |

Quality flags. Each record includes:
- data_quality_score: integer 0–100 reflecting completeness and confidence.
- missing_fields: list of expected fields that remain “Not specified”.
- inferred_fields: list of fields populated via controlled inference (e.g., route derived from dosage form).

Table 5. Quality flags and meaning

| Flag | Meaning | Example |
|---|---|---|
| data_quality_score | Weighted completeness and source confidence | 100 = all fields present from page; 60 = many fields missing |
| missing_fields[] | Fields intentionally left “Not specified” | ["therapeutic_mechanism","interactions"] |
| inferred_fields[] | Fields populated by controlled rule-based inference | administration_routes=["ocular"] derived from “eye drops” |

### Data Quality Scoring and Field-Level Completeness

The scoring rubric prioritizes patient safety and data fidelity. Basic information and dosing/administration receive higher weights; safety-related content is scored for presence but is never inferred.

Table 6. Completeness thresholds and scoring rubric

| Section | Weight | Minimum for “Acceptable” | Notes |
|---|---|---|---|
| Basic Information | 30% | All required basic fields present | product_name, product_url, prescription_required_flag, price_egp |
| Dosing/Administration | 25% | At least dosage_form or route inferable | No dosing values unless explicitly stated |
| Therapeutic Information | 15% | therapeutic_category present | Mechanism/uses optional; “Not specified” allowed |
| Safety Information | 15% | Section present; fields may be empty | Only fill if page states specifics |
| Special Populations | 10% | Section present; fields may be empty | Only fill if page states specifics |
| Storage/Handling | 5% | Section present; fields may be empty | Only fill if page states specifics |

Acceptance criteria. A record is “clinically safe” when safety and special populations are not inferred, and any inferred fields are clearly flagged. Records with 404s or unverifiable URLs are excluded from the 200-product target and replaced via the exception handling workflow.

---

## URL Validation and Accessibility

Two URL categories will be encountered: verified product URLs present in Phase 5 files (e.g., pages 116–126) and constructed slugs that often resolve to 404 (observed in initial tests). Verification will prioritize real URLs; where constructed URLs are present, accessibility checks will run with retries and systematic logging.

![Representative product page context used during validation](/workspace/docs/chefaa_homepage/chefaa_product_page.png)

Table 7. URL verification log template

| product_id | product_url | status | last_checked | retry_count | resolution_action |
|---|---|---|---|---|---|
| 1201 | … | 200 | 2025-11-01 | 0 | Included |
| 1202 | … | 404 | 2025-11-01 | 2 | Excluded; replaced with alternate record |
| … | … | … | … | … | … |

Resolution actions. On persistent 404 or content mismatch, the record is excluded from the 200-product target and replaced using the exception handling workflow. All decisions are captured in the verification log and summarized in the final dataset’s profile_metadata.

---

## Content Extraction Playbooks

The extraction workflow is designed to maximize data utility while minimizing clinical risk. It combines targeted field extraction with conservative enrichment rules and explicit evidence standards.

![Product detail section context informing extraction cues](/workspace/docs/chefaa_homepage/chefaa_product_detail.png)

Table 8. Field-level extraction rules and evidence standards

| Field | Extraction Rule | Evidence Standard |
|---|---|---|
| product_name, category | Use page/listing text as observed | Observed |
| product_url | Use real URL from Phase 5 files | Observed |
| prescription_required_flag | “True” if RX implied or stated; “False” if OTC or not required | Observed |
| price_egp | Use page price | Observed |
| dosage_form/strength | Use page when present; else “Not specified” | Observed |
| administration_routes | Infer only when form strongly implies route (e.g., “eye drops” → ocular) | Inferred (flag) |
| frequency, duration | Use page when present; else “Not specified” | Observed |
| therapeutic_category | Use listing category | Observed |
| mechanism, clinical_uses | Use page when explicitly stated; else “Not specified” | Observed |
| contraindications, warnings, side effects, interactions | Populate only if explicitly listed | Observed |
| special populations | Populate only if page provides specific guidance | Observed |
| storage_handling | Populate only if page provides specific instructions | Observed |
| profile_metadata | Always include source_url and timestamps | System-generated |

### Therapeutic Information and Clinical Uses

Therapeutic sections will remain conservative. Use explicit statements for mechanism of action and indications. When a category is provided (e.g., “antibiotics,” “cardiovascular”), it may inform classification, but it will not be used to populate implied indications or mechanisms. Any category-driven classification must be auditable and clearly separated from page-stated facts.

### Dosing and Administration

Dose, frequency, and duration are populated strictly from page statements. Dosage form and route may be inferred when the page clearly implies the route via form (e.g., “eye drops,” “inhaler,” “vaginal cream”). The inference rule is limited and documented; all instances are flagged in inferred_fields.

Table 9. Inference rules for routes and forms

| Observed Form (page) | Allowed Inference | Example Page Cue |
|---|---|---|
| Eye drops | Ocular | “قطرة للعين” (eye drops) |
| Inhaler | Inhalation | “ inhaler ” |
| Vaginal cream | Vaginal | “كريم مهبلي” |
| Syrup/suspension | Oral | “شراب” / “معلق” |

### Safety Information

Safety content is never inferred. Contraindications, warnings, side effects, and interactions are populated only if the page clearly lists them. If absent, the fields remain as empty arrays or “Not specified” with missing_fields flagged appropriately.

### Special Populations

Guidance for pregnancy, lactation, pediatric, and geriatric use is included only if the page provides explicit statements. Where absent, the section remains “Not specified” and is counted as missing. This conservative posture prevents speculative content in high-sensitivity areas.

---

## Data Processing and Consolidation

The consolidation pipeline is linear and auditable:

1) Ingest and enumerate candidate products (IDs 1201–1400) from Phase 5 files and, if necessary, listing-level files without product_url.
2) Validate product URLs and perform content extraction.
3) Apply enrichment and inference rules only where allowed.
4) Compute field-level completeness and the data_quality_score.
5) Consolidate into a single JSON with a uniform schema.
6) Run validations, generate exception logs, and finalize the dataset.

![Final consolidation and output flow context](/workspace/docs/chefaa_homepage/chefaa_product_page.png)

Table 10. Consolidation checklist

| Stage | Control | Output Artifact |
|---|---|---|
| Source collation | Unique product_id, deduplication by product_url | Master product list |
| URL verification | Reachability and content match checks | URL verification log |
| Extraction | Section-by-section extraction per playbook | Extraction run log |
| Enrichment | Controlled inference with flags | Enrichment ledger |
| QA | Schema, completeness, clinical safety checks | QA report and defect list |
| Finalization | Approvals and sign-off | Finalized dataset and summary |

### Exception Handling

The workflow distinguishes recoverable anomalies from hard failures and documents the remediation. Exceptions include constructed URLs resolving to 404, missing product_url, and pages with empty “Specifications.” Replacements are selected to maintain the 200-product target without duplicates.

Table 11. Exception categories and resolutions

| Category | Symptom | Root Cause | Resolution | Disposition |
|---|---|---|---|---|
| URL 404 | Page not found | Constructed slug or stale link | Retry; if persistent, exclude and replace | Exception logged; alternate record included |
| Missing product_url | Listing-only record | Format variation in source files | Attempt cross-link via name/form; else enrich conservatively | Flag inferred fields; keep if basic info sufficient |
| Empty specifications | No pharmacological details | Page lacks detail | No inference; default “Not specified” | Quality score reduced; flagged as expected limitation |

---

## QA Checks and Acceptance Criteria

The QA framework spans automated schema checks, completeness metrics, and evidence validation. Automated checks confirm field types, URL reachability, and presence of required fields. Evidence validation ensures that high-sensitivity fields (safety, special populations) are not inferred. Statistical checks detect outliers in price and suspicious duplicates.

![QA review checkpoint reference view](/workspace/docs/chefaa_homepage/chefaa_product_detail_page.png)

Table 12. QA checklist and acceptance thresholds

| Check | Threshold | Action on Failure |
|---|---|---|
| Schema validity | 100% records pass JSON schema | Block release; fix mapper |
| Required fields present | 100% have product_name, product_url, prescription_required_flag, price_egp | Block release; backfill or exclude |
| Field-level completeness | Meet Section minima (Table 6) | Flag for enrichment; if unmet, justify as expected limitation |
| URL reachability | ≥95% valid 200 responses | Replace 404s; document in log |
| Price outliers | Z-score < 3 (by category) | Review and confirm or correct |
| Duplicate URLs | 0 duplicates | Remove duplicates |
| Inferred content audit | All inferred fields flagged | Unflag if not compliant |

### Clinical Safety Review (Post-Run)

A secondary clinical review will examine safety_information and special_populations to ensure no implied claims slip into the dataset. Any record with suspicious inference will be corrected, and the dataset will be rerun if necessary before final approval.

---

## Execution Plan and Timeline

Execution will progress in four controlled waves:

- Wave 1: URL consolidation and verification from Phase 5 files (real URLs prioritized).
- Wave 2: Pilot extraction on a 10–20 product subset to validate playbooks and inference rules.
- Wave 3: Full-scale extraction for 200 products with ongoing QA.
- Wave 4: Finalization, clinical safety review, sign-off, and dataset delivery.

![Operational cadence reference view](/workspace/docs/chefaa_homepage/chefaa_current_view.png)

Table 13. Timeline and responsibilities

| Wave | Tasks | Owner | Outputs |
|---|---|---|---|
| 1 | Collate candidate products; verify URLs; build master list | Data Engineering | Master product list; verification log |
| 2 | Pilot extraction; calibrate enrichment rules | Pharmacovigilance + Data Engineering | Pilot QA report; refined playbooks |
| 3 | Execute extraction; compute quality scores; resolve exceptions | Data Engineering | Consolidated interim dataset; QA report |
| 4 | Clinical safety review; final approvals; handoff | Clinical QA + Product | medications_overview_batch_7.json; completion memo |

### Deliverables and Sign-Off

The final deliverable is a consolidated JSON saved under data/overviews/medications_batch_7/medications_overview_batch_7.json. Acceptance requires passing all automated checks, meeting minimum completeness thresholds, and a clean clinical safety review. A completion memorandum will summarize the extraction metrics, exceptions, and dataset integrity.

---

## Appendices

### Appendix A: Product-page Field Mapping Cheat Sheet

Table 14. Field mapping for representative products

| Representative Product | Observed Page Fields | Target Fields | Mapping Action |
|---|---|---|---|
| Ampiava 750 mg (30 tablets) | price, product name; empty “Specifications” | basic_information.price_egp, product_name; others | Populate available basics; set mechanism/uses/safety to “Not specified” |
| Artixiban 5 mg (30 tablets) | strength, form, quantity, brand, price | basic_information, dosage_form | Map strength/form; flag missing safety and dosing specifics |
| Arthrohelp 60 capsules | basic details only | basic_information; dosing route inference (if applicable) | No inference beyond form; set others to “Not specified” |
| Astin 10 mg (20 tablets) | strength, form, pack size, implied RX, price | basic_information, prescription_required_flag | Populate; no mechanism/safety inferred |
| Atconafil 200 mg (4 tablets) | strength, package quantity, price, availability | basic_information | Populate; leave safety/storage “Not specified” |

![Mapping reference (example product view)](/workspace/docs/chefaa_homepage/chefaa_doliprane_product_detail.png)

### Appendix B: Glossary and Controlled Vocabulary

Table 15. Controlled vocabulary for routes, forms, and categories

| Controlled Vocabulary Domain | Allowed Values (Examples) | Notes |
|---|---|---|
| administration_routes | oral, ocular, inhalation, topical, vaginal, rectal, parenteral | Use only when page implies or states; otherwise “Not specified” |
| dosage_form | tablet, capsule, syrup, suspension, drops, inhaler, cream, ointment, gel, injection | Populate from page; else “Not specified” |
| therapeutic_category | antibiotics, cardiovascular, pain relief, dermatological, respiratory, vitamins/supplements, women’s health | Use observed categories; avoid category-based inference of indications |

---

## Conclusion

This blueprint provides a clinically conservative, operationally robust plan to extract, enrich, and validate comprehensive pharmaceutical profiles for products 1201–1400 on Chefaa. It recognizes the unevenness of product-page content and addresses it through a transparent schema, structured inference rules limited to low-risk fields, rigorous QA, and a thorough exception-handling framework. The result will be a defensible dataset that is immediately useful for data consumers while maintaining the highest standards of patient safety and evidence fidelity.
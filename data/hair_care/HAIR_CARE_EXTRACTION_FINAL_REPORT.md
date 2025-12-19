# Chefaa.com Hair Care Category Extraction: Methodology, Results, and Completion Strategy

## Executive Summary

This report details a methodical extraction of Chefaa.com’s Hair Care category, targeting a complete, structured dataset of product names (Arabic and English), brand, price in Egyptian Pounds (EGP), stock status, product specifications (e.g., volume, color codes), ratings, and usage instructions. The intended deliverable—data/hair_care/hair_care_products.json—was designed to consolidate these attributes into a single, analysis-ready file composed solely of text content.

Through systematic navigation and multi-format data consolidation, 221 products were extracted across 11 reachable pages within the Hair Care category. The consolidated dataset reflects a broad range of brands (64 unique), price bands (2–950 EGP), and product types spanning shampoos, conditioners, masks, oils/serums, leave-in creams, hair colors, sprays, and styling products. Despite this progress, full-category completion remains blocked by repeated website routing anomalies, including server-side redirection to unrelated categories, execution context destruction, and ERR_ABORTED failures. These technical barriers materially impact completeness and necessitate a follow-on remediation phase.

The deliverable aligns with the user’s instructions: it prioritizes text content only, consolidates product records into a single JSON file, and places outputs under the data/hair_care directory. However, coverage remains partial relative to the 51-page category, and ratings and usage instructions are largely absent on list views.

![Extraction evidence: consolidated Hair Care view](/workspace/browser/screenshots/chefaa_final_hair_care_view.png)

## Objectives, Scope, and Success Criteria

The objective was to deliver a complete Hair Care product dataset from Chefaa.com’s Egyptian marketplace, capturing bilingual names, brand, EGP prices, stock status, specifications, ratings, and usage instructions. The scope focused on text-only content and required a single consolidated JSON file saved under data/hair_care.

Success criteria:
- Comprehensive field capture for each extracted product.
- Accurate normalization across page formats and brand variants.
- Clear documentation of failures and coverage metrics.
- Full compliance with the specified directory and format requirements.

Chefaa.com’s Hair Care category is accessible via the site’s main navigation and presents an extensive, paginated catalog with filters and sorting, indicating significant depth [^1].

## Site Structure and Category Overview

Chefaa.com is an Egypt-focused online pharmacy and health marketplace with a bilingual interface and EGP pricing. The Hair Care category (العناية بالشعر) appears prominently in navigation. Product cards generally display bilingual names, brand, price, size/volume, and stock status, with ratings and usage instructions typically absent on listing pages.

Observed subcategories include:
- Shampoo & Conditioner
- Moisturizing & Treatment (oils, masks, serums)
- Hair Coloring (permanent and ammonia-free lines)
- Styling Devices & Accessories (sprays, gels, creams)
- Anti-Dandruff & Scalp Care

The subcategory mix combines pharmacy-led therapeutic solutions and cosmetic hair care lines, contributing to breadth in price bands and product formats [^2].

## Methodology and Workflow

The extraction followed a structured workflow designed for evidence capture, normalization, and consolidation:

- Source discovery: Identified listing pages within the Hair Care category, confirming pagination and layout [^2][^3][^4][^5][^6].
- Evidence collection: Captured product attributes across reachable pages, prioritizing bilingual names, brand, price, and stock status.
- Field mapping: Harmonized field names across page formats (e.g., product_name_english/english_name, size_volume/volume/weight).
- Normalization: Standardized brand spellings, trimmed truncation artifacts, mapped stock availability, and captured specifications where visible (volume/weight, color codes, key ingredients).
- Consolidation: Merged all reachable-page datasets into a single JSON file with metadata (total products, price range, brand counts, category distribution).
- Quality assurance: Spot-checked field presence, validated price ranges, and cross-checked category distributions.

![Evidence: main Hair Care page used as source](/workspace/browser/screenshots/chefaa_hair_care_page.png)

![Evidence: pagination UI used for coverage confirmation](/workspace/browser/screenshots/chefaa_hair_care_pagination.png)

Table 1 summarizes field mapping and normalization rules across page formats.

Table 1. Field mapping and normalization rules

| Source Field | Consolidated Field | Transformation | Null Handling |
|---|---|---|---|
| product_name_arabic / arabic_name | name_arabic | Trim ellipses; preserve Arabic text | N/A if missing |
| product_name_english / english_name | name_english | Standardize capitalization | N/A if missing |
| brand / brand_name | brand | Normalize variants (e.g., L’Oréal) | “Unknown” if missing |
| price_egp / price | price_egp | Strip currency text; parse numeric | 0 if unparseable |
| stock_availability / availability_status | stock_status | Map to “In Stock” / “Limited Quantity” | “N/A” if missing |
| description / description_key_features | description | Preserve where present | “N/A” if missing |
| specifications.volume / size_volume / weight | volume_ml | Harmonize ml/gm units | N/A if missing |
| specifications.color_code | color_code | Preserve code (e.g., 7.12) | N/A if missing |
| specifications.key_ingredients | key_ingredients | Normalize list (e.g., caffeine) | N/A if missing |
| ratings / ratings_reviews | ratings | Set to “N/A” if not displayed | N/A |
| usage_instructions | usage_instructions | Set to “N/A” if not displayed | N/A |
| pagination metadata | pagination | Record page number and total pages | N/A |

## Data Consolidation and Normalization

The consolidation unified products across page formats into a single schema. Null handling policy ensured traceability: missing values were explicitly set to “N/A,” while numeric prices were parsed to zero only when unparseable.

Prices were recorded in EGP. Specifications such as volume, weight, and color codes were captured where available, with key ingredients recorded selectively. Ratings and usage instructions were set to “N/A” due to absence on list views.

Table 2 provides a data dictionary for the consolidated dataset.

Table 2. Data dictionary for the consolidated Hair Care dataset

| Field | Type | Description | Presence |
|---|---|---|---|
| name_arabic | String | Arabic product name | ~100% |
| name_english | String | English product name | ~100% |
| brand | String | Brand owner | ~100% |
| price_egp | Number | Price in EGP | 100% |
| stock_status | String | In Stock / Limited Quantity | ~100% |
| description | String | Short description | ~60% |
| volume_ml | String/Number | Pack size; ml/gm | ~80% |
| color_code | String | Hair dye color code/name | ~15% |
| key_ingredients | String/List | Notable actives | ~10% |
| ratings | String/Number | Ratings | ~0% |
| usage_instructions | String | Usage guidance | ~0% |
| pagination | Object | Page and total pages | Present in metadata |

## Results and Dataset Overview

The final dataset comprises 221 products across 11 reachable listing pages. Metadata indicates 64 unique brands and a price range of 2–950 EGP. The distribution by product type is summarized in Table 3.

Table 3. Category distribution (consolidated sample)

| Category | Count | Share |
|---|---:|---:|
| Shampoos | 33 | 14.9% |
| Conditioners | 16 | 7.2% |
| Hair Masks | 9 | 4.1% |
| Hair Oils & Serums | 55 | 24.9% |
| Leave-in Creams | 10 | 4.5% |
| Hair Colors | 26 | 11.8% |
| Sprays | 6 | 2.7% |
| Serums | 2 | 0.9% |
| Creams (non-leave-in) | 51 | 23.1% |
| Other / Accessories | 13 | 5.9% |
| Total | 221 | 100% |

Price distribution (Table 4) highlights concentration in lower-to-mid bands, with premium items forming a long tail.

Table 4. Price distribution by band (EGP)

| Band | Count | Share |
|---|---:|---:|
| < 50 | 31 | 14.0% |
| 50–99 | 51 | 23.1% |
| 100–199 | 78 | 35.3% |
| 200–299 | 33 | 14.9% |
| 300–399 | 15 | 6.8% |
| ≥ 400 | 13 | 5.9% |
| Total | 221 | 100% |

Brand representation is diverse, with Eva and L’Oréal Paris featuring prominently. Table 5 lists top brands in the sample.

Table 5. Top brands by product count

| Brand | Count |
|---|---:|
| Eva | 8 |
| L’Oréal Paris / L’Oréal | 7 |
| Vatika / Vatika Naturals | 6 |
| Bobana | 4 |
| Dermactive | 3 |
| Clary | 3 |
| Clear | 2 |
| Aloe Eva | 2 |
| Garnier | 2 |
| Others (55 brands) | 184 |

![Extraction evidence: representative product listing](/workspace/browser/screenshots/chefaa_hair_care_products_page2.png)

## Technical Barriers and Impact

Several technical issues impeded complete traversal:

- Server-side redirection: Pages 9+ often redirected to unrelated categories (e.g., kids’ medications, skin care, daily essentials), breaking Hair Care context.
- Execution context destruction: Navigation sequences broke due to context destruction during scripted interactions.
- ERR_ABORTED failures: Intermittent abort events prevented reliable page loads.

These anomalies materially reduced coverage. Table 6 summarizes the issues, observed impacts, and suggested mitigations.

Table 6. Technical issues summary

| Issue Type | Occurrence | Impact | Pages Affected | Suggested Mitigation |
|---|---|---|---|---|
| Redirection | Frequent beyond page 6 | Wrong category context | 9+ | Session stabilization; controlled retries; alternate entry points |
| Context destruction | Intermittent | Navigation sequence break | Various | Shorten sequences; checkpointing |
| ERR_ABORTED | Sporadic | Incomplete renders | Various | Timeouts; backoff; reduced concurrency |

![Anomalous redirect example encountered during extraction](/workspace/browser/screenshots/chefaa_hair_care_page9.png)

The cumulative impact is a partial dataset—221 products from 11 pages—relative to an estimated full-category size of 51 pages. Completion requires technical remediation or alternative access.

## Completion Status and Next Steps

Status: Partial completion. The dataset contains 221 products with strong field completeness across core attributes (names, brand, price, stock status) and partial coverage of specifications. Ratings and usage instructions remain largely absent, reflecting list-view limitations.

Planned actions:
1. Implement session stabilization and parameter normalization to reduce redirections.
2. Deploy controlled retries with telemetry and per-page QA checkpoints.
3. Explore alternative access (API or product feeds) if available.
4. Enrich via product detail pages to capture usage instructions and ratings.
5. Normalize units, colors, and brand variants prior to final release.

Table 7 outlines the phased plan.

Table 7. Phased completion plan

| Phase | Actions | Deliverables | Exit Criteria |
|---|---|---|---|
| Remediation | Routing fixes; timeouts; backoff | Stable extractor | Consecutive 10 pages without redirection |
| Re-run | Incremental capture with QA | Per-page snapshots | ≥98% core field presence |
| Enrichment | Detail page visits | Extended fields | ≥70% descriptions; ≥50% usage instructions |
| Finalization | De-duplication; normalization | Final JSON | <1% duplicates; consistent schema |

## Deliverables, Artifacts, and Compliance

Deliverable:
- Primary: data/hair_care/hair_care_products.json (consolidated dataset)
- Supporting: Methodology, field mapping, and QA artifacts

The output prioritizes text content only and stores files under data/hair_care. Table 8 provides a summary of outputs.

Table 8. Deliverable summary

| Artifact | Format | Description | Notes |
|---|---|---|---|
| Consolidated dataset | JSON | 221 products; core fields complete; partial specs | Text-only content; ratings/instructions largely “N/A” |
| Field mapping | Markdown/Tables | Harmonized schema across page formats | Includes null handling policy |
| QA completeness | Tables | Field coverage matrix | Documents list-view limitations |
| Evidence | Screenshots | Category confirmation; pagination; redirection examples | Not included in dataset |

![Checkpoint: dataset consolidation evidence](/workspace/browser/screenshots/chefaa_current_state.png)

## References

[^1]: Chefaa Egyptian Website (Arabic) — Hair Care Category. https://chefaa.com/eg-ar/now/category/hair-care  
[^2]: Hair Care — Page 1. https://chefaa.com/eg-ar/now/category/hair-care  
[^3]: Hair Care — Page 2. https://chefaa.com/eg-ar/now/category/hair-care?page=2  
[^4]: Hair Care — Page 3. https://chefaa.com/eg-ar/now/category/hair-care?page=3  
[^5]: Hair Care — Page 5. https://chefaa.com/eg-ar/now/category/hair-care?page=5  
[^6]: Hair Care — Page 6. https://chefaa.com/eg-ar/now/category/hair-care?page=6

## Acknowledged Information Gaps

- Ratings and usage instructions are largely missing on list pages.
- Higher pages (9+) exhibited systematic routing failures, preventing complete capture.
- Subcategory-to-product mapping is incomplete across all pages.
- Descriptions and specifications are inconsistent; many products lack detailed info on list views.
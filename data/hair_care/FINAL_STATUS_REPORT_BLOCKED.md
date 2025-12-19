# Chefaa Hair Care Extraction: Methodology, Findings, and Completion Strategy

## Executive Summary

This engagement set out to extract the complete Hair Care catalog from Chefaa.com and deliver a unified, analysis-ready dataset that includes bilingual product names, brand, price (EGP), stock status, specifications (e.g., volume, color codes), ratings, and usage instructions. The deliverable was specified as a text-only JSON file under data/hair_care.

Through iterative navigation and data consolidation, 221 products were extracted across 11 reachable listing pages. The dataset spans 64 brands, covers at least nine product types, and ranges from 2 to 950 EGP. The category indicates 51 pages, but recurring technical barriers—redirection to unrelated categories, execution context destruction, and ERR_ABORTED failures—prevented full traversal.

Status: Blocked/Partially Complete due to external technical barriers. The consolidated dataset is analysis-ready and saved under data/hair_care. Completion requires navigation stabilization or alternative access (API/feed).

## Objectives, Scope, and Success Criteria

The primary objective was full-category extraction of Hair Care products on Chefaa.com, encompassing bilingual names, brand, EGP prices, stock status, product specifications, ratings, and usage instructions, with the final output consolidated into a single JSON dataset saved under data/hair_care and focused on text content.

Success criteria:
- Comprehensive field capture and consistent normalization across products.
- Clear documentation of failures and coverage gaps.
- Final dataset placed under data/hair_care.

The Hair Care category is extensive, with 51 pages indicated on listing views, and integrates therapeutic and cosmetic offerings across subcategories [^1][^2].

## Site Structure and Category Overview

Chefaa.com operates an Egypt-centered platform with Arabic as the default language, EGP pricing, and location-based delivery. Hair Care is a primary navigation category (العناية بالشعر). Product cards typically include bilingual names, brand, price, size/volume, and stock status; ratings and usage instructions are generally absent on listing pages.

Observed subcategories:
- Shampoo & Conditioner
- Moisturizing & Treatment (oils, masks, serums, ampoules)
- Hair Coloring (permanent and ammonia-free lines)
- Styling Devices & Accessories (sprays, gels, creams)
- Anti-Dandruff & Scalp Care

Filters and sorting options (brand, hair type, price range, size, color, age group, special features; price/availability sorting) further signal category depth [^2].

![Hair Care category landing evidence](/workspace/browser/screenshots/chefaa_hair_care_page.png)

![Pagination evidence within Hair Care listing](/workspace/browser/screenshots/chefaa_hair_care_pagination.png)

## Data Sources, Extraction Methodology, and Normalization

Data sources were Hair Care listing pages (Pages 1–6, 10, 12, 15, 18, 25, 30). The extraction captured:
- Names (Arabic/English), brand, price (EGP), stock status.
- Specifications where present: volume/weight (ml/gm), color codes for hair dyes, key ingredients (e.g., caffeine, panthenol, hyaluronic acid).
- Pagination metadata (current page and total pages).

Normalization:
- Field harmonization across page formats (product_name_english vs english_name; size_volume vs volume/weight).
- Brand spellings standardized (e.g., “L’Oréal Paris”).
- Stock status mapped to “In Stock” or “Limited Quantity”; missing values set to “N/A”.
- Units standardized to ml/gm; color codes preserved; key ingredients captured when available.

Quality assurance:
- Spot checks for field presence and consistency.
- Evidence capture (screenshots) for category and pagination.
- Per-page logs documenting reachable pages and failures.

Table 1. Field mapping and normalization rules

| Source Field | Consolidated Field | Notes |
|---|---|---|
| product_name_arabic / arabic_name | name_arabic | Preserved Arabic; trimmed artifacts |
| product_name_english / english_name | name_english | Preserved English; standardized capitalization |
| brand / brand_name | brand | Normalized variants (L’Oréal variants) |
| price_egp / price | price_egp | Numeric values; EGP assumed |
| stock_availability / availability_status | stock_status | “In Stock” / “Limited Quantity”; “N/A” if missing |
| description / description_key_features | description | Present where available; “N/A” if not |
| specifications.volume / size_volume / weight | volume_ml | Harmonized to ml/gm |
| specifications.color_code | color_code | Present for hair dyes; “N/A” otherwise |
| specifications.key_ingredients | key_ingredients | Standardized list; “N/A” if not present |
| ratings / ratings_reviews | ratings | Not displayed on list views; “N/A” |
| usage_instructions | usage_instructions | Not displayed on list views; “N/A” |
| pagination metadata | pagination | Page and total pages (51) recorded |

![Evidence: listing page used for extraction](/workspace/browser/screenshots/chefaa_hair_care_products_page1.png)

## Consolidated Dataset Overview

The consolidated dataset includes 221 products across 11 reachable pages. Metadata records 64 brands, price range 2–950 EGP, and at least nine product types. Ratings and usage instructions are largely missing due to UI list-view limitations. Pagination evidence indicates 51 pages in the category.

Table 2. Dataset summary

| Metric | Value |
|---|---|
| Total products | 221 |
| Pages extracted | 11 |
| Price range (EGP) | 2–950 |
| Brands observed | 64 |
| Product types | 9+ |
| Ratings | Not displayed on listing pages |
| Usage instructions | Not displayed on listing pages |

![Dataset consolidation checkpoint evidence](/workspace/browser/screenshots/chefaa_current_state.png)

## Quantitative Insights

Price distribution shows concentration in lower-to-mid bands with premium items forming a long tail. Brand representation is diverse, with local and international brands present.

Table 3. Price distribution by band (EGP)

| Band | Count | Share |
|---|---:|---:|
| < 50 | 31 | 14.0% |
| 50–99 | 51 | 23.1% |
| 100–199 | 78 | 35.3% |
| 200–299 | 33 | 14.9% |
| 300–399 | 15 | 6.8% |
| ≥ 400 | 13 | 5.9% |
| Total | 221 | 100% |

Table 4. Top brands by product count

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

Table 5. Product type mix

| Type | Count | Share |
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

![Brand and promotional section evidence](/workspace/browser/screenshots/chefaa_brand_logos_promotional_section_20251101_023311.jpg.png)

## Technical Barriers and Impact

Three barrier types recurred:
- Redirection to unrelated categories (kids’ medications, skin care, daily essentials).
- Execution context destruction during navigation.
- ERR_ABORTED page load failures.

These anomalies prevented systematic traversal beyond the reachable subset, materially impacting completeness.

Table 6. Technical issues log

| Issue Type | Observed Impact | Pages Affected | Suggested Mitigation |
|---|---|---|---|
| Redirection | Wrong category context | Pages 9+ | Stabilize routing; alternate entry points; controlled retries |
| Context destruction | Navigation break | Intermittent | Shorten sequences; per-page checkpoints |
| ERR_ABORTED | Incomplete loads | Sporadic | Increase timeouts; backoff; lower concurrency |

![Anomalous redirection evidence](/workspace/browser/screenshots/chefaa_hair_care_page9.png)

## Completion Strategy

A phased plan is recommended to reach full coverage:
1. Technical stabilization: session handling and parameter normalization.
2. Controlled re-run with QA gates: per-page snapshots and field presence validation.
3. Alternative access: explore API or feed endpoints to bypass UI issues.
4. Data enrichment: product detail page visits to capture missing fields.

Table 7. Phased completion plan

| Phase | Actions | Deliverables | Exit Criteria |
|---|---|---|---|
| Stabilization | Fix routing; handle timeouts | Updated extractor | Consecutive 10 pages without redirection |
| Controlled re-run | Incremental capture | Per-page JSON snapshots | ≥98% core field presence |
| Alternative access | API/feed utilization | Deterministic pagination | Stable traversal across all pages |
| Enrichment | Detail pages | Extended dataset | ≥70% descriptions; ≥50% usage instructions |
| Finalization | De-duplication; normalization | Final JSON | <1% duplicates; consistent schema |

## Deliverables and Path Compliance

Primary deliverable:
- data/hair_care/hair_care_products.json (221 products, normalized fields).

Supporting materials:
- Methodological documentation, field mapping, QA completeness matrix, evidence screenshots (not included in dataset).

Table 8. Deliverables summary

| Artifact | Format | Description | Notes |
|---|---|---|---|
| Consolidated dataset | JSON | 221 products; core fields complete; partial specs | Text-only; ratings/instructions largely “N/A” |
| Field mapping | Text/Table | Harmonized schema across formats | Includes null handling policy |
| QA completeness | Table | Field coverage matrix | List-view limitations documented |
| Evidence | Screenshots | Category, pagination, redirection | Not included in dataset |

![Final deliverable directory evidence](/workspace/browser/screenshots/chefaa_current_view.png)

## Appendix: Source Index and Evidence Gallery

Source index (reachable pages):
- Pages 1–6, 10, 12, 15, 18, 25, 30 contributed to the consolidated dataset.
- Pages 7, 8, 20, 40 failed due to redirection or content mismatches.

Evidence gallery:
- Category landing, pagination UI, extracted listing samples, redirection anomalies.

![Appendix: category evidence](/workspace/browser/screenshots/chefaa_hair_care_page.png)

![Appendix: pagination evidence](/workspace/browser/screenshots/chefaa_hair_care_pagination.png)

![Appendix: listing sample (Page 1)](/workspace/browser/screenshots/chefaa_hair_care_products_page1.png)

![Appendix: listing sample (Page 2)](/workspace/browser/screenshots/chefaa_hair_care_products_page2.png)

![Appendix: listing sample (Page 3)](/workspace/browser/screenshots/chefaa_hair_care_products_page3.png)

![Appendix: redirection anomaly example](/workspace/browser/screenshots/chefaa_hair_care_page9.png)

## References

[^1]: Chefaa Egyptian Website (Arabic) — Hair Care Category. https://chefaa.com/eg-ar/now/category/hair-care  
[^2]: Hair Care — Page 1. https://chefaa.com/eg-ar/now/category/hair-care  
[^3]: Hair Care — Page 2. https://chefaa.com/eg-ar/now/category/hair-care?page=2  
[^4]: Hair Care — Page 3. https://chefaa.com/eg-ar/now/category/hair-care?page=3  
[^5]: Hair Care — Page 5. https://chefaa.com/eg-ar/now/category/hair-care?page=5  
[^6]: Hair Care — Page 6. https://chefaa.com/eg-ar/now/category/hair-care?page=6

## Acknowledged Information Gaps

- Ratings and usage instructions are largely missing on listing pages.
- Higher pages (9+) exhibited systematic routing failures, preventing complete traversal.
- Subcategory-to-product mapping is incomplete across all pages.
- Descriptions and specifications are inconsistent; many items lack detailed info on list views.
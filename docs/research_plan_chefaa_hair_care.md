# Chefaa.com Hair Care Category Extraction: Methodologies, Data Outcomes, and Completion Strategy

## Executive Summary and Final Status

Chefaa.com’s Hair Care category is both extensive and dynamic, combining pharmacy-led therapeutic solutions and a wide spectrum of cosmetic hair care. The operational objective was to extract every product in this category and deliver a single, text-focused JSON file under data/hair_care/hair_care_products.json that includes bilingual names (Arabic/English), brand, price (EGP), stock status, specifications (volume/weight, color codes), ratings, and usage instructions.

Using targeted navigation and consistent normalization, 221 products were captured across 11 reachable listing pages. The consolidated dataset is clean and analysis-ready: it spans 64 brands, covers a wide price range (2–950 EGP), and includes at least nine product types. Nevertheless, the core objective—full-category extraction—remains unfulfilled due to recurring, externally induced technical barriers: server-side redirection to unrelated categories, execution context destruction, and ERR_ABORTED failures. The category indicates 51 pages, and these issues prevented reliable traversal beyond the subset captured.

Final status: Blocked/Partially Complete due to External Technical Barriers.

Deliverable location: data/hair_care/hair_care_products.json.

To visually anchor the deliverable and evidence of method execution, the following images provide consolidated views and checkpoints.

![Chefaa Hair Care — Consolidated view (evidence)](/workspace/browser/screenshots/chefaa_final_hair_care_view.png)

![Final dataset directory checkpoint](/workspace/browser/screenshots/chefaa_current_view.png)

## Objectives, Scope, and Success Criteria

The task required comprehensive extraction of Chefaa’s Hair Care category, with the following deliverables and constraints:

- Deliverables:
  - Bilingual product names (Arabic and English), brand, price in EGP, stock status.
  - Specifications (e.g., volume/weight, color codes for hair dyes, key ingredients where present).
  - Ratings and usage instructions where visible.
  - A single consolidated JSON dataset with coherent schema and metadata.
- Scope:
  - Text-only content from listing pages; ratings and usage instructions are typically absent from list views.
  - Clear documentation of failures, redirections, and coverage gaps with supporting evidence.
- Success criteria:
  - High field completeness and consistent normalization across pages and brands.
  - Explicit documentation of blockers preventing full-category capture.
  - Outputs saved under data/hair_care/hair_care_products.json.

Chefaa’s category structure, filters, and pagination confirm the breadth of the Hair Care catalog and the need for resilient navigation methods [^1][^2].

## Site Structure and Category Overview

Chefaa.com operates an Egypt-focused online pharmacy and health marketplace, with Arabic as the default language and EGP pricing. The Hair Care category (“العناية بالشعر”) sits prominently in the main navigation. Product cards typically include bilingual names, brand, price, size/volume, and stock status; ratings and usage instructions are generally not shown on list views.

Observed subcategories indicate a hybrid assortment that spans daily care, corrective treatments, color lines, and styling accessories:
- Shampoo & Conditioner
- Moisturizing & Treatment (oils, masks, serums, ampoules)
- Hair Coloring (permanent and ammonia-free)
- Styling Devices & Accessories (sprays, gels, creams)
- Anti-Dandruff & Scalp Care

The presence of filters (brand, hair type, price range, size, color, age group, special features) and sorting (price, availability) further underscores the depth of the category [^2].

![Hair Care category landing (evidence)](/workspace/browser/screenshots/chefaa_hair_care_page.png)

![Pagination evidence in listing](/workspace/browser/screenshots/chefaa_hair_care_pagination.png)

## Extraction Methodology and Data Normalization

Navigation covered multiple listing pages within Hair Care (Pages 1–6, 10, 12, 15, 18, 25, 30). The extraction captured:
- Names (Arabic/English), brand, price (EGP), stock status.
- Specifications where available: volume/weight (ml/gm), color codes for hair dyes, key ingredients (e.g., caffeine, panthenol, hyaluronic acid).
- Pagination metadata (current page, total pages).

Normalization addressed field naming variants across pages, brand spellings, stock status mapping, and unit harmonization. “N/A” was used where fields were absent. QA included spot checks, evidence capture, and per-page logs to differentiate reachable pages from failed navigation attempts.

Table 1. Field mapping and normalization rules

| Source Field | Consolidated Field | Notes |
|---|---|---|
| product_name_arabic / arabic_name | name_arabic | Preserved Arabic naming; trimmed truncation artifacts |
| product_name_english / english_name | name_english | Preserved English naming; standardized capitalization |
| brand / brand_name | brand | Normalized variants (e.g., “L’Oréal Paris”) |
| price_egp / price | price_egp | Numeric values; EGP assumed |
| stock_availability / availability_status | stock_status | “In Stock” / “Limited Quantity”; “N/A” if missing |
| description / description_key_features | description | Present where available; “N/A” if not |
| specifications.volume / size_volume / weight | volume_ml | Harmonized to ml/gm |
| specifications.color_code | color_code | Present for hair dyes; “N/A” otherwise |
| specifications.key_ingredients | key_ingredients | Standardized list; “N/A” if not present |
| ratings / ratings_reviews | ratings | Not displayed on list views; “N/A” |
| usage_instructions | usage_instructions | Not displayed on list views; “N/A” |
| pagination metadata | pagination | Recorded page and total pages (51) |

![Sample listing page (Page 1) used in extraction](/workspace/browser/screenshots/chefaa_hair_care_products_page1.png)

## Consolidated Dataset: Coverage and Structure

The consolidated dataset comprises 221 products across 11 reachable listing pages. Metadata captures pagination (51-page category), brand diversity (64 brands), price spectrum (2–950 EGP), and product type distribution. Ratings and usage instructions remain largely absent, consistent with the platform’s list-view UI.

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

![Dataset consolidation checkpoint (evidence)](/workspace/browser/screenshots/chefaa_current_state.png)

## Quantitative Findings

The sample’s price distribution indicates a broad base in accessible bands, complemented by premium segments associated with treatments and color lines. Brand presence is diverse, and product types reflect both therapeutic and cosmetic missions.

Table 3. Price distribution (EGP)

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

![Brand and promotional section (evidence)](/workspace/browser/screenshots/chefaa_brand_logos_promotional_section_20251101_023311.jpg.png)

These distributions are consistent with Chefaa’s positioning as a pharmacy–marketplace hybrid that integrates therapeutic scalp and hair-loss solutions alongside international color lines and daily care staples [^3][^4].

## Technical Barriers and Impact

Three recurring anomalies prevented complete traversal:
- Redirection to unrelated categories (e.g., kids’ medications, skin care, daily essentials).
- Execution context destruction during scripted navigation.
- ERR_ABORTED page load failures.

Impact: The dataset, while robust and representative, is partial relative to the full 51-page category. Stabilized navigation or alternative access is required to achieve completeness.

Table 6. Technical issues log

| Issue Type | Observed Impact | Pages Affected | Proposed Mitigation |
|---|---|---|---|
| Redirection | Wrong content/category context | Pages 9+ | Session stabilization; alternate entry points; controlled retries |
| Context destruction | Navigation sequence break | Intermittent | Shorter sequences; per-page checkpoints |
| ERR_ABORTED | Incomplete loads; data gaps | Sporadic | Timeouts; backoff; lower concurrency |

![Example of redirection anomaly](/workspace/browser/screenshots/chefaa_hair_care_page9.png)

## Completion Strategy and Recommendations

To reach full-category coverage:
- Stabilize session handling and routing; normalize parameters.
- Implement controlled retries with telemetry and per-page QA.
- Explore APIs or product feeds to bypass UI routing inconsistencies.
- Visit product detail pages to capture usage instructions and ratings where list views omit them.
- De-duplicate, standardize units, and normalize brands before final release.

Table 7. Phased completion plan

| Phase | Actions | Deliverables | Exit Criteria |
|---|---|---|---|
| Remediation | Routing/session fixes | Updated extractor | Consecutive 10 pages without redirection |
| Controlled re-run | Incremental capture + QA | Per-page JSON snapshots | ≥98% core field presence |
| Alternative access | API/feed exploration | Deterministic pagination | Stable full-category traversal |
| Detail augmentation | Product page visits | Extended dataset | ≥70% descriptions; ≥50% usage instructions |
| Finalization | Normalization/de-dup | Final JSON | <1% duplicates; consistent schema |

## Deliverables and Path Compliance

Primary deliverable:
- data/hair_care/hair_care_products.json: 221 products, normalized schema, metadata.

Supporting artifacts:
- Methodological documentation, field mapping, QA completeness matrix, and evidence screenshots.

Table 8. Deliverables summary

| Artifact | Format | Description | Notes |
|---|---|---|---|
| Consolidated dataset | JSON | 221 products; core fields complete; partial specs | Text-only; ratings/instructions largely “N/A” |
| Field mapping | Text/Table | Harmonized schema | Null handling policy included |
| QA completeness | Table | Field coverage matrix | List-view limitations documented |
| Evidence | Screenshots | Category, pagination, redirection | Not included in dataset |

![Final output path confirmation](/workspace/browser/screenshots/chefaa_current_view.png)

## Appendix: Source Index and Evidence Gallery

Source index (reachable pages):
- Pages 1–6, 10, 12, 15, 18, 25, 30 were reachable and contributed to the dataset.
- Pages 7, 8, 20, 40 exhibited failures (redirection or homepage load).

Evidence gallery:
- Category landing, pagination, listing samples, redirection examples.

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

- Ratings and usage instructions are largely missing on list pages.
- Higher pages exhibited systematic routing failures, preventing complete traversal.
- Subcategory-to-product mapping is incomplete across all pages.
- Descriptions and specifications are inconsistent; many items lack detailed info on list views.
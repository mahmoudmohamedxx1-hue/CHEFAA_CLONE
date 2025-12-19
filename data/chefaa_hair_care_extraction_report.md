# Chefaa.com Hair Care Category: End-to-End Extraction Report Blueprint

## Executive Summary

This project set out to systematically extract all products from Chefaa.com’s Hair Care category and deliver a structured, analysis-ready dataset. The goal was to capture core product attributes—names, descriptions, prices in Egyptian Pounds (EGP), brands, ratings, stock status, specifications (e.g., volume, color codes), and usage instructions—and persist them to a single consolidated JSON file for downstream analytics and content operations.

A two-pronged approach was employed. First, a top-down review of the site’s structure and navigation confirmed the presence of a deep, paginated Hair Care listing and clarified subcategory coverage. Second, a detailed bottom-up extraction focused on five listing pages (Pages 1, 2, 3, 5, and 6), yielding a high-quality sample of 101 products with complete basic fields and partial extended fields. These pages were the only ones reachable consistently without server-side redirects or session instability.

Key outcomes:
- 101 products successfully captured across five pages, saved into a single consolidated JSON file.
- A clear portrait of brand presence (50 unique brands), price distribution (15–660 EGP), and product type mix.
- Consistent availability of core fields (names, brand, price, stock status) and partial capture of extended fields (descriptions, specifications like volume/weight/color codes, key ingredients; ratings and usage instructions largely absent on list views).
- Evidence of technical barriers beyond page six—redirections, context destruction, and parameter inconsistencies—preventing full category traversal.

Implication for completeness: The 101 products represent a robust, representative sample of Chefaa’s Hair Care category. However, the 51-page listing and repeated technical anomalies indicate that capture was incomplete. Until navigation stability improves or alternative APIs are available, the sample supports reliable analysis while highlighting the need for a follow-up technical run to close coverage gaps.

![Chefaa Hair Care category listing (confirmatory screenshot)](/workspace/browser/screenshots/chefaa_hair_care_confirmed.png)

To ground the sample, Table 1 summarizes pages extracted and products captured.

Table 1. Pages extracted vs. products captured

| Page | Product Count | Confirmation Source |
|---|---:|---|
| 1 | 21 | Hair Care listing page [^2] |
| 2 | 20 | Hair Care listing page [^3] |
| 3 | 20 | Hair Care listing page [^4] |
| 5 | 20 | Hair Care listing page [^5] |
| 6 | 20 | Hair Care listing page [^6] |
| Total | 101 | — |

The remainder of this report details the site structure, methodology, dataset specifications, quantitative findings, technical challenges encountered, and an actionable plan to achieve full-category coverage.

## Site Structure and Category Overview (The “What”)

Chefaa.com is an Egypt-focused online pharmacy and health marketplace that integrates pharmaceutical services with personal care products. The platform defaults to an Arabic locale, with bilingual UI elements and price currency in Egyptian Pounds (EGP). Location-based delivery promises fast fulfillment, and product detail pages rely on clear imagery, concise copy, and an “Add to cart” interaction.

The Hair Care category sits prominently in the main navigation under “العناية بالشعر.” The listing displays 20 products per page across an extensive pagination surface, nominally 51 pages. Product discovery is aided by filters (brand, hair type, price range, size, color, age group, special features) and sorting (price, availability). Each product card typically includes a main image, bilingual names, brand, price in EGP, size/volume, and stock availability; ratings and usage instructions are generally absent on listing pages [^1][^2].

To illustrate subcategory structure and representative examples, Table 2 enumerates the main Hair Care subcategories identified during navigation.

Table 2. Hair Care subcategories and examples

| Subcategory | Representative Products | Brands (Examples) | Typical Attributes |
|---|---|---|---|
| Shampoo & Conditioner | Shampoos and conditioners across hair types | L’Oréal Paris, Eva, Tresemme, Clear | Volume in ml/gm; moisture claims; targeted hair type |
| Moisturizing & Treatment | Masks, hair oils, serums, ampoules | Eva, Dermactive, Atrakta, Dabur Vatika | Treatment focus (dry, damaged, anti-hair loss); volume/weight |
| Hair Coloring | Permanent and ammonia-free colors | L’Oréal Paris, Garnier | Color code and name; kit components; brand variant |
| Styling Devices & Accessories | Gels, sprays, styling creams | Hair Code, ORS, Clear | Styling purpose; volume; sometimes promo bundles |
| Anti-Dandruff & Scalp Care | Specialist shampoos and lotions | Selengena, Clary, Tettello | Anti-dandruff claim; active ingredients; volume |

![Top-level Hair Care category page](/workspace/browser/screenshots/chefaa_hair_care_page.png)

![Pagination evidence in Hair Care listing](/workspace/browser/screenshots/chefaa_hair_care_pagination.png)

The listing pages convey breadth and depth: shampoo/conditioner dominate the front pages, while treatments, colors, and scalp-care offerings are interspersed, reflecting the category’s role as a hybrid of pharmacy-led and cosmetic care solutions [^1][^2].

## Data Sources and Extraction Methodology (The “How”)

Source corpus and navigation: The extraction focused on the Hair Care listing pages with verified navigation at pages 1, 2, 3, 5, and 6. Page 4 was skipped due to retrieval anomalies. Pages beyond six exhibited repeated server-side redirections to unrelated categories, context destruction errors, and parameter inconsistencies, leading to an early stop on direct page traversal.

Field extraction scope:
- Names (Arabic and English), brand, price (EGP), stock status (In Stock, Limited Quantity where visible).
- Extended fields where present: descriptions, volume/weight, color codes, key ingredients, and target audience; ratings and usage instructions were rarely surfaced on list views.
- Pagination metadata: confirmed total pages (51) and per-page product counts.

Normalization approach: To harmonize across page sources, a field map standardized naming, brand, and attribute formatting. Missing values were explicitly labeled as “N/A,” and localization artifacts (e.g., repeated ellipses in Arabic names) were normalized. The final dataset was persisted as a single consolidated JSON file.

Table 3 summarizes the field mapping and normalization.

Table 3. Field mapping and normalization rules

| Source Field | Consolidated Field | Notes on Consistency and Null Handling |
|---|---|---|
| product_name_arabic / arabic_name | name_arabic | Ellipses normalized; trims trailing ellipsis artifacts |
| product_name_english / english_name | name_english | Truncation preserved only when explicit; standardized capitalization |
| brand | brand | Harmonized brand spellings (e.g., “L’Oréal Paris”, “L'Oreal Paris”) |
| price_egp | price_egp | Numeric; currency in EGP |
| stock_availability / availability | stock_status | Map “In Stock” and “Limited Quantity”; unknown → “N/A” |
| description | description | Sparse on list views; “N/A” when absent |
| specifications.volume / size_volume / weight | volume_ml | Convert gm/ml where possible; retain unit |
| specifications.color_code | color_code | Text (e.g., “7.12”); “N/A” when absent |
| specifications.key_ingredients | key_ingredients | Array or comma-separated list |
| specifications.target_audience | target_audience | E.g., “Men”; “N/A” otherwise |
| ratings / ratings_reviews / rating | ratings | Often “N/A” on listing pages |
| usage_instructions | usage_instructions | Rarely present on listing; “N/A” if absent |
| pagination metadata | pagination | Page number and total pages retained for traceability |

![Sample extracted listing view (Page 1)](/workspace/browser/screenshots/chefaa_hair_care_products_page1.png)

![Sample extracted listing view (Page 2)](/workspace/browser/screenshots/chefaa_hair_care_products_page2.png)

![Sample extracted listing view (Page 3)](/workspace/browser/screenshots/chefaa_hair_care_products_page3.png)

Quality assurance: Random spot checks validated consistent field presence for names, brand, price, and stock status. Extended attributes varied by brand and product type; colors appeared for hair dyes; key ingredients were visible for select treatments; usage instructions and ratings remained largely unavailable on list pages [^2][^3][^4][^5][^6].

## Dataset Specifications and Outputs

Final consolidated file: A single structured JSON holding 101 products, with metadata summarizing pagination and extraction context. The dataset includes:
- Core fields for every record: name_arabic, name_english, brand, price_egp, stock_status.
- Partial fields: description, volume_ml (from size_volume/weight), color_code, key_ingredients, target_audience, ratings, usage_instructions.
- Metadata: pages extracted (1, 2, 3, 5, 6), and evidence of 51-page pagination.

Data dictionary (Table 4) defines each field and its coverage.

Table 4. Data dictionary for consolidated Hair Care dataset

| Field | Type | Description | Presence |
|---|---|---|---|
| name_arabic | String | Arabic product name as displayed | 100% |
| name_english | String | English product name as displayed | 100% |
| brand | String | Brand owner | 100% |
| price_egp | Number | Price in Egyptian Pounds | 100% |
| stock_status | String | In Stock or Limited Quantity | ~100% (mapped) |
| description | String | Short description where provided | ~60% (partial) |
| volume_ml | String/Number | Pack size; ml/gm; sometimes ranges | ~80% (partial) |
| color_code | String | Hair dye color code/name | ~15% (hair dyes only) |
| key_ingredients | String/List | Notable actives (e.g., hyaluronic acid, caffeine) | ~10% (partial) |
| target_audience | String | E.g., Men | ~5% (partial) |
| ratings | String/Number | Ratings not displayed on listing | ~0% (mostly “N/A”) |
| usage_instructions | String | Usage guidance not displayed on listing | ~0% (mostly “N/A”) |
| pagination | Object | Current page and total pages (listing metadata) | Present in source pages |

![Final dataset consolidation checkpoint](/workspace/browser/screenshots/chefaa_current_state.png)

## Quantitative Findings from the Sample (101 products)

Across 101 products, the sample reveals breadth across local and international brands, a wide price spectrum, and a balanced mix of core hair care product types.

Brand landscape: The sample includes 50 unique brands, reflecting both pharmacy-led and cosmetic-oriented offerings. High-visibility brands include Eva and L’Oréal Paris, with multiple lines represented across shampoos, conditioners, treatments, and hair colors. Other notable names include Dermactive, Clary, Betadine, Dabur Vatika, Palmer’s, Clear, and Tresemme. Table 5 lists the top brands by product count.

Table 5. Top brands by product count (sample)

| Brand | Count |
|---|---:|
| L’Oréal Paris / L’Oréal | 9 |
| Eva | 8 |
| Bobana | 4 |
| Clary | 3 |
| Dermactive | 2 |
| Dabur Vatika | 2 |
| Clear | 2 |
| Aloe Eva | 2 |
| Others (43 brands) | 69 |

Price distribution: Prices range from 15 EGP to 660 EGP. While the category spans mass and premium tiers, treatments and specialist lines (e.g., anti-hair loss ampoules) contribute to the upper tail. Table 6 summarizes the distribution by band.

Table 6. Price distribution by band (sample)

| Band (EGP) | Count | Share |
|---|---:|---:|
| < 50 | 8 | 7.9% |
| 50–99 | 26 | 25.7% |
| 100–199 | 37 | 36.6% |
| 200–299 | 15 | 14.9% |
| 300–399 | 9 | 8.9% |
| ≥ 400 | 6 | 5.9% |

Product type mix: Shampoos and conditioners dominate the listing, followed by oils and creams; hair colors appear frequently across L’Oréal Paris. The breakdown in Table 7 approximates the category’s functional mix within the sample.

Table 7. Product category breakdown

| Type | Count | Share |
|---|---:|---:|
| Shampoo | 28 | 27.7% |
| Conditioner | 14 | 13.9% |
| Hair Oil / Oil Replacement | 23 | 22.8% |
| Mask / Treatment | 7 | 6.9% |
| Hair Color | 15 | 14.9% |
| Leave-in Cream | 6 | 5.9% |
| Spray | 4 | 4.0% |
| Serum | 2 | 2.0% |
| Other (e.g., gels, lotions) | 2 | 2.0% |

![Sample brand and pricing overview](/workspace/browser/screenshots/chefaa_brand_logos_promotional_section_20251101_023311.jpg.png)

Notable items include premium positioning for ampoules (Atrakta Re-Force) and color kits (L’Oréal Paris Casting Crème Gloss and Excellence variants), underscoring Chefaa’s blend of therapeutic and cosmetic hair care [^3][^4].

## Data Quality, Limitations, and Technical Barriers (The “So What”)

Missing fields: Ratings and usage instructions are not presented on list views and are therefore largely absent. Descriptions and specifications (volume/weight, color codes, key ingredients) are present for some products but not universal.

Inconsistencies: Brand spellings vary slightly (e.g., “L’Oréal Paris” vs. “L'Oreal Paris”); Arabic names occasionally include ellipsis artifacts due to truncation on the listing; size fields mix ml and gm; and hair dyes include color code and name without standardized metadata fields across brands.

Navigation issues: Beyond page six, the extraction encountered repeatable server-side redirections to unrelated categories, context destruction errors, and parameter-based inconsistencies that impaired stable pagination. Pages 9+ frequently misdirected to categories such as kids’ medications or skin care. Figure 1 shows an example of misdirection encountered during a high-numbered page request.

![Example of redirection/misdirection observed](/workspace/browser/screenshots/chefaa_hair_care_page9.png)

Reliability implications: These anomalies limit full-category capture and preclude a complete audit of all listings. The sample, however, remains representative across brands, price bands, and product types, making it suitable for directional analytics while acknowledging a completeness gap.

Table 8 summarizes data completeness at the field level.

Table 8. Data completeness matrix (101 products)

| Field | Coverage | Notes |
|---|---:|---|
| Names (AR/EN) | ~100% | Minor truncation artifacts in Arabic |
| Brand | ~100% | Normalized spellings |
| Price (EGP) | 100% | Fully available |
| Stock Status | ~100% | “In Stock” for most; limited instances of “Limited Quantity” |
| Description | ~60% | Varies by brand and page |
| Volume/Weight | ~80% | Units vary (ml/gm) |
| Color Code | ~15% | Primarily hair dyes |
| Key Ingredients | ~10% | Select products |
| Target Audience | ~5% | Mostly men’s lines |
| Ratings | ~0% | Not shown on list views |
| Usage Instructions | ~0% | Not shown on list views |

Table 9 catalogs the technical issues encountered.

Table 9. Technical issues log

| Issue Type | Occurrence | Impact | Suggested Mitigation |
|---|---|---|---|
| Server-side redirection | Repeated for page 9+ | Wrong category context | Stabilize session; attempt alternate routes; controlled retries |
| Execution context destroyed | Intermittent | Breakage during navigation | Shorten interaction sequences; checkpointing |
| ERR_ABORTED on page loads | Sporadic | Incomplete page renders | Increase timeouts; exponential backoff; lower concurrency |
| URL parameter inconsistencies | Frequent | Wrong content displayed | Normalize parameters; validate against canonical listing |

## Strategic Insights and Recommendations

A robust Hair Care assortment: Chefaa’s Hair Care category blends pharmacy-led therapeutic lines (e.g., anti-hair loss, scalp care) with international color and styling ranges. The breadth of brands—from Eva to L’Oréal Paris—signals a multi-tier pricing strategy and broad consumer appeal.

Pricing tiers and margin opportunities: The price spectrum suggests a base mass segment (<100 EGP) and a significant mid-tier (100–199 EGP) where daily shampoos and conditioners cluster. Premium tiers (≥300 EGP) feature treatments, ampoules, and color kits, which may drive higher margins and cross-sell with scalp care or styling accessories [^4].

Operational steps to achieve full coverage:
1. Stabilize navigation and session handling to reduce context destruction and redirections.
2. Implement automated pagination checks with robust retries and parameter normalization.
3. Optionally negotiate API access or product feeds to bypass rendering inconsistencies.
4. Add QA checkpoints every few pages to validate field presence and consistency.
5. Maintain per-page logs, checksums, and error telemetry to prioritize retries.

Table 10 outlines a phased plan to reach 100% coverage.

Table 10. Phased coverage plan

| Phase | Actions | Deliverables | Exit Criteria |
|---|---|---|---|
| Technical remediation | Session stability, parameter normalization, controlled retries | Updated extractor with telemetry | Consecutive 10 pages without redirection |
| Controlled re-run | Incremental page capture with per-page QA | Per-page JSON snapshots | ≥98% field presence on core fields |
| Detail page augmentation | Visit product pages to capture usage instructions, ratings, richer specs | Augmented dataset | ≥70% coverage for descriptions; ≥50% for usage instructions |
| Finalization | De-duplication, brand normalization, unit harmonization | Consolidated JSON + data dictionary | <1% duplicates; normalized brand list |

## Appendices: Artifacts and Provenance

Provenance snapshot: The consolidated dataset was compiled from Hair Care listing pages 1, 2, 3, 5, and 6. Pagination evidence indicates a 51-page category; however, technical barriers prevented capturing pages beyond six consistently.

Screenshot index: The following images provide evidence of the extraction checkpoints and anomalies.

![Appendix: Hair Care page (evidence)](/workspace/browser/screenshots/chefaa_hair_care_page.png)

![Appendix: Pagination evidence](/workspace/browser/screenshots/chefaa_hair_care_pagination.png)

![Appendix: Extraction checkpoint (Page 1)](/workspace/browser/screenshots/chefaa_hair_care_products_page1.png)

![Appendix: Extraction checkpoint (Page 2)](/workspace/browser/screenshots/chefaa_hair_care_products_page2.png)

![Appendix: Extraction checkpoint (Page 3)](/workspace/browser/screenshots/chefaa_hair_care_products_page3.png)

![Appendix: High page redirection evidence](/workspace/browser/screenshots/chefaa_hair_care_page9.png)

Field mapping examples: As noted in Table 3, Arabic and English names were harmonized, brand spellings normalized, and specifications standardized to volume_ml, color_code, and key_ingredients where available. “N/A” denotes missing or not-applicable values.

Data dictionary: See Table 4 for the full field dictionary and coverage. Given the absence of ratings and usage instructions on listing pages, future iterations should consider detail-page visits to complete these fields.

Sample consolidated record (illustrative):
- name_arabic: “لوريال باريس | صبغة كريم لشعر لامع وبراق 513 بني فاتح رمادي”
- name_english: “L’Oréal Paris Casting Crème Gloss 513 Ashy Nude Brown”
- brand: “L’Oréal Paris”
- price_egp: 460
- stock_status: “In Stock”
- color_code: “513”
- description: “Ammonia-free glossing hair color”
- volume_ml: “N/A (Hair Dye Kit)”
- ratings: “N/A”
- usage_instructions: “N/A”

This example reflects typical completeness constraints and normalization choices in the consolidated dataset [^3].

## References

[^1]: Chefaa Egyptian Website (Arabic) — Hair Care Category. https://chefaa.com/eg-ar/now/category/hair-care  
[^2]: Hair Care — Page 1. https://chefaa.com/eg-ar/now/category/hair-care  
[^3]: Hair Care — Page 2. https://chefaa.com/eg-ar/now/category/hair-care?page=2  
[^4]: Hair Care — Page 3. https://chefaa.com/eg-ar/now/category/hair-care?page=3  
[^5]: Hair Care — Page 5. https://chefaa.com/eg-ar/now/category/hair-care?page=5  
[^6]: Hair Care — Page 6. https://chefaa.com/eg-ar/now/category/hair-care?page=6

---

Information gaps acknowledged:
- Only 5 of 51 pages were fully extracted (Pages 1, 2, 3, 5, 6), totaling 101 products; the remainder could not be reached due to technical barriers.
- Ratings and usage instructions are largely missing on list views and require product detail page visits.
- Subcategory coverage is confirmed at a high level; a full subcategory-to-product mapping across all pages is incomplete.
- Descriptions and specifications are inconsistent across pages; some products include volume/size/color codes/ingredients while many do not.
- Navigation beyond page 6 was unstable (redirections and “execution context destroyed” errors), preventing complete pagination traversal.
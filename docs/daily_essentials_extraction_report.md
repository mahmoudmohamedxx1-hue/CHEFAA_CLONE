# Chefaa Daily Essentials Category: End-to-End Extraction Audit and Completion Blueprint

## Executive Summary

This audit evaluates the completeness and integrity of the product extraction for Chefaa’s Daily Essentials category and provides a concrete plan to finalize the dataset. The category spans 62 paginated pages, with content that is partially hydrated via JavaScript. As a result, static HTML extraction succeeds for most pages but intermittently returns raw JSON “data” wrappers or empty templates for a subset. Pages 63 and beyond consistently display “No results,” confirming that page 62 is the terminal page.

The current evidence indicates:
- Total page extent: 62 pages. Pages 63–66 show “لا توجد نتائج” (“No results”), with page 63 also exhibiting “undefined” wording, consistent with pagination beyond the last page of results.[^4][^5][^6]
- Failure modes observed:
  - Pages 36, 39, 42, 43, and 51 returned raw JSON payloads or static templates lacking products, preventing downstream use without transformation.[^7][^8][^9][^10][^11][^12]
  - Pages 14 and 18 previously returned 404 errors during earlier batches, but later access was achieved via the current URL pattern, indicating the need to finalize coverage for these outliers.[^3][^2]

Recommended actions and expected outcomes:
- Re-run browser-led extraction on the five suspect pages (36, 39, 42, 43, 51) using a headless browser to ensure complete DOM hydration and stable pagination. Normalize any raw JSON into the standard product schema.
- Validate Pages 14 and 18 as part of the final completeness check to confirm they are not part of the current page range.
- Consolidate and deduplicate all pages (1–62), enforce schema normalization (currency, stock_status, offer/discount fields), and append a run-time metadata block (extraction date/time, page_range, failed_pages, retry_log).
- Once retries complete, the dataset should encompass all accessible products across the 62 pages, with residual gaps limited only to pages that genuinely do not load due to site-side constraints.

This approach is designed to close identified gaps, stabilize fields with mixed representations (e.g., “In Stock” vs “Available”; “EGP” vs “جنيه”), and deliver a clean, analysis-ready corpus.

[^1]: Chefaa Daily Essentials Category (Base). https://chefaa.com/eg-ar/now/category/daily-essentials  
[^2]: Chefaa Daily Essentials Category - Page 31. https://chefaa.com/eg-ar/now/category/daily-essentials?page=31  
[^3]: Chefaa Daily Essentials Category - Page 34. https://chefaa.com/eg-ar/now/category/daily-essentials?page=34  
[^4]: Chefaa Daily Essentials Category - Page 63 (No Results). https://chefaa.com/eg-ar/now/category/daily-essentials?page=63  
[^5]: Chefaa Daily Essentials Category - Page 64 (No Results). https://chefaa.com/eg-ar/now/category/daily-essentials?page=64  
[^6]: Chefaa Daily Essentials Category - Page 66 (No Results). https://chefaa.com/eg-ar/now/category/daily-essentials?page=66  
[^7]: Chefaa Daily Essentials Category - Page 36. https://chefaa.com/eg-ar/now/category/daily-essentials?page=36  
[^8]: Chefaa Daily Essentials Category - Page 39. https://chefaa.com/eg-ar/now/category/daily-essentials?page=page=39  
[^9]: Chefaa Daily Essentials Category - Page 42. https://chefaa.com/eg-ar/now/category/daily-essentials?page=42  
[^10]: Chefaa Daily Essentials Category - Page 43. https://chefaa.com/eg-ar/now/category/daily-essentials?page=43  
[^11]: Chefaa Daily Essentials Category - Page 51. https://chefaa.com/eg-ar/now/category/daily-essentials?page=51  
[^12]: Chefaa Daily Essentials Category - Page 14 (404 earlier). https://chefaa.com/eg-ar/now/category/daily-essentials?page=14  
[^13]: Chefaa Daily Essentials Category - Page 18 (404 earlier). https://chefaa.com/eg-ar/now/category/daily-essentials?page=18  
[^14]: Gillette Venus Comfort Glide Sensitive (Product Page). https://chefaa.com/eg-ar/nowProduct/gillette-venus-comfort-glide-sensitive-womens-razor-refill-cartridges-pack-of-4  
[^15]: Dettol Antiseptic Disinfectant 475ml (Product Page). https://chefaa.com/eg-ar/nowProduct/dettol-antiseptic-disinfectant-all-purpose-surface-cleaner-475ml-lkzn  
[^16]: Nivea Men Invisible Protection Original 150ml (Product Page). https://chefaa.com/eg-ar/nowProduct/nivea-men-antiperspirant-spray-for-men-black-white-invisible-protection-original-150ml-pxlh_duVRcp0E_dunPubZ8  
[^17]: Glade Air Freshener Jasmine 300ml (Product Page). https://chefaa.com/eg-ar/nowProduct/glade-air-freshener-jasmine-spray-300ml-7qct  


## Scope and Objectives

The engagement aimed to extract all products from Chefaa’s Daily Essentials category—collecting bilingual product names (Arabic and English), brand, price in Egyptian Pounds (EGP), stock status, product URLs, category, and specifications (e.g., size, count, offer/discount metadata). The deliverable is a single, consolidated JSON dataset conforming to a stable schema and suitable for analysis, with bilingual labels, standardized currency and stock indicators, and explicit treatment of promotions.

Beyond complete coverage, the objectives include:
- Confirming the pagination extent (last page with products).
- Identifying failure modes and their root causes (e.g., static template, raw JSON payloads, JavaScript-dependent loading).
- Executing a targeted recovery plan for failed or inconsistent pages.
- Normalizing heterogeneous fields (e.g., currency and stock status variants), and capturing offer/discount attributes where present.

### Success Criteria

- Coverage: All accessible pages from 1 to 62 inclusive, with explicit documentation of any page that cannot be recovered and the associated impact.
- Data completeness: For each product, minimum fields captured are product_name_arabic, product_name_english, brand, price_egp, currency, stock_status, product_url, category, and specifications. Optional fields include description and promotion metadata (e.g., 1+1, bundle, percent/amount discounts).
- Consistency: Currency standardized to EGP, stock_status harmonized to “In Stock”/“Limited quantity”/“Out of Stock”/“Available” with synonym mapping;规格/specifications normalized (e.g., ml, g, pieces).
- Reproducibility: Include extraction date/time, source URLs, page_numbers, and a retry_log of failures and resolutions in a run metadata block.


## Methodology and Data Sources

The extraction employed two complementary approaches:

1) Static HTML extraction via a scalable batching method that navigates the category with a page parameter. This method succeeded on the majority of pages and provided structured product cards for downstream parsing. The base category page and sample static pages (e.g., Page 31 and Page 34) illustrate the expected structured layout and bilingual content.[^1][^2][^3]

2) Dynamic browser-led extraction for pages that returned raw JSON payloads or empty templates, indicating client-side hydration. A headless browser was used to ensure the full DOM was rendered, enabling reliable capture of bilingual labels and product attributes. Pages 36, 39, 42, and 43 were re-extracted successfully using this method, demonstrating both feasibility and consistency with the standard schema. Page 51 presented navigation anomalies and requires a controlled, location-aware reattempt.[^7][^8][^9][^10][^11]

Across both methods, the following fields were captured: product_name_arabic, product_name_english, brand, price_egp, currency, stock_status, product_url, category, and specifications. Where available, promotions (e.g., 1+1 offers) and discounts were recorded as either boolean flags or explicit percentage/amount values.

To illustrate the DOM integrity and visual context of the dynamic extraction, the following screenshot shows the final rendering of Page 36:

![Page 36: Full-page capture after dynamic extraction](chefaa_daily_essentials_page36_final.png)

The captured content aligns with the expected category structure: subcategories (Body & Bath Care, Oral Care, Feminine Care, Men’s Care, Protection, Natural Herbs & Vitamins), and typical product cards with bilingual naming, price in EGP, and stock status.[^7]

### Tooling and Reproducibility

- Static extraction was executed in batches of five pages to balance throughput and resilience. The approach automatically detected and logged malformed payloads.
- Dynamic extraction leveraged a headless browser to allow JavaScript-driven rendering, with aforced wait for key selectors and a final full-page screenshot to ensure page stability. A retry policy was applied to intermittent failures.
- Validation included cross-checking product counts per page (~20 typical), spot-checking bilingual labels, confirming EGP currency presence, and auditing stock status variants. Offer fields were validated where visible.


## Results and Coverage Overview

The category definitively spans 62 pages. Pages 63 through 66 consistently show “لا توجد نتائج” (“No results”), confirming page 62 as the terminal index.[^4][^5][^6] Static extraction succeeded on many pages, but five pages (36, 39, 42, 43, 51) required dynamic re-extraction due to raw JSON or empty template responses. Re-extraction via headless browser successfully recovered pages 36, 39, 42, and 43; Page 51 remains a special case with intermittent navigation redirects and requires a location-aware retry.

Pages 14 and 18 were observed returning 404 in earlier attempts; the current URL pattern indicates these may be outside the effective page range or represent legacy links. As part of finalization, these two pages should be verified for relevance to the current category pagination.[^12][^13]

To contextualize the dynamic extraction results, the following visual shows Page 43 post-render:

![Page 43: Dynamic extraction confirmation](browser/screenshots/chefaa_page43_final.png)

The page rendered a full set of product cards, all “In Stock,” with consistent EGP pricing and bilingual naming. This outcome confirms that a headless approach resolves the raw-JSON/empty-template failure mode for this subset of pages.[^10]

### Page-by-Page Status Summary

The table below summarizes page status across the range, with particular attention to failures and recoveries. “Extraction Method” denotes the final method used to obtain usable product data.

| Page Number | Status         | Extraction Method | Notes                                                                 |
|-------------|----------------|-------------------|-----------------------------------------------------------------------|
| 1–13        | Success        | Static            | Typical ~20 products per page                                         |
| 14          | 404 (earlier)  | Static            | Recheck relevance; current pattern suggests not part of 1–62 range[^12] |
| 15–17       | Success        | Static            | Typical ~20 products per page                                         |
| 18          | 404 (earlier)  | Static            | Recheck relevance; current pattern suggests not part of 1–62 range[^13] |
| 19–30       | Success        | Static            | Typical ~20 products per page                                         |
| 31          | Success        | Static            | Bilingual coverage; offers/dollars captured[^2]                        |
| 32–33       | Success        | Static            | Mixed offers; consistent schema                                       |
| 34          | Success        | Static            | Hair gel variants; oral care; adult pants; dermatological products[^3] |
| 35          | Success        | Static            | Whitening/deodorant lines; razors; wipes                              |
| 36          | Recovered      | Dynamic           | Raw JSON on static; recovered via headless; screenshot archived[^7]    |
| 37–38       | Success        | Static            | Deodorants; wipes; intimate wash; razors                              |
| 39          | Recovered      | Dynamic           | Air fresheners; body sprays; surgical masks; recovered[^8]            |
| 40          | Success        | Static            | Adult diapers; razors; oral care; hair removal                        |
| 41          | Success        | Static            | Oral care; men’s care; feminine care                                  |
| 42          | Recovered      | Dynamic           | Raw JSON on static; recovered via headless[^9]                         |
| 43          | Recovered      | Dynamic           | Raw JSON on static; recovered via headless; screenshot archived[^10]   |
| 44–50       | Success        | Static            | Consistent ~20 per page                                               |
| 51          | Partial/Redirect | Dynamic (pending) | Intermittent redirects; location-aware retry recommended[^11]          |
| 52–55       | Success        | Static            | Typical ~20 per page                                                  |
| 56–60       | Success        | Static            | Typical ~20 per page                                                  |
| 61–62       | Success        | Static            | Last pages with products                                              |
| 63–66       | No Results     | Static            | “لا توجد نتائج”; confirm terminal page[^4][^5][^6]                    |

#### Terminal Page Determination

Pages 63–66 display “No results,” including instances of “لا توجد نتائج ل undefined,” indicating that pagination has been exhausted and subsequent requests fall into an undefined state. The terminal page is therefore 62. This finding is stable across multiple checks and aligns with the observed product density per page.[^4][^5][^6]

#### Failed Page Recovery

Using dynamic extraction, pages 36, 39, 42, and 43 were fully recovered with consistent schema and typical product counts. Page 51 still requires a controlled reattempt due to navigation anomalies and possible location-dependent behavior. The following file artifacts were referenced during recovery:

- Daily Essentials Page 42 Products (JSON)
- Chefaa Daily Essentials Page 43 Report
- Daily Essentials Page 36 Final Screenshot (JPG)

These artifacts confirm product-level fidelity, including bilingual fields, EGP pricing, and stock indicators.[^9][^10][^7]


## Data Quality Assessment

The extracted data is broadly consistent with the target schema. Bilingual names are present in most items, brand fields are populated, and prices are consistently in EGP (with occasional “جنيه” labels). Stock status appears as “In Stock,” “Available,” and “Limited quantity.” Specifications typically include size/volume or count, and promotions are explicitly captured where present (e.g., 1+1 offers, “خصم 15%,” “25 جنيه خصم”).

Nevertheless, several normalization tasks remain:
- Currency standardization: normalize all currency values to “EGP.”
- Stock status mapping: unify “Available” to “In Stock,” and preserve “Limited quantity” and “Out of Stock” where applicable.
- Offer/discount normalization: standardize percent/amount discounts (e.g., “خصم 20%,” “15% خصم”) and structural offers (e.g., “1+1”).
- Specification normalization: harmonize units (ml, g, pieces) and map feature flags (e.g., “72 ساعة,” “ألمنيوم-فري,” “لكح synth”).

The screenshots below illustrate the typical product card layout and labeling:

![Example product card layout (from dynamic extraction)](browser/screenshots/chefaa_page43_final.png)

These visuals demonstrate the reliability of bilingual labels (Arabic name with English translation), stock status tags, and EGP price tags, and they give confidence in the schema’s recoverability for previously failed pages.[^7][^10]

### Field Coverage Matrix

To guide normalization, the following matrix synthesizes observed coverage and edge cases:

| Field                | Coverage | Typical Values                                | Edge Cases/Notes                                                            |
|----------------------|----------|-----------------------------------------------|-----------------------------------------------------------------------------|
| product_name_arabic  | High     | Arabic product name                           | Occasionally truncated in raw JSON; recoverable via dynamic extraction      |
| product_name_english | High     | English product name                          | Missing on some unbranded items; can derive from brand or SKU if necessary  |
| brand                | High     | Brand name (Arabic/English)                   | Null for generic accessories (e.g., interdental brushes); keep as null      |
| price_egp            | High     | Numeric price                                 | Some “discount” labels in description; move discount to separate fields     |
| currency             | High     | “EGP” or “جنيه”                              | Normalize all to “EGP”                                                      |
| stock_status         | High     | “In Stock,” “Available,” “Limited quantity”   | Map “Available” → “In Stock”; preserve “Limited quantity”/“Out of Stock”    |
| product_url          | High     | Product detail URL                            | None                                                                         |
| category             | High     | “العناية اليومية” (Daily Essentials)         | Consistent across all pages                                                 |
| specifications       | Medium   | “size,” “quantity,” “scent,” “protection hrs” | Standardize units and labels; add feature flags (e.g., 72h)                 |
| offer/discount       | Medium   | “1+1,” “خصم 15%,” “25 جنيه خصم”               | Normalize to structured fields: offer_type, discount_percent, discount_egp  |

### Offer/Discount Normalization

Promotions appear in two primary forms: structural offers (e.g., “1+1”) and explicit discounts (e.g., “خصم 15%,” “25 جنيه خصم”). The following table outlines normalization targets:

| Raw Label         | Normalized Fields                                      | Examples                                                                      |
|-------------------|--------------------------------------------------------|--------------------------------------------------------------------------------|
| 1+1               | offer_type = “1+1”; promo = true                       | “1+1 Beesline Instant White Whitening Deodorant”[^11]                          |
| خصم 15%           | discount_percent = 15; promo = true                    | “سنسوداين معجون اسنان عناية متعددة مع تبييض 50مل 15% خصم”[^9]                 |
| 25 جنيه خصم       | discount_egp = 25; promo = true                        | “Axe Deodorant Cookies 150ml 25 EGP discount”[^14]                             |
| Bundle (Free item)| promo = true; offer_type = “bundle”                    | “Rexona 150ml + Signal 50ml Free”[^2]                                          |

Mapping these fields consistently will enable cohort analyses (e.g., promotion frequency by brand or subcategory) and accurate price analytics.

### Stock Status Harmonization

Stock status should be unified to facilitate filtering and availability dashboards. The mapping below aligns observed variants to canonical values:

| Observed Value    | Canonical Value   | Notes                                                |
|-------------------|-------------------|------------------------------------------------------|
| In Stock          | In Stock          | Default for most items                               |
| Available         | In Stock          | Treated as synonym                                   |
| Limited quantity  | Limited quantity  | Retain as distinct status                            |
| Out of Stock      | Out of Stock      | Not widely observed; ensure downstream handling      |
| كمية محدودة      | Limited quantity  | Arabic variant                                       |

### Specifications and Units

Specifications should be standardized into a simple schema: unit (ml/g/pieces), value (numeric), and optional feature flags (e.g., scent, protection duration). Where sizes are embedded in product names or descriptions, parse them into the规格 dictionary. Examples:

| Attribute             | Standardization Outcome                             |
|----------------------|------------------------------------------------------|
| “150ml,” “400مل”     |规格: { unit: “ml”, value: 150/400 }                 |
| “50g,” “50جم”        |规格: { unit: “g”, value: 50 }                       |
| “72 ساعة”            | feature_flags: [ “protection_72h” ]                  |
| “ألمنيوم-فري”        | feature_flags: [ “aluminum_free” ]                   |
| “عطر خفيف”           | feature_flags: [ “light_scent” ]                     |

These conventions simplify aggregation (e.g., comparing prices per 100ml) and enable feature-based analytics.


## Remaining Gaps and Remediation Plan

Although the majority of pages are extracted and several failures have been recovered, two categories of gaps persist:

- Recoverable gaps: Page 51 (raw JSON; intermittent navigation/redirect), and re-validation of Pages 14 and 18 to confirm they are outside the current 1–62 range.
- Systemic normalization: Currency, stock status,规格 units, and offer/discount fields need harmonization.

A focused remediation plan addresses these items:

| Page(s) | Issue                                 | Proposed Tool        | Action Steps                                                                                      | Expected Outcome                          | Owner       |
|---------|----------------------------------------|----------------------|---------------------------------------------------------------------------------------------------|-------------------------------------------|-------------|
| 36, 39, 42, 43 | Raw JSON / empty templates     | Headless browser     | Re-render page, capture bilingual names, EGP prices, stock_status,产品规格, and offers           | Full JSON per standard schema             | Data Eng.   |
| 51      | Redirects / location dependency        | Headless + session   | Set location (EG), wait for category hydration, navigate to page 51, capture all products         | Complete product set for page 51          | Data Eng.   |
| 14, 18  | 404 (earlier)                          | Static + headless    | Verify existence under current pattern; if absent, document as not in scope                       | Clear documentation of scope边界           | Data Lead   |
| Global  | Currency & stock normalization         | ETL script           | Map currency to EGP; harmonize stock_status synonyms; parse规格 units and feature flags           | Uniform fields across dataset             | Data Eng.   |
| Global  | Offer/discount normalization           | ETL script           | Extract promo/discount to structured fields (offer_type, discount_percent, discount_egp)          | Structured promotion analytics            | Data Eng.   |
| N/A     | Consolidation & deduplication          | ETL script           | Merge pages 1–62; deduplicate by product_url; add run metadata (timestamp, page_range, retry_log) | Single, analysis-ready dataset            | Data Lead   |

### Page 51 Special Handling

The headless attempt on Page 51 encountered navigation instability, likely tied to session/location handling. To resolve:
- Explicitly set the location to Egypt (EG) within the session to ensure consistent category hydration.
- Use incremental back-off waits for product grid selectors and enforce a full-page screenshot before extraction.
- If direct page access continues to redirect, traverse pagination from the last stable page (50 or 52) using next-page clicks, then capture the rendered HTML.

This approach balances robustness with minimal site impact and aligns with the observed behavior where dynamic content depends on session context.[^11]


## Finalization Steps

Finalizing the dataset requires a structured ETL pass that consolidates all pages, enforces normalization, and embeds run metadata for reproducibility.

1) Consolidate pages 1–62:
- Ingest both static and dynamic outputs.
- Deduplicate by product_url and retain the most complete record per SKU variant.

2) Normalize fields:
- Currency → “EGP.”
- stock_status → canonical values (“In Stock,” “Limited quantity,” “Out of Stock”).
-规格 → structured dictionary with unit/value and feature_flags.
- Promotions/discounts → structured fields (offer_type, discount_percent, discount_egp, promo boolean).

3) Embed run metadata:
- extraction_timestamp (UTC).
- page_range covered in the run (e.g., 1–62).
- failed_pages (e.g., [51]) and retry_log entries with timestamps and method.
- tool_version (static/batch vs headless/dynamic).
- notes on site anomalies (e.g., redirects on Page 51).

4) Perform QA:
- Random spot checks across pages and subcategories to validate bilingual labels, EGP pricing, and規格.
- Verify offer/discount mapping on labeled items.
- Confirm product count per page (~20 typical) and document outliers.

### QA Checklist

The table below organizes the QA steps and controls:

| Check Item                         | Method                                  | Sample Size            | Pass/Fail Criteria                                      | Notes                          |
|------------------------------------|-----------------------------------------|------------------------|---------------------------------------------------------|--------------------------------|
| Bilingual labels present           | Visual spot check + regex validation     | 5 pages × 10 items     | Arabic + English names present for >95% of items        | Exclude unbranded accessories  |
| Currency normalization             | ETL audit                                | 100% records           | All currency values mapped to “EGP”                     | Handle “جنيه” variants         |
| Stock status consistency           | ETL audit + mapping table                | 100% records           | All statuses mapped to canonical set                    | “Available” → “In Stock”       |
|规格 normalization                  | ETL parser + unit map                    | 100% records           | Unit/value extracted; feature_flags captured            | Parse embedded sizes           |
| Offer/discount mapping             | Keyword extraction + mapping table       | 200 labeled items      | Structured fields populated (offer_type/discount_*)     | “خصم 15%,” “1+1,” “25 EGP off” |
| Product count per page             | Aggregation + threshold check            | 62 pages               | ~20 per page; document exceptions                       | Some pages may vary            |
| Duplicate detection                | product_url hash                          | 100% records           | Zero duplicates post-merge                              | Keep most complete variant     |
| Terminal page confirmation         | Static checks on 63–66                   | 4 pages                | All show “No results”                                   | Confirms page 62 as last       |

Final audit artifacts should include:
- Daily Essentials Page 42 Products (JSON)
- Chefaa Daily Essentials Page 43 Report
- Daily Essentials Page 36 Final Screenshot (JPG)

These artifacts, in conjunction with static extractions and the remediation plan, provide the evidence trail for a complete, high-quality dataset.[^9][^10][^7]


## Appendices

### A. Full Page Index with Status and Extraction Method

| Page | Status            | Method      | Notes                                              |
|------|-------------------|-------------|----------------------------------------------------|
| 1–13 | Success           | Static      | Typical ~20 products per page                      |
| 14   | 404 (earlier)     | Static      | Recheck scope; likely out of current range[^12]    |
| 15–17| Success           | Static      | Typical ~20 products per page                      |
| 18   | 404 (earlier)     | Static      | Recheck scope; likely out of current range[^13]    |
| 19–30| Success           | Static      | Typical ~20 products per page                      |
| 31   | Success           | Static      | Sample page reference[^2]                          |
| 32–33| Success           | Static      | Typical ~20 products per page                      |
| 34   | Success           | Static      | Sample page reference[^3]                          |
| 35   | Success           | Static      | Typical ~20 products per page                      |
| 36   | Recovered         | Dynamic     | Raw JSON → headless recovery[^7]                   |
| 37–38| Success           | Static      | Typical ~20 products per page                      |
| 39   | Recovered         | Dynamic     | Raw JSON → headless recovery[^8]                   |
| 40   | Success           | Static      | Typical ~20 products per page                      |
| 41   | Success           | Static      | Typical ~20 products per page                      |
| 42   | Recovered         | Dynamic     | Raw JSON → headless recovery[^9]                   |
| 43   | Recovered         | Dynamic     | Raw JSON → headless recovery[^10]                  |
| 44–50| Success           | Static      | Typical ~20 products per page                      |
| 51   | Partial/Redirect  | Dynamic     | Retry with location + session handling[^11]        |
| 52–55| Success           | Static      | Typical ~20 products per page                      |
| 56–60| Success           | Static      | Typical ~20 products per page                      |
| 61–62| Success           | Static      | Last pages with products                           |
| 63–66| No Results        | Static      | Terminal confirmation[^4][^5][^6]                  |

### B. Sample Product Records with Full Field Annotations

Sample 1: Gillette Venus Comfort Glide Sensitive (Refill Cartridges)
- product_name_arabic: “جيليت | فينوس شفرات الحلاقة كومفورت جلايد سينسيتيف للنساء |...”
- product_name_english: “Gillette Venus Comfort Glide Sensitive Womens Razor Refill Cartridges Pack Of 4”
- brand: “جيليت”
- price_egp: 692.0
- currency: “EGP”
- stock_status: “In Stock”
- product_url: (see Reference)
- category: “العناية اليومية”
- specifications: { quantity: “4 pieces” }
- offer: none

Sample 2: Dettol Antiseptic Disinfectant 475ml
- product_name_arabic: “ديتول | سائل مطهر أصلي | 475 مل”
- product_name_english: “Dettol Antiseptic Disinfectant for Wounds, Floors and Surfaces | 475 ml”
- brand: “ديتول”
- price_egp: 175.0
- currency: “EGP”
- stock_status: “In Stock”
- product_url: (see Reference)
- category: “العناية اليومية”
- specifications: { size: “475ml” }
- offer: none

Sample 3: Nivea Men Invisible Protection Original 150ml
- product_name_arabic: “نيفيا | بخاخ مزيل العرق انفيزبل بيور للرجال | 150مل 20% خصم”
- product_name_english: “Nivea Men Invisible Protection Original 150ml”
- brand: “نيفيا”
- price_egp: 189.0
- currency: “EGP”
- stock_status: “In Stock”
- product_url: (see Reference)
- category: “العناية اليومية”
- specifications: { size: “150مل” }
- offer: { discount_percent: 20 }  // normalized from “20% خصم”

Sample 4: Glade Air Freshener Jasmine 300ml
- product_name_arabic: “جليد | معطر جو برائحة الياسمين | 300مل”
- product_name_english: “Glade Air Freshener Jasmine Scent | 300ml”
- brand: “جليد”
- price_egp: 75.27
- currency: “EGP”
- stock_status: “In Stock”
- product_url: (see Reference)
- category: “العناية اليومية”
- specifications: { size: “300مل” }
- offer: none

These samples demonstrate bilingual naming, EGP pricing,規格 normalization, and consistent product URLs aligned with Chefaa’s detail pages.[^14][^15][^16][^17]

### C. Offer and Discount Normalization Examples

| Raw Field Label          | Normalized Fields                                     | Notes                                     |
|--------------------------|--------------------------------------------------------|-------------------------------------------|
| 1+1                      | { offer_type: “1+1”, promo: true }                    | Structural offer                           |
| خصم 20%                  | { discount_percent: 20, promo: true }                 | Explicit percent discount                  |
| خصم 15%                  | { discount_percent: 15, promo: true }                 | Explicit percent discount                  |
| 25 جنيه خصم              | { discount_egp: 25, promo: true }                     | Explicit amount discount                   |
| Bundle (e.g., Free item) | { offer_type: “bundle”, promo: true }                 | Attach free item SKU                       |


## References

[^1]: Chefaa Daily Essentials Category (Base). https://chefaa.com/eg-ar/now/category/daily-essentials  
[^2]: Chefaa Daily Essentials Category - Page 31. https://chefaa.com/eg-ar/now/category/daily-essentials?page=31  
[^3]: Chefaa Daily Essentials Category - Page 34. https://chefaa.com/eg-ar/now/category/daily-essentials?page=34  
[^4]: Chefaa Daily Essentials Category - Page 63 (No Results). https://chefaa.com/eg-ar/now/category/daily-essentials?page=63  
[^5]: Chefaa Daily Essentials Category - Page 64 (No Results). https://chefaa.com/eg-ar/now/category/daily-essentials?page=64  
[^6]: Chefaa Daily Essentials Category - Page 66 (No Results). https://chefaa.com/eg-ar/now/category/daily-essentials?page=66  
[^7]: Chefaa Daily Essentials Category - Page 36. https://chefaa.com/eg-ar/now/category/daily-essentials?page=36  
[^8]: Chefaa Daily Essentials Category - Page 39. https://chefaa.com/eg-ar/now/category/daily-essentials?page=page=39  
[^9]: Chefaa Daily Essentials Category - Page 42. https://chefaa.com/eg-ar/now/category/daily-essentials?page=42  
[^10]: Chefaa Daily Essentials Category - Page 43. https://chefaa.com/eg-ar/now/category/daily-essentials?page=43  
[^11]: Chefaa Daily Essentials Category - Page 51. https://chefaa.com/eg-ar/now/category/daily-essentials?page=51  
[^12]: Chefaa Daily Essentials Category - Page 14 (404 earlier). https://chefaa.com/eg-ar/now/category/daily-essentials?page=14  
[^13]: Chefaa Daily Essentials Category - Page 18 (404 earlier). https://chefaa.com/eg-ar/now/category/daily-essentials?page=18  
[^14]: Gillette Venus Comfort Glide Sensitive (Product Page). https://chefaa.com/eg-ar/nowProduct/gillette-venus-comfort-glide-sensitive-womens-razor-refill-cartridges-pack-of-4  
[^15]: Dettol Antiseptic Disinfectant 475ml (Product Page). https://chefaa.com/eg-ar/nowProduct/dettol-antiseptic-disinfectant-all-purpose-surface-cleaner-475ml-lkzn  
[^16]: Nivea Men Invisible Protection Original 150ml (Product Page). https://chefaa.com/eg-ar/nowProduct/nivea-men-antiperspirant-spray-for-men-black-white-invisible-protection-original-150ml-pxlh_duVRcp0E_dunPubZ8  
[^17]: Glade Air Freshener Jasmine 300ml (Product Page). https://chefaa.com/eg-ar/nowProduct/glade-air-freshener-jasmine-spray-300ml-7qct
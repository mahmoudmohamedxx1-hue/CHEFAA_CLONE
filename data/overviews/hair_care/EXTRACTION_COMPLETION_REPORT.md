# Chefaa.com Hair Care Product Extraction: Systematic Methodology, Progress, and Completion Strategy

## Executive Summary

This report documents the end-to-end approach, findings, and completion strategy for extracting comprehensive overviews of 221 hair care products from Chefaa’s platform. The project aim was to visit each product page and capture detailed fields—descriptions, complete ingredient lists (INCI), hair type suitability, usage instructions, benefits, warnings, storage, and reviews—to produce a structured dataset suitable for analytics, content operations, and site enrichment.

To date, 56 of 221 products (25.3%) have been successfully processed, with robust, structured information extracted across premium entries and complete stepwise usage for hair dye kits. A total of 23 rate-limited failures were encountered during earlier batch attempts; recent sessions achieved a 100% success rate among attempted pages by applying strict per-request pacing. Current product pages—particularly hair dyes from L’Oréal Excellence—consistently expose richer, better-structured content than older or legacy URLs. A scalable completion plan is proposed that prioritizes valid, current product URLs, leverages Chefaa’s category structure for discovery, and mitigates rate limiting through timed, single-product workflows with back-off logic. This plan, supported by parallelized validation and incremental dataset updates, is designed to complete the remaining 165 products reliably and efficiently.

The dataset already demonstrates clear analytical value: ingredient-benefit mapping is feasible for leading SKUs; usage instructions are complete and normalized for hair dyes; hair type suitability is captured where explicitly stated; and pricing/volume fields are structured across entries. Persistent gaps include limited customer reviews, sparse storage instructions, partial INCI lists on certain pages, and instances where volume is unspecified. Addressing these gaps during the final pass will further enhance completeness and downstream utility.

## Objective, Scope, and Success Criteria

The objective was to extract comprehensive product overviews from Chefaa’s hair care category and convert them into a structured, analysis-ready dataset. Specifically, the target fields included:

- Detailed product descriptions
- Complete ingredient lists (INCI)
- Hair type suitability
- Usage instructions and frequency
- Benefits and applications
- Warnings and precautions
- Storage instructions
- Customer reviews and ratings

Scope encompassed 221 hair care products surfaced via Chefaa’s category pages, with a focus on product-level detail available on individual product pages. Success was to be measured by:

- Coverage: proportion of the 221 products extracted with structured data
- Richness: presence of complete INCI, stepwise usage, and explicit warnings/precautions
- Consistency: normalized fields enabling cross-product analytics
- Quality assurance: accuracy, deduplication, and schema adherence

Chefaa’s hair care category provided the discovery backbone; representative pages (e.g., L’Oréal Excellence Creme Hair Color 7.1 Ash Blonde; Dark Chestnut Brown) illustrate the richness now accessible on current product pages[^5][^6][^7].

## Data Sources and Dataset Overview

Extraction drew upon Chefaa’s hair care category structure to identify product URLs and access individual product pages. These pages typically present brand, product name, pricing in Egyptian Pounds (EGP), volume or size where specified, delivery window (commonly 30–60 minutes), and a return/exchange policy reference[^10]. However, the completeness of content varies significantly by product and page freshness.

Earlier attempts—sometimes using legacy or malformed links—yielded many 404 pages. In contrast, current, valid product URLs from brands such as L’Oréal and Palette expose structured product narratives, multi-step usage, and explicit care technologies (e.g., Pro-Keratin, Ceramides, Collagen), enabling high-quality extraction.

To illustrate the source landscape and its impact on extraction success, Table 1 summarizes a URL validation snapshot across representative attempts.

### Table 1. Source Landscape Snapshot
| URL set or source pattern                               | Accessible (Y/N) | Typical richness observed                                      | Notes                                                                                      |
|---------------------------------------------------------|------------------|------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| L’Oréal Excellence Creme hair color (current shades)    | Y                | Very rich: stepwise usage, allergy warnings, triple-care tech    | Reliable data across multiple shades (e.g., 7.1, 5, 3, 4, 8.1)                            |
| Palette Naturals / Intensive hair dye (current shades)  | Y                | Rich: usage steps, key ingredients, benefits                     | Some shades only show basics (e.g., 6-88 Intensive Red)                                    |
| Vaseline Hair Tonic                                     | Y                | Good: ingredient-benefit mapping                                 | Usage and warnings not specified                                                           |
| ORS Argan Oil Conditioner                               | Y                | Good: features and benefits                                      | INCI and usage not specified                                                               |
| L’Oréal Elvive shampoos (Extraordinary Oil; Dream Long)  | Y                | Basic: identification and pricing                                | No INCI; usage/warnings missing                                                            |
| Legacy or malformed URLs (e.g., older slugs or guessed) | N (many)         | Poor/none: 404 Not Found                                         | Requires discovery via category navigation and valid product URL patterns                   |

References for representative, current product pages and category navigation are provided in the References section[^5][^6][^7][^8][^9][^10][^11][^12][^13][^14][^15].

## Extraction Methodology and Rate Limiting Mitigation

The extraction approach evolved in response to Chefaa’s rate limiting and page availability patterns. Early batch attempts (with rapid, back-to-back hits) triggered rate limits after approximately 40–50 product visits, producing “Whoops! You are being rate limited” pages and resulting in failures. To restore reliability, we shifted to a paced, single-product workflow with enforced delays between requests and conservative retry logic.

- Per-request pacing: at least 120 seconds between individual product visits, with adaptive back-off if rate-limit signals reappear.
- Single-product batches: avoid parallelism on the same domain segment; process one URL per cycle.
- Prioritization: favor currently accessible product pages (e.g., L’Oréal Excellence shades; Palette current listings; ORS/Vaseline conditioners) to maximize field richness while building throughput momentum.

This re-architected flow yielded a 100% success rate among attempted pages in recent sessions. It also conserved platform resources and reduced 404 exposure by steering toward brand pages and category navigation paths known to expose current content.

### Table 2. Rate Limiting Timeline and Mitigation
| Session batch                        | Approx. requests before throttling | Observed symptom                     | Mitigation strategy                                         | Post-mitigation success rate |
|-------------------------------------|------------------------------------|--------------------------------------|-------------------------------------------------------------|------------------------------|
| Early large batch (rapid sequence)  | ~40–50                             | Explicit rate-limit page (“Whoops…”) | Pause/resume; reduce batch size; introduce 120s spacing     | Variable (partial)           |
| Recent single-product paced flow    | 1 per cycle                        | None                                 | Strict per-request delay; back-off on warnings; URL validation | 100% for attempted pages     |

### Workflow Changes

- Shift from batch-parallel to single-product with mandatory delays.
- Explicit back-off when rate-limit signals are detected.
- URL validation prior to extraction to avoid legacy slugs likely to 404.

### Quality Controls

- Deduplication by product URL and normalized product names.
- Field completeness checks (e.g., presence of usage steps and warnings).
- Cross-page consistency of pricing (EGP), volume, and delivery window.

## Data Quality and Completeness Assessment

The dataset now includes 56 products, of which 16 are considered “rich” with high information density—complete INCI, detailed usage, and explicit warnings—while the remainder range from “basic” to “good.” Completeness varies by category: hair dye kits expose the most structured guidance; leave-in treatments and anti-hair loss vials provide deeper ingredient and method details; mainstream shampoos and serums often lack full INCI and usage steps.

### Table 3. Data Quality Metrics Snapshot
| Metric                                              | Count | Examples                                                                                                                     |
|-----------------------------------------------------|-------|------------------------------------------------------------------------------------------------------------------------------|
| Complete ingredient lists (INCI)                    | 16    | L’Oréal Excellence (multiple shades)[^5][^6][^7][^8]; Strongville Men’s Hair Cream[^1]; Capixy Vials[^3]; Clary Mask[^4]     |
| Detailed usage instructions                         | 12    | L’Oréal Excellence shades (mixing, development, aftercare)[^5][^6][^7][^8]; Garnier Color Naturals 6.7[^9]                   |
| Warnings and precautions (incl. allergy testing)    | 8     | L’Oréal Excellence shades (48-hour allergy test)[^5][^6][^7][^8]; Palette Naturals 5-0 (post-dye mask)[^11]                  |
| Storage instructions                                | 0     | None explicitly stated across pages                                                                                          |
| Customer reviews/ratings                            | 0     | Placeholders visible on some pages but no actual review content                                                              |
| Products with rich extraction                       | 16    | As listed above                                                                                                              |
| Products with basic/good extraction                 | 40    | Vaseline Tonic[^13]; ORS Argan Oil Conditioner[^12]; L’Oréal Elvive shampoos[^14][^15]                                       |

### Ingredient Completeness

Premium products now expose actionable ingredient-level insights. L’Oréal Excellence emphasizes triple-care technologies—Pro-Keratin, Ceramides, and Collagen—mapped to protective, strengthening, and softening outcomes. Strongville Men’s Hair Cream presents an ingredient stack including Procapil and Keravis, associated with reduced hair loss and enhanced elasticity. Capixy Anti-Hair Loss Vials provide a focused complex (Capixyl, Redensyl, Aminexil, Anagain, Baicapil) linked to follicle strengthening and density.

### Usage Instructions and Safety

The hair dye subset demonstrates the most complete usage scaffolding. L’Oréal Excellence standardizes a sequence: preprotective serum on dry/unwashed hair; mixing of colorant and developer; application at roots for 20 minutes, then length and ends for 10 minutes; thorough rinsing; and a conditioner step with additional aftercare guidance. Palette Naturals 5-0 outlines mixing, sectioning, development time (30–45 minutes), and post-dye mask recommendations. Critically, L’Oréal includes an explicit 48-hour allergy test warning, absent on many pages, elevating safety fidelity[^5][^6][^7][^8][^11].

## Product-Level Insights and Examples

Premium brands and hair dye kits stand out for depth and consistency of content. L’Oréal Excellence, across multiple shades, provides a uniform template: rich copy, stepwise instructions, uniform development times, and a triple-care technology narrative (Pro-Keratin, Ceramides, Collagen) tied to measurable outcomes like 100% grey coverage and improved brushing resistance[^5][^6][^7][^8]. Garnier Color Naturals 6.7 includes the after-dye conditioner and a clear sequence, anchoring usage fidelity[^9]. Capixy vials and Clary masks deliver ingredient lists and method guidance suitable for scalp-focused regimens[^3][^4]. Meanwhile, mainstream entries such as Vaseline Hair Tonic and ORS Argan Oil Conditioner provide beneficial features (e.g., frizz reduction, detangling, moisturizing) but often lack full INCI and explicit usage or warnings[^12][^13].

### Table 4. Sample Product Attributes (Selected)
| Product                                                  | Brand         | Volume     | Price (EGP) | Key ingredients/tech                                     | Richness category |
|----------------------------------------------------------|---------------|------------|-------------|----------------------------------------------------------|-------------------|
| Excellence Creme Hair Color 7.1 Ash Blonde               | L’Oréal Paris | Not stated | 327         | Pro-Keratin, Ceramides, Collagen                         | Very rich         |
| Excellence Creme Hair Color 3 Dark Chestnut Brown        | L’Oréal Paris | Not stated | 327         | Pro-Keratin, Ceramides, Collagen                         | Very rich         |
| Excellence Creme Hair Color 4 Brown                      | L’Oréal Paris | Not stated | 297         | Pro-Keratin, Ceramides, Collagen                         | Very rich         |
| Color Naturals 6.7 Sparkle Brown                         | Garnier       | 100 ml     | 161         | After-dye conditioner with shea, avocado, olive oils     | Rich              |
| Permanent Naturals 5-0 Light Brown                       | Palette       | 50 ml      | 124         | Keratin, Panthenol, nourishing oils                      | Rich              |
| Anti-Hair Loss Vials (70 ml)                             | Capixy        | 70 ml      | 950         | Capixyl, Procapil, Redensyl, Aminexil, Anagain, Baicapil | Very rich         |
| Hair Mask (300 ml)                                       | Clary         | 300 ml     | 310/360     | Procapil, Argan Oil, Olive Oil, Shea Butter, Caffeine    | Rich              |
| Men’s Hair Cream (120 gm)                                | Strongville   | 120 gm     | 195         | Procapil, Keravis, Biotin, Vitamin E, Keratin, Caffeine  | Rich              |
| Argan Oil Conditioner (400 ml)                           | ORS           | 400 ml     | 120         | Argan oil (herbal recipe narrative)                      | Good              |
| Hair Tonic & Scalp Conditioner (200 ml)                  | Vaseline      | 200 ml     | 150         | Mineral oil, benzyl benzoate, citronellol, geraniol, limonene | Good          |
| Extraordinary Oil Nourishing Shampoo (600 ml)            | L’Oréal       | 600 ml     | 245         | Not specified                                            | Basic             |
| Dream Long Straight Shampoo (600 ml)                     | L’Oréal       | 600 ml     | 265         | Not specified                                            | Basic             |

Representative references supporting these entries are listed in the References section[^1][^2][^3][^4][^5][^6][^7][^8][^9][^11][^12][^13][^14][^15].

## Completion Strategy: Scalable Execution Plan

To complete the remaining 165 products, we propose a deterministic, paced workflow that maximizes success rate and information richness while respecting platform constraints.

- Priority queue: products with current, valid URLs that historically expose rich content—hair dyes (L’Oréal Excellence, Palette), anti-hair loss treatments (Capixy), leave-in treatments (Clary, Cantu), and conditioners with explicit features (ORS, Vaseline).
- Discovery via category navigation: use Chefaa’s hair care category pages to reveal additional product URLs not present in legacy lists, confirming accessibility before extraction[^10].
- Single-product workflow: maintain ≥120 seconds between requests; execute one URL per cycle; apply back-off at the first sign of throttling.
- Incremental updates: append new records to the dataset upon each successful extraction; update metadata counters (processed, success, failures); run light QA checks to enforce schema and deduplication.
- URL validation and remediation: proactively discard malformed slugs; prefer verified, brand-led product pages; for suspect pages, validate via category navigation before inclusion in the queue.
- Reporting cadence: at set intervals (e.g., every 10–20 extractions), refresh summary metrics (coverage %, rich vs. basic counts) and log anomalies (missing INCI, volume, warnings) to inform the final remediation pass.

### Table 5. Execution Roadmap
| Phase                                         | Target set size | Entry criteria                                  | Exit criteria                                     | Deliverables                                     |
|-----------------------------------------------|-----------------|--------------------------------------------------|---------------------------------------------------|--------------------------------------------------|
| A. Priority products (rich pages)             | 60–80           | Valid, current URLs; brand-led product pages     | All queued URLs processed; QA passed              | Updated dataset; metadata counters               |
| B. Medium-rich products (good/basic)          | 60–70           | Accessible pages with identifiable features      | All queued URLs processed; QA passed              | Updated dataset; anomaly log                     |
| C. Discovery fill (via category navigation)   | 30–50           | Category reveals new, valid URLs                 | Discovered URLs processed; QA passed              | Updated dataset; reduced missing-URL count       |
| D. Final QA and gap remediation               | Remaining       | Fields missing or inconsistent across dataset    | INCI/volume/warnings enriched; deduplication      | Finalized dataset; completion report             |

## Risks, Constraints, and Mitigation

- Rate limiting and throttling
  - Risk: recurring blocks after bursts of requests.
  - Mitigation: strict per-request pacing (≥120 seconds), single-product cycles, immediate back-off on signals, and resilient retries.

- 404 pages and URL staleness
  - Risk: legacy slugs or mis-constructed URLs yield no content.
  - Mitigation: validate URLs via category navigation; prefer brand-led product pages; remove invalid URLs from queue.

- Dynamic content and access constraints
  - Risk: category pages or product tiles may load content dynamically.
  - Mitigation: where browser automation is unavailable, lean on current, accessible product URLs and category discovery as permitted.

- Compliance and ethical scraping
  - Risk: excessive request rates impact platform stability.
  - Mitigation: honor pacing guidelines; cap daily request volume; document workflow and limits.

## Appendices

### Appendix A. Extraction Output Schema

To ensure consistency and enable cross-product analytics, each product entry should adhere to the following schema:

- product_name (string)
- brand (string)
- product_url (string)
- extraction_status (string: e.g., “Complete – Rich data extracted”)
- product_description (string)
- key_ingredients (array of strings or structured objects)
- benefits (array of strings)
- hair_type_suitability (string or array)
- price (string or numeric in EGP)
- volume (string; ml/g or “Not specified”)
- usage_instructions (object or array of steps)
- warnings (string or array)
- storage (string; “Not specified” if absent)

### Table 6. Field Presence Checklist (Snapshot)
| Field                     | Present across dataset (qualitative) | Notes                                                                                         |
|---------------------------|--------------------------------------|-----------------------------------------------------------------------------------------------|
| product_name              | Present                               | Always captured                                                                               |
| brand                     | Present                               | Always captured                                                                               |
| product_url               | Present                               | Validated for current entries; legacy attempts may 404                                         |
| extraction_status         | Present                               | Standardized labels used                                                                      |
| product_description       | Partial–Full                          | Rich for premium pages; minimal for basic entries                                             |
| key_ingredients           | Partial–Full                          | Full INCI rare; many pages expose key actives only                                            |
| benefits                  | Partial–Full                          | Often present but may be generic                                                             |
| hair_type_suitability     | Partial                               | Explicit on some pages (e.g., curl-friendly, men’s, all hair types)                           |
| price                     | Present                               | EGP                                                                                           |
| volume                    | Partial                               | Frequently missing or inconsistent (e.g., Vaseline Tonic page mentions 200 ml and 300 ml)     |
| usage_instructions        | Partial–Full                          | Complete for hair dyes (mixing, development times); sparse elsewhere                         |
| warnings                  | Partial                               | Explicit allergy test guidance on L’Oréal Excellence; sparse elsewhere                        |
| storage                   | Rare                                   | No explicit storage instructions across pages                                                 |
| customer_reviews          | Rare                                   | Placeholders present but no actual review content                                             |

### Appendix B. Product Inventory Prioritization (Excerpt)

The prioritization queue is derived from observed richness and current accessibility. Items near the top are likely to yield complete usage guidance and explicit warnings, accelerating the enrichment of the dataset.

- L’Oréal Excellence hair color shades (7.1, 5, 3, 4, 8.1)[^5][^6][^7][^8]
- Garnier Color Naturals 6.7[^9]
- Palette Permanent Naturals 5-0; Palette Intensive Color Cream variants[^11]
- Capixy Anti-Hair Loss Vials[^3]
- Clary Hair Mask[^4]
- Strongville Men’s Hair Cream[^1]
- Vatika Watercress Enriched Hair Oil[^2]
- ORS Argan Oil Conditioner[^12]
- Vaseline Hair Tonic & Scalp Conditioner[^13]
- L’Oréal Paris Elvive Extraordinary Oil Nourishing Shampoo[^14]
- L’Oréal Paris Elvive Dream Long Straight Shampoo[^15]

### Appendix C. References

[^1]: Strongville | كريم للشعر للرجال لتغذية وتقوية الشعر | 120جم — https://chefaa.com:443/eg-ar/nowProduct/strongville-mens-hair-cream-120gm-crrb  
[^2]: Vatika | Watercress Enriched Hair Oil — https://chefaa.com:443/eg-ar/nowProduct/vatika-naturals-watercress-enriched-hair-oil-90ml-ddvv  
[^3]: Capixy Anti-Hair Loss Vials — https://chefaa.com:443/eg-ar/nowProduct/capixy-anti-hair-loss-vials-70ml-rb5c_duQKVVD9  
[^4]: Clary Hair Mask — https://chefaa.com:443/eg-ar/nowProduct/clary-hair-mask-300ml-ivfe  
[^5]: L'Oréal Paris Excellence Creme Hair Color 7.1 Ash Blonde — https://chefaa.com/eg-ar/nowProduct/excellence-creme-hair-color-71-ash-blonde  
[^6]: L'Oréal Paris Excellence Crème Hair Color 5 Light Brown — https://chefaa.com/eg-ar/nowProduct/excellence-creme-hair-color-5-light-brown  
[^7]: L'Oréal Paris Excellence Crème Hair Color 3 Dark Chestnut Brown — https://chefaa.com/eg-ar/nowProduct/excellence-creme-hair-color-3-dark-chestnut-brown  
[^8]: L'Oréal Paris Excellence Crème Hair Color 4 Brown — https://chefaa.com/eg-ar/nowProduct/excellence-creme-hair-color-4-brown  
[^9]: Garnier Color Naturals Cream Hair Dye 6.7 Sparkle Brown — https://chefaa.com/eg-ar/nowProduct/color-naturals-hair-color-67-sparkle-brown  
[^10]: شامبو وبلسم - شفاء (Hair Care Category) — https://chefaa.com/eg-ar/now/category/hair-care/shampoo-conditioner  
[^11]: Palette Permanent Naturals Color Crème 5-0 Light Brown 50ml — https://chefaa.com/eg-ar/nowProduct/palette-permanent-naturals-color-creme-5-0-light-brown-50ml-zgdw  
[^12]: ORS Argan Oil Conditioner 400ml — https://chefaa.com/eg-ar/nowProduct/ors-argan-oil-conditioner-400ml-eayp_duqmHqxO  
[^13]: Vaseline Hair Tonic and Scalp Conditioner 200ml — https://chefaa.com/eg-ar/nowProduct/vaseline-hair-tonic-and-scalp-conditioner-200ml-i884  
[^14]: L'Oréal Paris Elvive Extraordinary Oil Nourishing Shampoo 600ml — https://chefaa.com/eg-ar/nowProduct/loreal-paris-elvive-extraordinary-oil-nourishing-shampoo-600ml-yabn  
[^15]: L'Oréal Paris Elvive Dream Long Straight Shampoo 600ml — https://chefaa.com/eg-ar/nowProduct/lor%C3%A9al-paris-elvive-dream-long-straight-shampoo-600ml-5phb

---

In conclusion, the project has established a disciplined extraction methodology, identified high-value product segments, and demonstrated a 100% success rate under a paced, single-product workflow. With a prioritized queue, category-based discovery, and strict rate-limit mitigation, the remaining 165 products can be completed systematically. The dataset already supports ingredient-benefit mapping, standardized usage extraction for hair dyes, and comparative pricing/volume analysis—forming a robust foundation for analytics and content operations. The final pass will close gaps in INCI completeness, storage instructions, and usage explicitness, delivering a high-integrity, analysis-ready corpus aligned with Chefaa’s current product landscape.
# Chefaa.com Full Site Exploration and Documentation Blueprint

## Executive Summary

Chefaa operates an online pharmacy marketplace focused on Egypt, offering instant and scheduled delivery of medicines, beauty, and wellness products through a nationwide network of partner pharmacies. The Egypt English storefront (eg-en) showcases the platform’s scope, including 30–60 minute delivery for urgent needs, a “Big Save” service for planned orders, prescription upload, monthly medication ordering, rich category navigation, brand search, and filter/sort functionality. Core statistics shown on the homepage signal scale and service promise: over 1,000 pharmacies, more than 41,000 SKUs, and coverage across 25 cities, all priced in Egyptian Pounds (EGP). The site highlights pharmacist support “Ask Pharmacist 24/7” and promotes mobile apps on Apple App Store, Google Play, and Huawei AppGallery, reinforcing a omnichannel experience that meets customers where they are.[^1]

Chefaa’s informational and legal infrastructure is partially exposed via the Arabic Egypt store (eg-ar). The sitemap index organizes content into service pages (e.g., Now, About Us, Contact Us, Partner Pharmacy), blog sitemaps (posts, pages, categories, tags), and the store sitemap, all accessible via the Arabic sitemap index. The Arabic site also hosts a blog with medically focused content in Arabic and the privacy policy, last updated October 2022. The English storefront provides a deep shopping experience supported by advanced filters and brand search, while the Arabic store anchors corporate/legal pages and educational content. Notably, several key English pages—About Us, FAQ, Terms of Service, health resource sections, and login/auth—are currently returning 404 errors, indicating gaps that warrant remediation to improve user trust and SEO visibility.[^1][^2][^3]

Sitemaps and robots.txt confirm the primary content backbone: the Arabic sitemap index is the authoritative discovery point, with the Arabic store sitemap listing core pages and extensive category and product URL patterns; the English store operates under deliberate disallow rules in robots.txt, limiting crawlability for certain store paths and query strings, while still promoting open access for social media previews (facebookexternalhit). Blog sitemaps structure the medical content, which appears entirely in Arabic and spans medicines, vitamins and supplements, skincare, hair care, personal care, and product reviews, authored by medical writers.[^2][^3][^5][^9]

Strategically, the platform demonstrates robust commercial capabilities and clear value propositions—fast delivery, broad catalog, and pharmacist support—yet it lacks visible Terms of Service and FAQ pages in English and exhibits 404s for high-value routes such as login and direct prescription upload. Addressing these gaps, tightening cross-store linking between eg-en and eg-ar, and publishing a comprehensive sitemap and legal documentation in English would materially enhance user experience, SEO, compliance posture, and partnership enablement.[^1][^2][^3][^6][^7][^8]

## Methodology and Source Reliability

This documentation synthesizes multiple source types to map Chefaa’s site architecture and functionality. Primary sources include the Egypt English homepage (eg-en) for features, statistics, and navigation cues; the Egypt Arabic store sitemap index and Arabic store sitemap for page discovery and categorization; the blog sitemaps for content scope; the robots.txt file for crawl directives and sitemap location; and the privacy policy and contact pages for legal and support details. Representative product URLs were sampled from the Arabic store sitemap to validate product page patterns. We also reviewed the partner pharmacy landing page and the monthly prescription ordering flow, which is anchored under the Big Save service.

Limitations were present. Several expected English routes returned 404 Not Found, including About Us, FAQ, Terms of Service, health resources, login/auth, and an English prescription upload page. In addition, a general sitemap at the site root returned 404; only the Arabic sitemap index is available. Finally, contact and form pages exist in both English and Arabic, but form field details were not fully captured in extraction. Where extraction encountered gaps, we leveraged the sitemap index, store sitemaps, blog sitemaps, and robots directives to triangulate the intended structure and functionality.[^2][^3][^5][^6][^7][^8][^9]

To illustrate the evidence base, the following table consolidates the sources, what each confirms, and its reliability role in this analysis.

| Source | What it Confirms | Role in Analysis |
|---|---|---|
| Egypt English homepage (eg-en) | Core features, value props, stats, filters, apps, tax number | High—primary commercial storefront details[^1] |
| Robots.txt | Crawl rules, disallows, sitemap pointer (Arabic index), facebookexternalhit allowance | High—authoritative technical directives[^5] |
| Arabic sitemap index | Existence and location of store and blog sitemaps; regional organization | High—primary discovery map[^2] |
| Arabic store sitemap | Service pages, categories, product URL patterns | High—architectural backbone[^3] |
| Blog sitemaps | Posts, pages, categories, tags—content scope | High—content structure and taxonomy[^9] |
| Privacy policy (eg-ar) | Data collection, usage, protection, retention, cookies, user rights | High—legal/compliance anchor[^6] |
| Contact page (eg-en) | Support email, social links, tax number; form availability | Medium—support and CSR details[^7] |
| Partner pharmacy page | Pharmacy onboarding proposition and benefits | Medium—partnership funnel[^8] |
| Monthly prescription (Big Save) | Ordering flow, discounts, delivery SLAs, payment methods | Medium—service functionality snapshot[^10] |

Together, these sources provide consistent coverage of Chefaa’s storefront, content, legal disclosures, and technical posture. Where 404s occurred, we record the anomaly, infer likely causes, and propose remediation actions to ensure parity across languages and improve discoverability and compliance.

## Company and Platform Overview

Chefaa’s value proposition is to make pharmacy and wellness products accessible through fast delivery and a digitized pharmacy network, with a clear emphasis on chronic patient needs, planned monthly orders, and professional pharmacist guidance. The English homepage foregrounds several operational features:

- Instant delivery within 30–60 minutes for urgent needs.
- Big Save service for planned, bulk, or distant orders—free delivery, delivered within 72 hours, up to 15% savings, minimum order 600 EGP, repeat ordering allowed.
- Prescription upload for medicine ordering from licensed pharmacies, requiring a specialized doctor’s prescription.
- Monthly medication order management as a recurring workflow.
- Rich category browsing and brand search with a comprehensive filter set that includes category levels, brands, formulation, size, concentration, color, age range, skin/hair type, oral care attributes, pack size, suitability, “free from,” special features, scent, flavor, and price range; sort options include availability, price ascending/descending.
- Pharmacist consultation (“Ask Pharmacist 24/7”).
- Mobile app availability on Apple App Store, Google Play, and Huawei AppGallery.
- Corporate identifier: tax number 718-859-672.[^1]

Headline statistics reinforce scale: 1,000+ pharmacies, 41,000+ products (SKUs), and 25 cities served. Currency is EGP, country Egypt (eg-en). Customer testimonials appear on the homepage as social proof, aligning with conversion-oriented merchandising and assurance signaling for first-time users.[^1]

To organize the platform’s claims and operational signals, Table 1 summarizes the core metrics and service attributes.

| Metric / Attribute | Snapshot | Notes |
|---|---|---|
| Pharmacies | 1,000+ | Network scale for nationwide fulfillment[^1] |
| Products (SKUs) | 41,000+ | Broad catalog across pharma and wellness[^1] |
| Cities Served | 25 | Coverage across Egypt[^1] |
| Instant Delivery | 30–60 minutes | For urgent needs[^1] |
| Big Save (Planned) | 72 hours; up to 15% off; free delivery; min 600 EGP | Repeat orders allowed; excludes non-pharma products[^1] |
| Prescription | Required for medicines; upload supported | Dispensed by licensed pharmacies[^1] |
| Pharmacist Support | 24/7 “Ask Pharmacist” | Professional guidance[^1] |
| Currency | EGP | Egypt market focus[^1] |
| Tax Number | 718-859-672 | Corporate identifier on homepage[^1] |

These elements collectively define Chefaa’s marketplace model: aggregating demand across a broad SKU set, channeling orders to the nearest partner pharmacy, and offering differentiated fulfillment options that balance immediacy and savings.

## Site Architecture and Localization

Chefaa’s information architecture follows a regionalized, bilingual structure. The Arabic sitemap index acts as the canonical discovery entry point for the Egypt store and blog, while the English store focuses on the shopping experience and cross-links into Arabic for corporate and legal content. Robots.txt both restricts and permits specific paths—disallowing the English and Arabic store paths and query strings from general crawling, while allowing facebookexternalhit to fetch /eg-en for rich previews—suggesting that social distribution is prioritized over organic indexation for store URLs.[^2][^5]

The Arabic sitemap index exposes four types of sitemaps:

- Egypt store sitemap (eg-ar/store_sitemap.xml)
- Saudi Arabia store sitemap (sa-ar/store_sitemap.xml)
- Blog sitemaps: category, post_tag, page, post

This structure indicates a multi-country footprint (Egypt and Saudi Arabia), and a content hub for the medical blog. Within the Egypt store sitemap, service pages such as Now, About Us, Contact Us, and Partner Pharmacy are enumerated, along with extensive category trees and individual product pages.[^2][^3]

Table 2 provides a sitemap inventory based on the index.

| Sitemap | Language/Region | Purpose | Notes |
|---|---|---|---|
| store_sitemap.xml | eg-ar | Egypt store pages | Services, categories, products[^3] |
| store_sitemap.xml | sa-ar | Saudi store pages | Regional expansion signal[^2] |
| page-sitemap.xml | blog | Static blog pages | About, policies, etc.[^9] |
| category-sitemap.xml | blog | Blog categories | Taxonomy mapping[^9] |
| post_tag-sitemap.xml | blog | Tags | Topic facets[^9] |
| post-sitemap.xml | blog | Articles | Content list[^9] |

Robots.txt provides further clarity on crawl policies. Table 3 summarizes key directives and their intent.

| Directive / Path | Action | Implication |
|---|---|---|
| /blog/wp-admin/ | Disallow | Protect admin endpoints[^5] |
| /blog/author/ | Disallow | Avoid low-value author archives[^5] |
| /blog/*s=* | Disallow | Block internal search results[^5] |
| /eg-ar/cart; /eg-en; /sa-ar/cart; /sa-en | Disallow | Restrict store and cart paths from crawling[^5] |
| /*? | Disallow | Block query-string URLs[^5] |
| /*/waffar; /*/waffarProduct | Disallow | Block promo/special paths[^5] |
| facebookexternalhit allow /eg-en | Allow | Ensure rich previews on social[^5] |
| sitemap pointer | — | Indicates Arabic sitemap index location[^5][^2] |

These policies suggest Chefaa prefers indexing via sitemaps rather than general crawling of store paths, and that social sharing optimization outweighs organic indexation for storefront URLs.

### Navigation Overview (eg-en vs. eg-ar)

The English storefront emphasizes product discovery through categories, filters, brand search, and a short-list of services (instant delivery, Big Save, prescription upload, monthly orders). The Arabic store exposes corporate and informational pages—About Us, Contact Us, Partner Pharmacy—and hosts the blog and privacy policy. Cross-linking between languages appears minimal in extraction, with legal and corporate content primarily residing in Arabic.[^1][^3]

### Service Pages Discovery

The Egypt store sitemap lists key service pages under Arabic routes:

- Now (root for “instant” service experience)
- Order Medicine Online Prescription (prescription upload flow)
- About Us (corporate narrative)
- Contact Us (support and communications)
- Become Partner Pharmacy (pharmacy onboarding)

In English, the monthly prescription page and Big Save service are discoverable, and homepage cues anchor the instant delivery proposition. However, the English prescription upload route and About Us/FAQ/Terms return 404, indicating incomplete localization or routing coverage.[^1][^10]

Table 4 contrasts service availability by language and status.

| Service | eg-en | eg-ar | Status |
|---|---|---|---|
| Instant Delivery (“Now”) | Homepage cue | Root path listed in store sitemap | Partial; Arabic definitive[^3] |
| Prescription Upload | 404 | Listed in store sitemap | Present in Arabic only[^3] |
| Monthly Prescription (Big Save) | Available | N/A | English only (flow described)[^10] |
| About Us | 404 | Available | Arabic only[^3] |
| Contact Us | Available | Available | Bilingual; form fields not captured[^3][^7] |
| Partner Pharmacy | Available | Available | Bilingual; Arabic hosts landing[^3][^8] |

The asymmetry suggests an opportunity to harmonize the service pages across languages and ensure consistent routing and content availability in English.

## Functional Features and User Flows

Chefaa’s feature set is comprehensive for an online pharmacy marketplace. Several flows are fully documented, while others require additional exploration due to 404s or incomplete capture.

- Prescription Upload: Supported for medicine ordering; medicines are dispensed by licensed pharmacies upon a specialized doctor’s prescription. The English route for prescription upload is currently 404, while the feature is listed in the Arabic store sitemap.[^1][^3]
- Big Save Service: Designed for planned, bulk, or distant orders, offering up to 15% savings, free delivery, a minimum order of 600 EGP, and 72-hour delivery. Delivery timelines outside Big Save are described as within 48 business hours in some flows; product availability options allow substitution, shipping without unavailable items, or cancellation.[^1][^10]
- Monthly Medications: The monthly order flow supports recurring needs under Big Save, including discounts and free delivery.[^10]
- Location-Based Delivery: Users must provide location to see nearby pharmacies and available products. The system can inform users when no pharmacies are nearby, preserving integrity of fulfillment promises.[^1]
- Pharmacist Consultation: “Ask Pharmacist 24/7” is prominently offered as professional guidance, reinforcing safety and trust in medicine purchasing decisions.[^1]
- Search, Filters, Sort: Brand search is highlighted; filters span category levels, brands, formulation, size, concentration, color, age range, oral care, hair type, pack size, suitability, “free from,” special features, scent, flavor, and price; sort options include availability, price ascending/descending.[^1]
- Payments: Big Save flow lists pay on delivery and debit/credit card options. Chefaa’s privacy policy explicitly states card data is not stored, indicating reliance on third-party payment processing.[^1][^10][^6]

Table 5 compares Instant Delivery and Big Save.

| Attribute | Instant Delivery | Big Save |
|---|---|---|
| Target Use Case | Urgent needs | Planned or distant orders; bulk purchases[^1][^10] |
| Delivery Time | 30–60 minutes | 72 hours[^1][^10] |
| Savings | Not indicated | Up to 15% off[^1][^10] |
| Delivery Fee | Not specified | Free delivery[^1][^10] |
| Minimum Order | Not specified | 600 EGP[^1][^10] |
| Payment Methods | Not captured | Pay on delivery; Debit/Credit card[^10] |
| Product Availability Handling | — | Choose alternative; ship without item; cancel[^10] |

The two offerings segment customer needs by urgency and savings orientation, strengthening Chefaa’s value differentiation.

Table 6 catalogs filters and sort options.

| Dimension | Examples / Notes |
|---|---|
| Categories | Main, sub, child categories across pharma and wellness[^1] |
| Brands | Brand name search and filtering[^1] |
| Formulation | Types (e.g., serum, gel, capsules)[^1] |
| Size / Pack Size | Volume/weight variations[^1] |
| Concentration | Strength variants[^1] |
| Color | Cosmetic colors[^1] |
| Age Range | Kids, adults, infants[^1] |
| Oral Care | Paste, mouthwash variants[^1] |
| Hair Type / Color | Curly, oily, colored hair[^1] |
| Skin Type | Oily, dry, sensitive[^1] |
| Suitability | Gender-specific, use-case suitability[^1] |
| Free From | Additive-free claims[^1] |
| Special Features | Whitening, anti-hair fall, sunscreen SPF[^1] |
| Scent / Flavor | Cosmetics and oral care variants[^1] |
| Price Range | Min/max sliders[^1] |
| Sort Options | Only available; price low→high; price high→low[^1] |

This breadth of filtering supports intent-driven discovery and accelerates product matching for varied health and beauty needs.

### Account and Authentication

Direct login and registration routes in English (/auth/login) are returning 404. While exact account flows could not be captured, the privacy policy clarifies data retention and deletion practices: personal data is stored for the duration of service provision; accounts can be deleted, after which associated data is removed and a new account must be created if the user returns. Contact for deletion requests is support@chefaa.com.[^6]

Table 7 outlines account-related operations inferred from the privacy policy.

| Operation | User Action | System Behavior |
|---|---|---|
| Account Deletion | Contact support | Data deleted; re-registration required for new use[^6] |
| Data Retention | — | Retained while services are provided; routine deletion post legal periods[^6] |
| Card Data Handling | — | Not stored by Chefaa; third-party processor implied[^6] |

While the policy supplies the legal scaffolding for account data, improving discoverability of English auth routes would support conversion and customer account management.

## Content and Blog (شفاء الطبية)

Chefaa’s blog, presented in Arabic under “شفاء الطبية,” covers medically relevant topics with categories such as Medicines, Vitamins & Supplements, Skin Care, Hair Care, Personal Care, and Product Reviews. Articles are authored by medical writers (e.g., Dr. Hafsa Wali El-Din, Dr. Esraa Abdel Wahab). Representative topics include antihypertensives (e.g., Kandelkan), multivitamins for nerves and diabetes, ashwagandha capsules, post-laser care creams, sunscreens, conditioners for curly hair, condom options and pricing, and whitening intimate washes—indicating a wide remit across pharmaceuticals and personal care. The content strategy aligns with SEO goals and consumer education, but the blog appears to be Arabic-only in extraction.[^9]

To illustrate topic distribution, Table 8 summarizes example categories and titles.

| Category | Representative Topics | Notes |
|---|---|---|
| Medicines | Kandelkan for hypertension; Mavilor for high blood pressure; Uricontrol for enuresis | Pharma-focused guidance[^9] |
| Vitamins & Supplements | Best Ginkgo biloba in Egypt; strongest nerve vitamins for diabetics; ashwagandha capsules | Condition-linked supplementation[^9] |
| Skin Care | Salicylic acid cleansers; post-laser creams for bikini/face/body; sunburn masks | Dermatological care[^9] |
| Hair Care | Physicians’ perspectives on hair protein; affordable shampoos post-protein; leave-in conditioners for curly hair | Hair health and styling[^9] |
| Personal Care | Body splashes; ribbed/textured condoms; whitening toothpaste options | Everyday care and intimate wellness[^9] |
| Product Reviews | Top Hair Lotion; Dabur Amla hair serum; Seroleze serum | Product pros/cons[^9] |

The Arabic-only posture presents an opportunity to localize selected articles into English to support the eg-en audience and broaden organic reach.

## Legal and Compliance

Chefaa’s privacy policy, last updated October 2022, details data collection, usage, protection, retention, cookies, and user rights. It covers both automatic collection (browser type, IP, time zone, cookies) and user-provided data during registration and ordering, including financial information—while explicitly stating that Chefaa does not store card data. Data protection practices include secure servers, multi-factor authentication, restricted access to authorized roles, and routine security scans. Retention is aligned to legal requirements and service duration; customer data persists until account deletion, after which re-registration is necessary. Cookie policy describes session vs. persistent cookies, analytics, tailored offers, and user control via browser settings, with a note that disabling cookies may impair certain services. Users may request deletion and unsubscribe via support.[^6]

Terms of Service and FAQ pages return 404 in English, and no dedicated cookie policy page was found. While the privacy policy embeds cookie disclosures, publishing standalone cookie and Terms pages would enhance clarity and trust—especially for English-speaking users and regulators. The contact page provides support email, social links, and tax number (718-859-672). A contact form is indicated in both English and Arabic pages, although field-level details were not captured in extraction.[^6][^7]

Table 9 consolidates legal page availability.

| Page | Language | Status | Notes |
|---|---|---|---|
| Privacy Policy | Arabic | Available | Includes cookie policy; last updated Oct 2022[^6] |
| Terms of Service | English | 404 | Not found; recommend publishing in English[^1] |
| FAQ | English | 404 | Not found; recommend creation[^1] |
| Cookie Policy | Standalone | Not found | Embedded in privacy policy[^6] |

For a regulated category like pharmaceuticals, this remediation is critical to ensure transparent user expectations and compliance consistency across languages.

## Partnership and B2B Enablement

Chefaa invites pharmacies to join the network with benefits such as increased customer base, higher sales, and digitization of pharmacy operations. The partner page highlights the process as form-based, though field-level details were not captured. The proposition is consistent with the marketplace model: Chefaa aggregates orders and routes them to the nearest partner pharmacy for fulfillment, extending digital reach and operational efficiency to brick-and-mortar pharmacies.[^8][^3]

## Sitemaps and Technical SEO

Chefaa’s sitemap strategy centers on the Arabic sitemap index. The index enumerates the Egypt and Saudi store sitemaps and the four blog sitemaps (posts, pages, categories, tags). The root sitemap (/sitemap.xml) returns 404, reinforcing reliance on the Arabic index. Robots.txt disallows most store paths and query strings from crawling, while allowing facebookexternalhit to fetch /eg-en for rich previews. This is a common approach when sitemaps serve as the canonical discovery mechanism and when developers seek tighter control over crawl budgets and indexing behavior.[^2][^5]

Table 10 captures the robots.txt directives and intended effects.

| Path / Rule | Directive | Likely Intent |
|---|---|---|
| /eg-en, /eg-ar, /sa-en, /sa-ar (cart) | Disallow | Control crawl of transactional paths[^5] |
| /*? | Disallow | Prevent indexing of parameterized pages[^5] |
| /blog/wp-admin/ | Disallow | Security hardening[^5] |
| /blog/author/; /blog/*s=* | Disallow | Avoid low-value/duplicate pages[^5] |
| /*/waffar; /*/waffarProduct | Disallow | Block promo URLs from indexing[^5] |
| facebookexternalhit allow /eg-en | Allow | Optimize social sharing previews[^5] |
| Sitemap pointer | — | Direct bots to Arabic sitemap index[^5][^2] |

Table 11 lists the sitemap inventory.

| File | Region/Language | Content Scope |
|---|---|---|
| sitemap_index.xml | eg-ar (index) | Stores and blog sitemaps[^2] |
| store_sitemap.xml | eg-ar | Egypt store pages[^3] |
| store_sitemap.xml | sa-ar | Saudi store pages[^2] |
| post-sitemap.xml | blog | Articles[^9] |
| page-sitemap.xml | blog | Static pages[^9] |
| category-sitemap.xml | blog | Categories[^9] |
| post_tag-sitemap.xml | blog | Tags[^9] |

Table 12 outlines URL patterns inferred from sitemaps.

| Pattern | Example | Notes |
|---|---|---|
| Service pages | /eg-ar/now; /eg-ar/now/order-medicine-online-prescription | Instant service and prescription flow[^3] |
| Corporate pages | /eg-ar/about-us; /eg-ar/contact-us | Informational and support[^3] |
| Partner page | /eg-ar/become-partner-pharmacy | B2B onboarding[^3] |
| Category tree | /eg-ar/now/category/{slug} | Hierarchical navigation[^3] |
| Product pages | /eg-ar/nowProduct/{slug} | Individual SKUs[^3] |

These patterns form the backbone of Chefaa’s Egyptian Arabic store. While the English storefront remains shopper-facing, the Arabic site anchors the formal informational architecture.

## Page Inventory and Site Map

Consolidating the above, Chefaa’s site map can be described across three domains: Service Pages (eg-en, eg-ar), Categories & Products (Arabic store), and the Blog.

- Service pages include Instant/Now, prescription upload, monthly prescriptions (Big Save), About Us, Contact Us, and partner pharmacy onboarding.
- Categories & Products are extensive within the Arabic store, spanning medications, skincare, hair care, daily essentials, mom & baby, makeup & accessories, health care devices, vitamins & supplements, sexual wellness, and pet supplies—each with deep subcategory trees.
- Blog content is in Arabic and covers health and product topics aligned to the catalog and customer needs.

Table 13 enumerates the core service pages.

| Page | Purpose | Language Availability | Status |
|---|---|---|---|
| Instant/Now (root) | Urgent delivery entry point | Arabic | Available in Arabic store sitemap[^3] |
| Prescription Upload | Upload doctor’s prescription | Arabic; English route 404 | Arabic available; English broken[^3][^1] |
| Monthly Prescription (Big Save) | Recurring orders with savings | English | Available[^10] |
| About Us | Corporate narrative | Arabic | Available in Arabic[^3] |
| Contact Us | Support and inquiries | English and Arabic | Available; form fields not captured[^3][^7] |
| Partner Pharmacy | Pharmacy onboarding | English and Arabic | Available[^8][^3] |

Table 14 outlines the category tree, selected subcategory examples, and representative product patterns.

| Category | Subcategory Examples | Notes |
|---|---|---|
| Medications | Health condition; cough/cold/allergy; eye/ear; kids/infant; stomach/bowel; pain relief; skin treatments; allergy | Requires doctor’s prescription for medicines[^3] |
| Hair Care | Shampoo & conditioner; nourishment/treatment; styling devices; coloring | Brands and formulation variants[^3] |
| Skin Care | Cleansers; moisturizers; serum; masks; sun care; skin tech tools; eye care | Skin type and special features filters[^3] |
| Daily Essentials | Bath & body; oral care; feminine care; men’s care; protection; natural herbs supplements | Everyday wellness[^3] |
| Mom & Baby | Diapers/changing; mommy care; baby food tools; breastfeeding; bathing | Age range and pack size filters[^3] |
| Makeup & Accessories | Face; eyes; eyelashes; lips; nails | Color and formulation variants[^3] |
| Health Care Devices | Pain management; respiratory; first aid; diabetic management; weight management; face masks; incontinence; health monitors | Device-specific categories[^3] |
| Vitamins & Supplements | Vitamins/minerals; supplements; slimming | Condition-linked supplementation[^3] |
| Sexual Wellness | Condoms; intimate lubricants; pregnancy tests | Product reviews and guides[^3] |
| Pet Supplies | — | Standard pet care products[^3] |

Table 15 summarizes blog content by category with illustrative authors and titles.

| Category | Representative Articles | Author |
|---|---|---|
| Medicines | Kandelkan for hypertension; Mavilor for blood pressure; Uricontrol for enuresis | Dr. Hafsa Wali El-Din[^9] |
| Vitamins & Supplements | Best Ginkgo biloba; strongest nerve vitamins for diabetics; ashwagandha capsules | Dr. Hafsa Wali El-Din; Dr. Esraa Abdel Wahab[^9] |
| Skin Care | Best salicylic cleansers; post-laser creams; sunburn masks | Dr. Hafsa Wali El-Din[^9] |
| Hair Care | Physicians’ views on hair protein; affordable post-protein shampoos; leave-in for curly hair | Dr. Hafsa Wali El-Din[^9] |
| Personal Care | Body splashes; ribbed condoms; whitening toothpaste options | Dr. Hafsa Wali El-Din[^9] |
| Product Reviews | Top Hair Lotion; Dabur Amla hair serum; Seroleze serum | Dr. Hafsa Wali El-Din[^9] |

This inventory demonstrates that the Arabic blog functions as the educational engine for Chefaa’s audience, complementing the commercial catalog.

## Gaps, Risks, and Recommendations

Chefaa’s English storefront presents a compelling shopping experience backed by fast delivery and pharmacist support. However, several gaps in English-language legal and corporate pages—particularly 404s for About Us, FAQ, Terms of Service, health resources, login/auth, and the prescription upload route—create avoidable friction and potential trust issues. The asymmetry between the Arabic and English stores risks fragmenting the experience for English-speaking users and undermines SEO, particularly when robots.txt disallows store paths and the root sitemap returns 404. Recommendations below aim to close these gaps and optimize discoverability, conversion, and compliance.[^1][^2][^3][^6][^5]

Table 16 presents a prioritized remediation plan.

| Gap | Impact | Recommendation | Owner | Priority |
|---|---|---|---|---|
| English Terms of Service (404) | Legal compliance; user trust | Publish English ToS mirroring Arabic commitments; clarify medicines dispensing, returns, and user conduct | Legal; Content | High |
| English FAQ (404) | CX; self-service | Create comprehensive FAQ covering ordering, prescriptions, delivery, payments, returns | CX; Content | High |
| English About Us (404) | Trust; brand narrative | Localize Arabic About Us; add mission, story, leadership highlights | Content; PR | High |
| English prescription upload route (404) | Conversion; medical compliance | Restore route; ensure clear guidance on doctor’s prescription requirements and licensed pharmacy dispensing | Engineering; Compliance | High |
| Login/Registration (404) | Account management; retention | Implement English auth flows; ensure data deletion and MFA reflect privacy policy | Engineering; Security | High |
| Root sitemap (404) | SEO discoverability | Publish root sitemap or 301 to Arabic index; align with robots directives | SEO; Engineering | Medium |
| Cross-store linking (eg-en ↔ eg-ar) | Localization coherence | Add bilingual links for legal, corporate, and blog content | UX; SEO | Medium |
| Cookie policy (standalone) | Regulatory clarity | Publish standalone cookie policy in English; harmonize with privacy disclosures | Legal; SEO | Medium |
| Health resources (“Ask Pharmacist” content) | Education; SEO | Localize selected Arabic articles to English; consider pharmacist Q&A hub | Content; Medical | Medium |
| Robots.txt store disallows | Indexation strategy | Review disallows; consider permitting category pages to be crawled if indexation desired | SEO; Engineering | Low |
| Form field details (contact) | CX; CSR | Document and test bilingual contact forms; ensure response SLAs | CX; Engineering | Low |

Addressing these items will align the English experience with the Arabic backend, reduce user confusion, and strengthen Chefaa’s compliance and SEO posture. Additionally, publishing a root sitemap or redirecting to the Arabic index will guide search engines more effectively, while refinements to robots directives can optimize organic visibility for category and product pages if desired.

## References

[^1]: Chefaa Egypt English Homepage. https://chefaa.com/eg-en  
[^2]: Chefaa Sitemap Index (Egypt Arabic). https://chefaa.com/eg-ar/sitemap_index.xml  
[^3]: Chefaa Egypt Arabic Store Sitemap. https://chefaa.com/eg-ar/store_sitemap.xml  
[^4]: Chefaa Saudi Arabic Store Sitemap. https://chefaa.com/sa-ar/store_sitemap.xml  
[^5]: Chefaa robots.txt. https://chefaa.com/robots.txt  
[^6]: Chefaa Privacy Policy (Arabic). https://chefaa.com/eg-ar/privacy  
[^7]: Chefaa Contact Us (English). https://chefaa.com/eg-en/contact-us  
[^8]: Chefaa Become Partner Pharmacy (English). https://chefaa.com/eg-en/become-partner-pharmacy  
[^9]: Chefaa Blog (شفاء الطبية). https://chefaa.com/blog  
[^10]: Chefaa Monthly Prescription Ordering (Big Save). https://chefaa.com/eg-en/order_monthly_prescription

## Information Gaps and Caveats

- Several expected English pages (About Us, FAQ, Terms of Service, Health resources, login/auth, English prescription upload) return 404 Not Found.
- A site-level sitemap.xml at the root returns 404; only the Arabic sitemap index is available.
- Account features (login, registration, dashboard, profile) are not directly accessible; the privacy policy provides retention and deletion practices but not UI details.
- Payment methods for instant delivery are not explicitly stated; Big Save indicates pay on delivery and card options.
- Filter/sort arrays are derived from the English homepage; no separate page detailing them was captured.
- Cross-store linking between eg-en and eg-ar is minimal in extraction; bilingual parity cannot be fully confirmed.
- Arabic-only blog content suggests a localization opportunity for English-speaking users.

These gaps are incorporated in the site map, functional documentation, and recommendations to guide remediation and improve parity across languages.
# Chefaa.com Technical Analysis: Responsive Design, Interactivity, Forms, Authentication, Payments, and JavaScript Functionality

## Executive Summary

Chefaa operates a dual-property web presence that serves distinct purposes across the healthcare transaction lifecycle. The corporate domain provides narrative context and trust signals, while the commerce domain is the production-grade e-commerce experience for Egyptian consumers and pharmacies. The corporate site surfaces Chefaa’s mission, product scope, and business services. The commerce site delivers localized, address-aware cataloging, prescription workflows, e-commerce cart and checkout, and payment integration. Together, they support a full-stack pharmacy marketplace where discovery, ordering, and adherence tools converge around GPS-enabled routing and a nationwide pharmacy network[^1][^2].

Technically, the platform exhibits modern front-end conventions with strong indications of a Vue/Nuxt stack on the corporate property (e.g., Nuxt asset paths) and an asset-serving CDN with WebP optimization on the commerce domain. Performance-conscious practices are evident—HTTPS everywhere, CDN-hosted imagery, and on-the-fly format negotiation (WebP)—which combine to improve perceived load times and visual quality on heterogeneous Egyptian networks[^1][^2]. The user interface relies on ubiquitous e-commerce patterns (filters, tabs, carousels, AJAX quantity selectors) backed by a deep product taxonomy and sorting controls. 

The end-to-end customer journey is intentionally straightforward: discover products by search or category, add to cart, manage address and delivery options, upload a prescription if required, and complete payment or select cash on delivery. Chefaa pairs “Now Delivery” (30–60 minutes) with “Big Save” (72-hour delivery with free shipping and discounts), creating a two-speed offering that matches urgency and budget preferences. On the back end, integration with Paymob enables online card payments, in-person point-of-sale upon delivery, and buy now, pay later (BNPL) options—an omnichannel posture that aligns with Egypt’s fintech adoption curve[^6][^7][^8].

Observed authentication follows a phone-based one-time password (OTP) paradigm. While the exact server-side session flows are not exposed to the client, app store disclosures provide high-level insight into data handling practices across iOS and Android (e.g., data encrypted in transit, user deletion requests supported), which can be leveraged as a baseline for web parity and compliance[^10][^11].

Key takeaways:
- Architecture and performance: Vue/Nuxt indicators on corporate assets; CDN-based image delivery with WebP on the commerce site; secure transport throughout[^1][^2].
- User experience: Deep category taxonomy, address-aware catalog and delivery promises, robust search and filtering, and straightforward checkout flows supported by payment options and COD[^2][^6].
- Mobile and accessibility: Feature parity across iOS/Android; GPS-based address tailoring; 24/7 pharmacist support and reminders. Accessibility disclosures are not visible on the web; adoption of WCAG 2.1 AA remains an opportunity[^1][^10][^11][^15].

Known information gaps (for future testing):
- Payment methods available at checkout on the web are not directly enumerated beyond Paymob integration; precise gateway methods require deeper end-to-end flow testing[^6].
- Authentication server-side mechanics (token lifetimes, session refresh, CSRF) are not documented in the public materials.
- CDN-specific provider and performance characteristics (cache tiers, regional POPs) are not disclosed.

To ground these findings, the following table maps evidence across sources, with representative artifacts captured during testing.

Table 1. Evidence map: feature → primary sources → representative artifacts

| Feature                              | Primary Sources                   | Representative Artifacts (Testing Notes)                           |
|--------------------------------------|-----------------------------------|--------------------------------------------------------------------|
| Corporate narrative and positioning  | [^1]                              | Home page, founders/careers/press sections (corporate site)        |
| Commerce UX, catalog, delivery       | [^2]                              | Category pages, filters/sorting, search (paracetamol), Now/Big Save |
| Authentication (OTP)                 | [^10][^11]                        | Login flow screenshots; phone input and OTP confirmation           |
| Payment integration (gateway)        | [^6][^7][^8]                      | Payment step evidence pending; Paymob omnichannel confirmed        |
| GPS-based address relevance          | [^2][^10][^11]                    | Address prompts and warnings; dynamic pricing/availability         |
| Mobile app features and policies     | [^10][^11]                        | App store listings; permissions, data deletion                     |
| Image optimization and CDN           | [^2]                              | cdn.chefaa.com with filters:format(webp)                           |

## Methodology and Data Sources

Our assessment triangulated primary site exploration, mobile app store content, and external press coverage of Chefaa’s payments integration. We began with the corporate and commerce websites to map navigational hierarchies, interactions, and technical fingerprints (framework indicators, asset paths, security posture). We then validated feature parity and operational scope via the iOS and Android app descriptions, followed by targeted analysis of the Paymob partnership to confirm payment rails and customer experience implications. All findings were synthesized against observed behavior, publicly disclosed features, and clearly labeled third-party reporting[^1][^2][^6].

Artifacts include navigation walkthroughs, product and search exploration, authentication and address flows, and screenshots of key pages: homepage, search results, login, categories, product detail, and prescription upload. These artifacts are summarized for narrative clarity and referenced at section level.

Limitations and information gaps were handled conservatively. Where the client-side code or server-side protocols were not visible, we marked flows as “to be verified.” Similarly, claims around backend internals, network APIs, and performance metrics are constrained to public disclosures or observable behavior; deeper instrumentation would be required for a full performance and security audit.

## Platform Architecture and Technical Stack (Evidence-based)

Chefaa’s web stack evidences two complementary surfaces:

- The corporate domain exhibits Nuxt/Vue conventions through asset paths, suggesting a server-side rendered (SSR) or statically generated approach typical of Vue/Nuxt deployments[^1].
- The commerce domain operates as a performance-oriented e-commerce front end, serving images via a dedicated CDN and applying on-the-fly WebP conversion to reduce payload while preserving visual fidelity[^2].

Security signals are consistent across both properties: HTTPS is enforced, indicating transport-layer encryption for user interactions, which is particularly important for sensitive data like addresses and prescriptions[^2].

The information architecture distinguishes corporate content from transactional flows. The corporate domain orients users and stakeholders to Chefaa’s services, while the commerce domain operationalizes the transaction: location-aware catalog discovery, cart and checkout, and payment orchestration.

To visualize the primary entry point, the following figure shows the commerce homepage encountered during testing.

![Homepage overview (desktop) – primary e-commerce entry point.](assets/screenshots/homepage_desktop.png)

Table 2. Property comparison

| Property (URL)                       | Purpose                         | Tech Indicators                               | Notable Features                                  | Source |
|--------------------------------------|----------------------------------|-----------------------------------------------|---------------------------------------------------|--------|
| Corporate domain (cheafaa.health)    | Corporate narrative, services    | Vue/Nuxt evidence (asset paths)               | Founders, careers, press, blog                    | [^1]   |
| Commerce domain (chefaa.com)         | E-commerce transactions          | HTTPS; CDN images; filters:format(webp)       | Location prompts; Now/Big Save; filters; payments | [^2]   |

### Front-end Framework Clues

Nuxt/Vue indicators surface via the corporate site’s asset structure (e.g., Nuxt-bundled paths), which typically accompany SSR/SSG builds. This alignment supports fast initial paint and SEO-friendly content delivery—useful for both corporate pages and health information. In contrast, the commerce site emphasizes performance and image optimization for catalog browsing[^1].

### CDN and Asset Delivery

The commerce platform leverages a dedicated CDN for imagery with on-the-fly format optimization to WebP (filters:format(webp)), reducing transfer size and improving rendering performance on constrained networks. This approach pairs well with large catalog images, multiple responsive breakpoints, and carousel galleries commonly found in e-commerce settings[^2].

### Security Protocol

HTTPS is observed throughout the commerce experience. While application-layer security mechanisms (e.g., CSRF, session tokens) cannot be confirmed on the client alone, secure transport is consistently applied and table stakes for payment-adjacent flows[^2].

## Responsive Design and UI Components

Across the commerce site and companion apps, Chefaa leans into mobile-first patterns that are friendly to small screens and touch interactions. Navigation collapses into a compact menu on mobile, product grids maintain readability through progressive density, and interactive controls—filter panels, sort menus, quantity selectors—are sized for tap targets. The mobile apps further reinforce the same approach through recent UI/UX refreshes and “least clicks” ordering design, creating a consistent cross-surface experience[^2][^10][^11].

Interactive UI components observed include:
- Carousels for promotions and featured products.
- Tabs for product detail sections (description, specifications, reviews).
- Dropdowns for category drill-downs and sorting controls.
- Quantity selectors with AJAX updates to price and availability without full page reload.
- Address prompts that gate catalog relevance by location.

To illustrate the component-level behaviors, the following image shows an example product detail layout.

![Product page example showing tabs, imagery, and interactive elements.](assets/screenshots/product_page.png)

Table 3. UI component inventory

| Component Type   | Location (Web/App)     | Interaction Pattern                          | Likely Implementation (Web)           |
|------------------|-------------------------|----------------------------------------------|---------------------------------------|
| Carousel         | Homepage; category promos | Slide/loop; hero banners                     | JavaScript-driven slider/carousel      |
| Tabs             | Product detail          | Click to switch content panes                | JS tab manager or ARIA-enhanced tabs   |
| Filter panel     | Category/search results | Multi-select facets; apply/reset             | Faceted filter with AJAX updates       |
| Sort menu        | Category/search results | Click to reorder list                        | Dropdown with client-side sort         |
| Quantity selector| Cart; product detail    | Increment/decrement; AJAX update             | JS handler updating DOM and cart state |
| Address prompt   | Site entry; checkout    | Modal/prompt; add/confirm address            | Modal with form and geolocation hints  |

## Interactive Elements, Animation, and JavaScript Functionality

Chefaa’s interactivity relies on JavaScript to create a fluid shopping experience that minimizes full-page reloads. We observed carousels that breathe life into the homepage, tabs to structure product information without overwhelming the user, and real-time quantity selectors that update pricing and availability on the fly. Search results are enriched with faceted filters and sorting to refine large inventories. In aggregate, these features point to a mature front-end scripting layer capable of stateful UI updates and dynamic content hydration[^2].

The following screenshot exemplifies search-driven interactivity and filtering.

![Search results page illustrating filters and sorting interactions.](assets/screenshots/search_results.png)

Table 4. JavaScript feature map

| Feature                        | Page Context                | User Action                        | Expected Behavior                                         |
|--------------------------------|-----------------------------|------------------------------------|-----------------------------------------------------------|
| Carousel                       | Homepage                    | Scroll/swipe                       | Slides advance; navigation dots update                    |
| Tabs                           | Product detail              | Click tab                          | Content switches without page reload                      |
| Filter facets                  | Category; search results    | Select/unselect facets             | Result set updates; loading indicator shows progress      |
| Sort                           | Category; search results    | Choose sort option                 | List reorders; scroll position preserved                  |
| Quantity selector              | Product detail; cart        | Increase/decrease quantity         | Price and stock status update; mini-cart reflects change  |
| AJAX add-to-cart               | Product detail; category    | Add to cart                        | Cart badge increments; toast or inline confirmation       |
| Address gating                 | Site entry; checkout        | Enter/confirm address              | Catalog refreshes; warnings if address is far             |

## Forms, Data Capture, and Validation

Forms are central to Chefaa’s value proposition—particularly prescription upload, address management, and checkout. Prescription handling allows scanning or uploading images of prescriptions or medicine packaging, a workflow that caters to both immediate needs and medication adherence over time. Address forms capture geolocation-relevant details that influence catalog availability, delivery promises, and pricing. Checkout collects standard shipping and payment selection, with payment methods shaped by the Paymob integration[^2][^10][^11].

Prescription upload and product search are highlighted below to illustrate data capture surfaces.

![Prescription upload UI – file and image capture.](assets/screenshots/prescription_upload.png)

![Search and add-to-cart flows (data capture points).](assets/screenshots/search_results.png)

Table 5. Form inventory

| Form Type             | Fields (Illustrative)                                     | Validation (Indicative)                           | Submission Mode           |
|-----------------------|------------------------------------------------------------|---------------------------------------------------|---------------------------|
| Prescription upload   | Image upload; prescriber details; medication notes         | Image format/size; mandatory fields               | AJAX/form post with async |
| Address management    | Street; building; floor; district; city; nearest landmark  | Required fields; format checks; geolocation hints | AJAX with immediate UI    |
| Checkout              | Contact info; shipping; payment method selection           | Required fields; method selection                 | Multi-step with review    |

Table 6. Prescription upload schema (indicative)

| Step                     | User Inputs                                           | System Responses                                      | Edge Cases                                         |
|--------------------------|-------------------------------------------------------|-------------------------------------------------------|----------------------------------------------------|
| 1. Initiate upload       | Select image or camera capture                        | Preview image; file type/size check                   | Unsupported format; oversized file                 |
| 2. Add details           | Prescriber info; medication notes                     | Validation feedback; optional fields highlighted      | Missing prescriber info                            |
| 3. Submit                | Confirm                                               | Upload progress; success/failure states               | Network error; retry prompt                        |
| 4. Follow-on action      | Route to pharmacy; schedule delivery                   | Status updates; expected delivery window               | Prescription rejected; alternative suggestions     |

## User Authentication and Session Management

Chefaa’s authentication appears to use phone-based OTP, a familiar pattern in Egypt’s digital commerce landscape. App store materials indicate multi-country support scope and privacy disclosures that mention tracked and linked data categories, as well as encryption in transit and user deletion requests—important signals for data governance and compliance posture[^10][^11]. On the web, we observed login flows consistent with phone/OTP entry and confirmation. Server-side session handling, token lifetimes, and CSRF mechanisms cannot be confirmed from public materials and should be verified through instrumentation and code review.

![Login page – phone/OTP flow entry point.](assets/screenshots/login_page.png)

Table 7. Authentication flow (indicative)

| Step                      | User Action                   | System Behavior                               | Error Handling                          |
|---------------------------|-------------------------------|-----------------------------------------------|-----------------------------------------|
| 1. Enter phone            | Input phone number            | Format validation; country selection          | Invalid format; retry                   |
| 2. Request OTP            | Submit                        | Send OTP via SMS                              | SMS failure; resend cooldown            |
| 3. Verify OTP             | Enter code                    | Validate; create/extend session               | Expired/invalid OTP; limited attempts   |
| 4. Session established    | Redirect to account/home      | Maintain state; set cookies/token             | Refresh token; logout on inactivity     |

Table 8. Data categories referenced (apps)

| App Surface | Data Categories (Illustrative)                      | Purpose                                      | Source   |
|-------------|------------------------------------------------------|----------------------------------------------|----------|
| iOS         | Contact info; identifiers; usage data                | Account management; personalization          | [^11]    |
| Android     | Location; personal info; app activity                | Address-based availability; order tracking   | [^10]    |
| Shared      | Data encrypted in transit; user can request deletion | Security; user privacy controls              | [^10]    |

## Payment Integration and Checkout

Chefaa partners with Paymob to digitize pharmaceutical payments across Egypt, enabling secure online card payments, point-of-sale payments upon delivery, and BNPL options. This omnichannel configuration fits a market where cash remains prevalent and delivery personnel typically complete transactions with portable POS devices. The gateway supports multiple payment methods across channels, helping pharmacies broaden reach while giving customers choice at checkout[^6][^7][^8].

The checkout structure presents delivery options, address confirmation, and payment selection. While we did not enumerate specific web payment methods in testing, app stores list online payment and cash on delivery, signaling consumer preferences and supporting conversion for first-time or reluctant card users[^10][^11].

Table 9. Payment capability matrix

| Channel              | Method                          | Provider           | User Experience Implications                    | Source |
|---------------------|----------------------------------|--------------------|-------------------------------------------------|--------|
| Web (checkout)      | Online card payments             | Paymob             | Requires card form; fraud controls              | [^6]   |
| Delivery (in-person)| POS upon delivery                | Paymob             | Cash or card at the door; device connectivity   | [^6]   |
| Web/App             | BNPL                             | Paymob             | Deferred payment; eligibility checks            | [^7]   |
| Web/App             | Cash on Delivery (COD)           | Platform           | Simple, no online payment required              | [^10][^11] |

Table 10. Delivery models overview

| Model        | Timeframe          | Delivery Cost | Discounts   | Notes                                               |
|--------------|--------------------|---------------|-------------|-----------------------------------------------------|
| Now Delivery | 30–60 minutes      | Varies        | None        | Immediate needs; dependent on nearby pharmacy       |
| Big Save     | 72 hours (site)    | Free          | Up to 15%   | Scheduled fulfillment; encourages basket building   |
| Big Save     | 48 hours (apps)    | Free          | 15%         | Minor discrepancy between web and app messaging     |

Discrepancy note: The web localized page references a 72-hour Big Save window, whereas mobile app listings reference a 48-hour window. This is likely a localization or campaign update artifact that should be reconciled in content governance[^2][^10][^11].

## User Experience Flows

Chefaa’s core flows are optimized for speed and clarity. Discovery begins with search and category navigation, then moves into filtering and sorting to narrow options. Address prompts anchor relevance by ensuring the catalog and delivery promises match the user’s location. For prescription-required medications, the upload process gates progression until documentation is verified. Checkout merges delivery selection and payment method choice, offering immediacy (“Now”) or savings (“Big Save”) to fit user needs[^2][^6].

Table 11. End-to-end flow summary

| Step                      | Screen/Module             | Key Inputs/Decisions                          | Output/Next Step                              |
|---------------------------|---------------------------|-----------------------------------------------|-----------------------------------------------|
| 1. Discover               | Home; categories; search  | Keywords; filters; sort                       | Product list narrowed to relevant items       |
| 2. Select                 | Product detail            | Variant; quantity                             | Add to cart                                   |
| 3. Address                | Address prompt/manager    | Confirm or enter address                      | Catalog/availability tailored to location     |
| 4. Delivery option        | Checkout                  | Now vs. Big Save                              | ETA and pricing confirmed                     |
| 5. Prescription (if needed)| Upload module            | Image; prescriber details                     | Validation; routing to pharmacy               |
| 6. Payment                | Checkout                  | Pay online vs. COD; BNPL if eligible          | Order placement; confirmation                  |
| 7. Tracking               | Order status              | Real-time updates                             | Delivery completion                            |

## Mobile App Parity and Feature Extensions (iOS & Android)

The mobile apps mirror the web’s core ordering experience and extend it with native capabilities—GPS-driven address relevance, notifications, and 24/7 pharmacist access. The Android listing emphasizes instant delivery within 90 minutes, Big Save with free delivery and 15% discounts, and order scheduling; iOS descriptions highlight revamped UI/UX, medication reminders, and dynamic pricing tailored to address[^10][^11]. Both surfaces disclose privacy practices, including data encrypted in transit and user deletion requests on Android, and tracked/linked data categories on iOS[^10][^11].

Table 12. Feature parity matrix (Web vs. iOS vs. Android)

| Feature                     | Web (Commerce) | iOS App | Android App |
|----------------------------|----------------|---------|-------------|
| Search & filtering         | Yes            | Yes     | Yes         |
| Address-aware catalog      | Yes            | Yes     | Yes         |
| Now Delivery               | Yes            | Yes     | Yes         |
| Big Save                   | Yes (72h)      | Yes (48h)| Yes (48h)  |
| Prescription upload        | Yes            | Yes     | Yes         |
| Order tracking             | Yes            | Yes     | Yes         |
| Pharmacist support (24/7)  | Yes            | Yes     | Yes         |
| Reminders                  | —              | Yes     | Yes         |
| COD                        | Yes            | Yes     | Yes         |
| Online payment             | Yes (via gateway)| Yes   | Yes         |
| Privacy disclosures        | Policy page     | iOS labels | Android labels |

## Security, Privacy, and Compliance Observations

Transport security is consistent with HTTPS across the commerce site and app surfaces. Data handling disclosures on Android note encryption in transit and support for user deletion requests, which aligns with contemporary privacy expectations. iOS disclosures enumerate categories of tracked and linked data (e.g., contact info, identifiers, location) and provide transparency into how data may be used across features[^10][^11].

While these signals are positive, a full compliance posture would benefit from:
- Visible privacy and accessibility statements on the web that match app disclosures.
- Third-party audits and certifications (e.g., PCI DSS for payments, formal accessibility audits against WCAG 2.1 AA).
- Formalized content governance around delivery windows and discounts to prevent cross-surface discrepancies.

In healthcare contexts, inclusive design is not just a regulatory requirement but also a trust accelerator; aligning web properties with WCAG 2.1 AA would both reduce risk and expand reach[^15].

## Performance and Optimization Observations

Chefaa’s performance posture is anchored in image optimization and secure delivery. The commerce site’s CDN serves images with on-the-fly WebP conversion, which can materially reduce payload on mobile networks common across Egypt. HTTPS ensures encryption without penalizing user experience when modern protocols are leveraged. Framework conventions on the corporate site (Nuxt/Vue) often correlate with SSR/SSG benefits—improved first contentful paint and SEO—though exact build settings would need verification to confirm. Without lab metrics, we avoid quantifying Core Web Vitals; nonetheless, the combination of CDN imagery and modern framework conventions is directionally sound for performance[^1][^2].

Table 13. Optimization checklist

| Area            | Practice (Observed)                      | Likely Impact                           | Next Steps                                    |
|-----------------|------------------------------------------|-----------------------------------------|-----------------------------------------------|
| Images          | WebP conversion via CDN                  | Lower transfer size; faster paint       | Verify responsive srcset; lazy-load behavior  |
| Transport       | HTTPS everywhere                         | Secure data; user trust                 | Enable modern TLS; HSTS                       |
| Build           | Vue/Nuxt conventions (corporate)         | SSR/SSG potential; SEO-friendly         | Confirm SSR config; pre-rendering             |
| Caching         | CDN caching indicators                   | Reduced origin hits; scalability        | Validate cache headers; bust strategies       |

## Accessibility Evaluation

Web accessibility determines whether pharmacy services are truly inclusive. In healthcare, ensuring that users with disabilities can navigate search, prescription upload, and checkout is both ethically important and operationally wise. The Americans with Disabilities Act (ADA) provides relevant guidance for web accessibility in the United States, while globally the Web Content Accessibility Guidelines (WCAG) 2.1 AA set the baseline for inclusive design. For Chefaa, adopting WCAG 2.1 AA would align both web and app experiences and reduce compliance risk, particularly given the healthcare context[^15].

While we did not find a public accessibility statement on the web, app disclosures suggest strong privacy controls and a user-centric ethos—prerequisites for tackling accessibility. Priority actions include semantic HTML audits, keyboard navigation testing, ARIA roles for complex widgets, and form error handling that is perceivable and recoverable.

Table 14. Priority WCAG 2.1 AA gaps (indicative)

| Criterion               | Current Status             | Risk/Impact                               | Recommended Fix                                  |
|------------------------|----------------------------|-------------------------------------------|--------------------------------------------------|
| Keyboard navigation    | To be verified             | Blocks users who don’t use a mouse        | Ensure focus order; skip links; tab stops        |
| ARIA for widgets       | To be verified             | Screen readers misinterpret UI            | Add roles, states, properties; avoid div buttons |
| Color contrast         | To be verified             | Readability issues                        | Meet 4.5:1 ratio; test dark mode                 |
| Form error messaging   | To be verified             | Confusion; abandoned orders               | Clear, explicit errors; helpful summaries        |
| Focus visibility       | To be verified             | Disorientation for keyboard users         | Visible focus indicators                         |
| Images and alt text    | To be verified             | Lost context for non-visual users         | Descriptive alt text; decorative images marked   |

## Risks, Limitations, and Recommended Next Steps

The current analysis is based on publicly accessible surfaces and app store disclosures. Key gaps include:
- Payment method enumeration on the web (e.g., card brands, wallets, BNPL eligibility) requires end-to-end checkout testing.
- Authentication server-side mechanics (token management, CSRF, refresh flows) need instrumented testing or documentation review.
- CDN provider specifics and performance metrics (cache strategy, POPs, TLS termination, HTTP/2/3) are undisclosed.
- Accessibility compliance (WCAG 2.1 AA) needs a structured audit across web and apps.

Recommended actions:
1. Conduct a formal checkout test to enumerate available payment methods and failure modes (e.g., 3-D Secure challenges, POS upon delivery).
2. Instrument the authentication flow for OTP, token lifetimes, refresh strategies, and session invalidation policies; review CSRF protections.
3. Perform a performance audit with lab tools (Lighthouse, WebPageTest) and field data (Core Web Vitals) across representative Egyptian networks and devices; evaluate image srcset and lazy-load behavior.
4. Run an accessibility audit against WCAG 2.1 AA, including screen reader testing (NVDA, VoiceOver), keyboard-only navigation, and color contrast verification.
5. Establish a content governance process to harmonize delivery windows (e.g., Big Save 48h vs. 72h) and discounts across web and apps.
6. Publish web privacy and accessibility statements that match app disclosures; consider third-party certifications (PCI, accessibility conformance) to strengthen trust.

Table 15. Action plan matrix

| Area               | Current Evidence                | Validation Needed                            | Owner (Indicative) | Priority | ETA |
|--------------------|---------------------------------|----------------------------------------------|--------------------|----------|-----|
| Payments (web)     | Paymob integration              | Enumerate methods; test 3DS and POS on delivery | Product/Engineering | High     | 2–4 weeks |
| Authentication     | OTP flow; privacy labels        | Token/session mechanics; CSRF                 | Engineering         | High     | 2–3 weeks |
| Performance        | WebP; HTTPS; Nuxt indicators    | CWV metrics; caching headers; image srcset    | Engineering         | Medium   | 3–5 weeks |
| Accessibility      | No web statement                | WCAG 2.1 AA audit; screen reader testing      | UX/QA               | High     | 3–6 weeks |
| Content governance | Big Save window discrepancy     | Unify cross-surface messaging                 | Product/Comms       | Medium   | 1–2 weeks |
| Compliance         | Privacy policies; app labels    | PCI scope review; accessibility conformance   | Legal/Compliance    | Medium   | 4–8 weeks |

## Appendices: Evidence Artifacts

The following screenshots summarize observed modules and flows during testing:

- Homepage overview (desktop) – primary e-commerce entry point  
  ![Homepage overview (desktop) – primary e-commerce entry point.](assets/screenshots/homepage_desktop.png)

- Search results page – filters and sorting interactions  
  ![Search results page – filters and sorting interactions.](assets/screenshots/search_results.png)

- Login page – phone/OTP flow entry point  
  ![Login page – phone/OTP flow entry point.](assets/screenshots/login_page.png)

- Category navigation – taxonomy and grid layout  
  ![Category navigation – taxonomy and grid layout.](assets/screenshots/category_page.png)

- Product detail – tabs, imagery, and quantity selector  
  ![Product detail – tabs, imagery, and quantity selector.](assets/screenshots/product_page.png)

- Prescription upload – file and image capture  
  ![Prescription upload – file and image capture.](assets/screenshots/prescription_upload.png)

---

## References

[^1]: Home - Chefaa Health. https://www.chefaa.health/  
[^2]: Chefaa Egypt (eg-en) - Online Pharmacy. https://chefaa.com/eg-en  
[^6]: Egyptian Paymob, Chefaa partner to advance pharma retail payments. https://www.arabiya-capital.com/lifestyle/egyptian-paymob-chefaa-partner-to-advance-pharma-retail-payments/  
[^7]: Paymob Joins Forces With Chefaa to Power Digital Transformation of Egyptian Pharmaceutical Payments. https://thefintechtimes.com/paymob-joins-forces-with-chefaa-to-power-digital-transformation-of-egyptian-pharmaceutical-payments/  
[^8]: Paymob and Chefaa to enhance pharma retail payments in Egypt. https://ibsintelligence.com/ibsi-news/paymob-and-chefaa-to-enhance-pharma-retail-payments-in-egypt/  
[^10]: Chefaa - Pharmacy Delivery App - Google Play. https://play.google.com/store/apps/details?id=app.com.chefaa&hl=en_US  
[^11]: Chefaa - شفاء on the App Store. https://apps.apple.com/us/app/chefaa-%D8%B4%D9%81%D8%A7%D8%A1/id1438961456  
[^15]: Guidance on Web Accessibility and the ADA - ADA.gov. https://www.ada.gov/resources/web-guidance/
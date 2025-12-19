# Content Structure Plan - Chefaa.com Clone

## 1. Material Inventory

**Content Files:**
- `docs/chefaa_homepage/chefaa_homepage_analysis.md` (~8,500 words, comprehensive homepage structure)
- `docs/chefaa_products/chefaa_products_analysis.md` (~6,200 words, product catalog and e-commerce)
- `docs/chefaa_visuals/chefaa_visual_design.md` (~4,800 words, design system)
- `docs/chefaa_all_sections.md` (~7,100 words, full site architecture)
- `docs/chefaa_technical/chefaa_technical_analysis.md` (~5,900 words, technical implementation)

**Visual Assets:**
- `docs/chefaa_homepage/` (20+ screenshots: header, hero, categories, footer, cart, login, prescription, products)
- `docs/chefaa_visuals/images/` (organized by homepage/, logos/, products/, ui_elements/)

**Data Files:**
- Product catalog: 41,000+ licensed products across 10 main categories
- Filter taxonomy: 20+ filter dimensions (categories, brands, formulation, size, concentration, age, skin/hair type, etc.)
- Statistics: 1,000+ pharmacies, 25 cities, 24/7 pharmacist availability

## 2. Website Structure

**Type:** Multi-Page Application (MPA)

**Reasoning:** 
- 10+ main categories with deep subcategory hierarchies
- 41,000+ product catalog requiring extensive filtering and pagination
- Multiple distinct user flows: browsing, prescription upload, authentication, checkout
- Bilingual support (Arabic RTL / English LTR) with separate locale paths
- Rich informational content: blog, about, legal, partner pages
- Complex e-commerce mechanics: location-aware inventory, dual delivery models, payment integration

## 3. Page/Section Breakdown

### Page 1: Homepage (`/eg-ar` Arabic, `/eg-en` English)

**Purpose:** Primary discovery hub, establish trust, guide users to key actions

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Header Utilities | Header Pattern | `chefaa_homepage_analysis.md` L76-85 | Search, language toggle, location selector, account, favorites, cart | Logo assets in `chefaa_visuals/images/logos/` |
| Global Navigation | Navigation Bar | `chefaa_homepage_analysis.md` L89-112 | Home, Prescription, All Departments (10 categories), About, Blog, Contact, Partner | - |
| Hero/Service CTAs | Hero Pattern | `chefaa_homepage_analysis.md` L115-133 | Instant delivery (30-60 min), Order by prescription CTA, Licensed pharmacy messaging | Hero background in `chefaa_homepage/` |
| Category Shortcuts Grid | Icon Grid (10 items) | `chefaa_homepage_analysis.md` L136-163 | 10 main categories with icons and names | Category icons in `chefaa_visuals/images/ui_elements/` |
| Promotional Carousels | Carousel Grid | `chefaa_homepage_analysis.md` L136-163 | 13+ themed sections: Back to School, Pain Relievers, Stomach/Colon, Skin Products, Hair Care, Mom & Baby, Supplements, etc. | Product images from `chefaa_visuals/images/products/` |
| Brand Showcase | Brand Carousel | `chefaa_homepage_analysis.md` L186-208 | 8+ featured brands: Penduline, Beesline, Eva Cosmetics, Molfix, Starville, Luna, Shaan, Melatex | Brand logos in `chefaa_visuals/images/` |
| Trust Signals/Statistics | Data Card Grid (4 cards) | `chefaa_homepage_analysis.md` L209-234 | 1,000+ pharmacies, 41,000+ products, 25 cities, 24/7 pharmacist | - |
| Testimonials | Testimonial Carousel | `chefaa_homepage_analysis.md` L209-234 | Customer reviews on delivery speed, pharmacist helpfulness | - |
| App Download | App Promotion Section | `chefaa_homepage_analysis.md` L236-250 | iOS, Android, Huawei AppGallery links with store badges | App store badges |
| Footer | Footer Pattern | `chefaa_homepage_analysis.md` L253-270 | About Us, Blog, Contact, Become Partner, Send Prescription, Monthly Prescription, Supply, Bi-Hub, Social (FB/IG/LinkedIn/TikTok), Legal (ToS, Privacy), App links | - |

### Page 2: Product Listing Page - Category View (`/eg-ar/now/category/{slug}`)

**Purpose:** Browse and filter products within a category

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Breadcrumbs | Breadcrumb Navigation | `chefaa_products_analysis.md` L105-124 | Home > Category > Subcategory path | - |
| Filter Sidebar | Faceted Filter Panel | `chefaa_products_analysis.md` L105-173 | 20+ filter dimensions: Main/Sub/Secondary categories, Brands, Type, Skin Type, Composition, Size, Concentration, Color, Age Group, Dental Care, Hair Type/Color, Pack Size, Suitable for, Free from, Special Features, Scent, Taste, Price Range (0-8,000 EGP) | - |
| Sort Controls | Dropdown Sort Menu | `chefaa_products_analysis.md` L174-181 | Available only, Price: High→Low, Price: Low→High | - |
| Product Grid | 4-Column Grid (Desktop) | `chefaa_products_analysis.md` L105-124 | Product cards with image, name, price (EGP), "Add to Cart" button, "Limited Quantity" labels | Product photos from catalog |
| Pagination | Pagination Controls | `chefaa_products_analysis.md` L105-124 | Page numbers, prev/next (e.g., 134+ pages for Medications, 56 pages for Skin Care) | - |

### Page 3: Product Detail Page (`/eg-ar/nowProduct/{slug}`)

**Purpose:** Display complete product information and enable purchase

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Image Gallery | Product Gallery (left-aligned RTL) | `chefaa_products_analysis.md` L125-143 | Multiple product images, thumbnails | Product images |
| Product Information | Detail Block (right-aligned RTL) | `chefaa_products_analysis.md` L125-143 | Brand, name, formulation (e.g., Doliprane 1000mg), composition, indications, contraindications, usage instructions, safety notes | - |
| Price & Purchase | Price/CTA Block | `chefaa_products_analysis.md` L125-143 | Price (EGP), quantity selector, "Add to Cart" button | - |
| Delivery Messaging | Trust Badge Row | `chefaa_products_analysis.md` L125-143 | Delivery time (30-60 min instant OR 72h Big Save), delivery from nearest pharmacy | Icons for clock, storefront, return policy |
| Sticky Promo Banner | Promotional Footer Bar | `chefaa_visual_design.md` L162-198 | Super Offer messaging (blue bar with lightning icon) | Lightning icon |

### Page 4: Search Results (`/eg-ar/search?q={query}`)

**Purpose:** Display search results with filters

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Search Results Grid | Product Grid Pattern | `chefaa_products_analysis.md` L144-182 | Same as PLP: 4-column grid, product cards, filters, sort | Product images |
| Active Search Query | Search Header | `chefaa_products_analysis.md` L144-182 | "Results for: {query}" with result count | - |
| Filter Sidebar | Same as PLP | `chefaa_products_analysis.md` L150-173 | All filter dimensions applicable to search results | - |

### Page 5: Shopping Cart (`/eg-ar/cart`)

**Purpose:** Review items, adjust quantities, proceed to checkout

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Cart Items List | Cart Item Rows | `chefaa_products_analysis.md` L183-216 | Product image, name, price, quantity controls (increment/decrement), remove button | Product thumbnails |
| Location Gate | Location Prompt Modal | `chefaa_products_analysis.md` L183-216 | "Enable location to view cart" message (items hidden until location permission granted) | Location icon |
| Cart Summary | Summary Card | `chefaa_products_analysis.md` L183-216 | Subtotal, delivery fee, total (EGP) | - |
| Delivery Options | Service Selection | `chefaa_products_analysis.md` L186-197 | Instant Delivery (30-60 min) vs. Big Save (72h, free delivery, up to 15% off, min 600 EGP) | - |
| Checkout CTA | Primary Button | `chefaa_products_analysis.md` L183-216 | "Proceed to Checkout" button | - |

### Page 6: Prescription Upload (`/eg-ar/now/order-medicine-online-prescription`)

**Purpose:** Upload prescription for medicine ordering

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Authentication Gate | Login Requirement | `chefaa_products_analysis.md` L217-237 | Must be logged in to upload | - |
| Address Selection | Address Form | `chefaa_products_analysis.md` L217-237 | City, district, street, building, floor, apartment, landmark | - |
| Prescription Upload | File Upload Component | `chefaa_products_analysis.md` L217-237 | Image upload (Rx) OR textual entry of prescription details | Upload icon |
| Preferences | Checkbox/Radio Options | `chefaa_products_analysis.md` L217-237 | Handling unavailable items: substitute, ship without, cancel order | - |
| Pharmacy Matching | System Display | `chefaa_products_analysis.md` L217-237 | Nearest/preferred pharmacy selection | Pharmacy icon |
| Payment Method | Payment Selection | `chefaa_products_analysis.md` L232-234 | Cash on Delivery (COD) indicated | - |

### Page 7: Login/Registration (`/eg-ar/login`)

**Purpose:** User authentication via phone OTP

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Phone Input | Phone Number Form | `chefaa_technical_analysis.md` L152-175 | Phone number field with country code selector | - |
| OTP Verification | OTP Input Form | `chefaa_technical_analysis.md` L152-175 | Enter 6-digit code, resend button, countdown timer | - |

### Page 8: About Us (`/eg-ar/about-us`)

**Purpose:** Company information and mission

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Company Overview | Content Block | `chefaa_all_sections.md` L36-66 | Mission, network scale (1,000+ pharmacies, 41,000+ products, 25 cities) | - |
| Service Propositions | Feature Grid | `chefaa_all_sections.md` L36-66 | Instant delivery, Big Save, prescription upload, pharmacist support | Service icons |

### Page 9: Contact Us (`/eg-ar/contact-us`)

**Purpose:** Customer support and inquiries

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Contact Form | Form Pattern | `chefaa_all_sections.md` L217-218 | Name, email, phone, message fields | - |
| Contact Information | Info Block | `chefaa_all_sections.md` L217-218 | Support email: support@chefaa.com, tax number: 718-859-672 | - |
| Social Links | Social Icon Row | `chefaa_homepage_analysis.md` L414-418 | Facebook, Instagram, LinkedIn, TikTok | Social icons |

### Page 10: Partner Pharmacy (`/eg-ar/become-partner-pharmacy`)

**Purpose:** Pharmacy onboarding and B2B engagement

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Benefits Overview | Feature List | `chefaa_all_sections.md` L231-233 | Increased customer base, higher sales, pharmacy digitization | - |
| Partner Form | B2B Lead Form | `chefaa_all_sections.md` L231-233 | Pharmacy details (name, location, license, contact) | - |

### Page 11: Blog (`/blog`)

**Purpose:** Health education and content marketing (Arabic only)

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Blog Post Grid | Article Grid | `chefaa_all_sections.md` L196-210 | Article cards with title, author (e.g., Dr. Hafsa Wali El-Din), excerpt, featured image | Article featured images |
| Categories | Category Filter | `chefaa_all_sections.md` L196-210 | Medicines, Vitamins & Supplements, Skin Care, Hair Care, Personal Care, Product Reviews | - |

### Page 12: Privacy Policy (`/eg-ar/privacy`)

**Purpose:** Legal compliance and data protection disclosure

**Content Mapping:**

| Section | Component Pattern | Data File Path | Content to Extract | Visual Asset |
|---------|------------------|----------------|-------------------|--------------|
| Policy Content | Legal Document | `chefaa_all_sections.md` L213-229 | Data collection, usage, protection, retention, cookies, user rights, last updated Oct 2022 | - |

## 4. Content Analysis

**Information Density:** High
- 41,000+ product SKU catalog
- 10 main categories with 3-4 levels of subcategories
- 20+ filter dimensions per category
- Extensive product detail pages (clinical information for medicines)
- Educational blog content (Arabic)
- Legal and compliance documentation

**Content Balance:**
- Product Images: 41,000+ (primary content type for catalog)
- Data/Charts: Statistics cards, pricing tables, delivery comparison
- Text: Product descriptions, clinical information, blog articles (~50,000+ words across site)
- Interactive Elements: Filters, carousels, modals, forms
- Content Type: **Mixed** (product-heavy catalog + educational content + transactional flows)

**Key Content Characteristics:**
- **Bilingual:** Arabic RTL primary, English LTR secondary
- **Medical Focus:** Prescription requirements, clinical information, safety warnings
- **Location-Aware:** Dynamic content based on user location and nearest pharmacy
- **E-commerce Intensive:** Complex filtering, sorting, cart management, payment flows
- **Trust-Building:** Statistics, testimonials, certifications, 24/7 support messaging

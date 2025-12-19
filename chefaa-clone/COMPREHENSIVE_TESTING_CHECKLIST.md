# Comprehensive End-to-End Testing Checklist
## Phase 1 Performance Optimization - Testing Guide

**Deployed URL**: https://9ft97t06uqdl.space.minimax.io
**Test Account**: ntqtcbqk@minimax.com / zKhtFq0dHz
**Date**: 2025-11-02

---

## Pre-Test Verification (Automated)

### 1. Deployment Status
- [ ] URL is accessible
- [ ] Returns HTTP 200
- [ ] Service worker file exists (`/sw.js`)
- [ ] Manifest file exists (`/manifest.webmanifest`)

### 2. Bundle Optimization
- [ ] Main chunks are gzipped
- [ ] Lazy-loaded route chunks exist
- [ ] Total bundle size < 500KB gzipped

---

## Manual Testing Pathways

### PATHWAY 1: Homepage & Performance Verification (15 min)

**Objectives**: Verify homepage loads correctly with performance optimizations

1. **Initial Load**:
   - [ ] Navigate to https://9ft97t06uqdl.space.minimax.io
   - [ ] Page loads within 3 seconds
   - [ ] No white screen / blank page
   - [ ] Header with logo and navigation visible
   - [ ] Hero section displays correctly

2. **Service Worker Verification**:
   - [ ] Open DevTools (F12)
   - [ ] Go to Application → Service Workers
   - [ ] Verify service worker is "activated and running"
   - [ ] Check Console for "[SW] Registration successful" message

3. **Performance Monitoring**:
   - [ ] Open Console
   - [ ] Look for performance metrics logs (LCP, INP, CLS, FCP, TTFB)
   - [ ] Check localStorage for "performance-metrics" key

4. **Code Splitting Verification**:
   - [ ] Open Network tab
   - [ ] Filter by JS files
   - [ ] Verify multiple small chunk files (not one huge bundle)
   - [ ] Check for files like: HomePage-*.js, CategoryPage-*.js, etc.

5. **Image Loading**:
   - [ ] Scroll down the homepage
   - [ ] Observe images loading with blur effect (progressive enhancement)
   - [ ] Images should appear with brief blur-to-sharp transition
   - [ ] No broken image icons

6. **Language Toggle**:
   - [ ] Click language toggle button (AR/EN)
   - [ ] Page switches between Arabic (RTL) and English (LTR)
   - [ ] No layout breaks during switch
   - [ ] Navigation and content reflect language change

### PATHWAY 2: Product Browsing & Optimized Queries (10 min)

**Objectives**: Test database optimization and query performance

1. **Category Navigation**:
   - [ ] Click on "Medications" category from header/menu
   - [ ] Products load quickly (< 1 second perceived time)
   - [ ] Products displayed in grid layout
   - [ ] Each product card shows: image, name, price, rating, "Add to Cart" button

2. **Network Performance**:
   - [ ] Check Network tab → XHR/Fetch
   - [ ] Look for Supabase API calls
   - [ ] Response time should be < 500ms
   - [ ] Check if React Query is caching (second navigation to same category should be instant)

3. **Progressive Image Loading**:
   - [ ] Scroll down product list
   - [ ] Images below fold load as you scroll (lazy loading)
   - [ ] Blur animation on image load
   - [ ] No layout shift as images load

4. **Category Switching**:
   - [ ] Navigate to "Hair Care" category
   - [ ] Then to "Skin Care"
   - [ ] Then back to "Medications"
   - [ ] Third visit should load instantly from cache

5. **Product Filtering/Sorting** (if available):
   - [ ] Test any filter/sort options
   - [ ] Verify quick response time
   - [ ] Products update correctly

### PATHWAY 3: Product Detail & Real-time Features (10 min)

**Objectives**: Test optimized product detail page and real-time capabilities

1. **Product Detail Navigation**:
   - [ ] Click on any product card
   - [ ] Product detail page loads in < 2 seconds
   - [ ] Page shows: product image, name, description, price, stock quantity

2. **Optimized Image Display**:
   - [ ] Main product image loads with progressive enhancement
   - [ ] Check Network tab for WebP format (if converted)
   - [ ] Image quality is good (not pixelated)

3. **Product Information**:
   - [ ] All product details display correctly
   - [ ] Reviews section visible (if product has reviews)
   - [ ] Stock quantity shown
   - [ ] Add to Cart button functional

4. **Real-time Inventory** (if testable):
   - [ ] Note current stock quantity
   - [ ] Keep page open for 1-2 minutes
   - [ ] Watch for any stock updates (would appear if admin changes inventory)

5. **Add to Cart**:
   - [ ] Click "Add to Cart" button
   - [ ] Cart count in header increments
   - [ ] No errors in console
   - [ ] Success feedback (visual or notification)

### PATHWAY 4: Shopping Cart & Persistence (10 min)

**Objectives**: Verify cart functionality and state management

1. **Cart Access**:
   - [ ] Click cart icon in header
   - [ ] Cart page loads showing added items
   - [ ] Products display with image, name, price, quantity

2. **Quantity Management**:
   - [ ] Increase quantity of an item
   - [ ] Decrease quantity of an item
   - [ ] Verify price calculations update correctly
   - [ ] Total price matches (item price × quantity + all items)

3. **Remove Items**:
   - [ ] Remove an item from cart
   - [ ] Item disappears from list
   - [ ] Cart count updates
   - [ ] Total price recalculates

4. **Empty Cart**:
   - [ ] Remove all items
   - [ ] Empty cart message displayed
   - [ ] "Continue Shopping" or similar CTA available

### PATHWAY 5: User Authentication (15 min)

**Objectives**: Test auth flow and protected routes

1. **Login Page Access**:
   - [ ] Navigate to /login
   - [ ] Login form displays correctly
   - [ ] Email and password fields present

2. **Login Process**:
   - [ ] Enter test account: ntqtcbqk@minimax.com / zKhtFq0dHz
   - [ ] Click "Login" or "Sign In"
   - [ ] Wait for authentication
   - [ ] Successfully redirected (to home or dashboard)
   - [ ] User menu/profile shows logged-in state

3. **Authenticated State**:
   - [ ] User profile/menu accessible
   - [ ] Logout option available
   - [ ] Previous cart items persist after login

4. **Logout**:
   - [ ] Click logout
   - [ ] Redirected to homepage or login
   - [ ] Auth state clears
   - [ ] Protected routes become inaccessible

### PATHWAY 6: Checkout Process (15 min)

**Objectives**: Test complete purchase flow

1. **Checkout Initiation**:
   - [ ] Add 2-3 products to cart
   - [ ] Navigate to cart page
   - [ ] Click "Proceed to Checkout" or "Checkout" button

2. **Checkout Page**:
   - [ ] Login if not already authenticated
   - [ ] Order summary displays correctly
   - [ ] All cart items shown with prices
   - [ ] Shipping/billing address form available

3. **Form Completion**:
   - [ ] Fill in delivery address
   - [ ] Fill in contact information (phone, email)
   - [ ] Select delivery method if available
   - [ ] All required fields marked

4. **Payment Integration** (Stripe):
   - [ ] Payment section visible
   - [ ] Stripe payment form loads (card input fields)
   - [ ] Use test card: 4242 4242 4242 4242
   - [ ] Expiry: Any future date, CVC: Any 3 digits

5. **Order Submission**:
   - [ ] Submit order
   - [ ] Loading/processing indicator shows
   - [ ] Redirected to success page
   - [ ] Order confirmation displayed
   - [ ] Order details shown

### PATHWAY 7: Search & Advanced Features (10 min)

**Objectives**: Test search optimization and additional features

1. **Search Functionality**:
   - [ ] Navigate to search page or use search bar
   - [ ] Enter search query (e.g., "Panadol", "moisturizer")
   - [ ] Results load quickly (< 1 second)
   - [ ] Relevant products displayed
   - [ ] Search highlights or relevance indication

2. **Search Performance**:
   - [ ] Check Network tab for search API call
   - [ ] Response time < 300ms
   - [ ] Full-text search working (partial matches)

3. **Reviews System** (if visible):
   - [ ] Navigate to product with reviews
   - [ ] Reviews display correctly
   - [ ] Star ratings visible
   - [ ] Review text readable

4. **Wishlist** (if available):
   - [ ] Add product to wishlist
   - [ ] Wishlist icon updates (filled heart, etc.)
   - [ ] Access wishlist page
   - [ ] Saved products display

### PATHWAY 8: Service Worker & PWA Features (10 min)

**Objectives**: Verify service worker caching and PWA capabilities

1. **Cache Verification**:
   - [ ] Load homepage fully
   - [ ] Open DevTools → Network tab
   - [ ] Reload page (Ctrl/Cmd + R)
   - [ ] Check "Size" column for "(ServiceWorker)" or "(from ServiceWorker)"
   - [ ] Static assets (JS, CSS, images) served from cache

2. **Offline Capabilities**:
   - [ ] Open DevTools → Network tab
   - [ ] Enable "Offline" mode
   - [ ] Try to navigate (may show cached pages or offline message)
   - [ ] Disable offline mode
   - [ ] Verify site works again

3. **PWA Install**:
   - [ ] Look for install prompt in browser (mobile/Chrome)
   - [ ] Check DevTools → Application → Manifest
   - [ ] Manifest file loads correctly
   - [ ] Icons defined (192x192, 512x512)

4. **Background Sync** (if implemented):
   - [ ] Add items to cart
   - [ ] Go offline
   - [ ] Try to submit order (should queue)
   - [ ] Go online
   - [ ] Verify order processes

### PATHWAY 9: Mobile Responsiveness (10 min)

**Objectives**: Verify responsive design and mobile performance

1. **Desktop View** (> 1200px):
   - [ ] Layout uses full width appropriately
   - [ ] Navigation is horizontal
   - [ ] Product grids show 4+ columns
   - [ ] No horizontal scroll

2. **Tablet View** (768px - 1200px):
   - [ ] Layout adapts to medium screen
   - [ ] Navigation may collapse or stack
   - [ ] Product grids show 2-3 columns
   - [ ] Touch targets adequate

3. **Mobile View** (< 768px):
   - [ ] Layout stacks vertically
   - [ ] Mobile menu/hamburger icon present
   - [ ] Product grids show 1-2 columns
   - [ ] Text readable without zoom
   - [ ] Buttons/links easy to tap

4. **DevTools Responsive Mode**:
   - [ ] Open DevTools
   - [ ] Toggle device toolbar (Ctrl+Shift+M)
   - [ ] Test various device presets (iPhone, iPad, etc.)
   - [ ] Verify no layout breaks

### PATHWAY 10: Performance Metrics (20 min)

**Objectives**: Measure actual performance improvements

1. **Manual Lighthouse Test**:
   - [ ] Open Chrome DevTools
   - [ ] Go to "Lighthouse" tab
   - [ ] Select "Performance" category
   - [ ] Select "Desktop" or "Mobile"
   - [ ] Click "Analyze page load"
   - [ ] Record scores:
     * Performance: ____ / 100
     * LCP: ____ seconds
     * TBT: ____ milliseconds
     * CLS: ____

2. **Web Vitals Monitoring**:
   - [ ] Navigate site for 2-3 minutes
   - [ ] Open Console
   - [ ] Look for performance logs
   - [ ] Check localStorage: `localStorage.getItem('performance-metrics')`
   - [ ] Verify metrics are being collected

3. **Network Performance**:
   - [ ] Clear browser cache
   - [ ] Load homepage
   - [ ] Record in Network tab:
     * Total requests: ____
     * Total size transferred: ____ KB
     * Finish time: ____ seconds
   - [ ] Reload page (with cache)
   - [ ] Record second load:
     * Size from cache: ____ KB
     * Finish time: ____ seconds

4. **Bundle Size Verification**:
   - [ ] Check Network tab JS files
   - [ ] Main vendor chunks gzipped: ~ 52KB + 42KB + 8KB
   - [ ] Page chunks: ~ 1-3KB each
   - [ ] Total initial load: < 150KB gzipped

---

## Test Results Summary

### Critical Issues Found
- [ ] None
- [ ] List issues here...

### Performance Benchmarks
- [ ] LCP < 2.5s: ____ seconds
- [ ] INP < 200ms: ____ ms
- [ ] CLS < 0.1: ____
- [ ] FCP < 1.8s: ____ seconds
- [ ] Overall Performance Score: ____ / 100

### Functional Testing Results
- [ ] All pathways passed
- [ ] Partial failures (list below)
- [ ] Major failures requiring fixes

### Browser Compatibility
Tested on:
- [ ] Chrome (version: ____)
- [ ] Firefox (version: ____)
- [ ] Safari (version: ____)
- [ ] Edge (version: ____)
- [ ] Mobile Safari (iOS __)
- [ ] Mobile Chrome (Android __)

---

## Approval Checklist

Before approving Phase 1 completion:
- [ ] All 10 pathways tested successfully
- [ ] No critical bugs found
- [ ] Performance targets met (LCP < 2.5s, bundle < 500KB)
- [ ] Service worker functioning correctly
- [ ] All existing features maintained
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility confirmed

---

## Notes & Observations

[Add any additional notes, edge cases found, or recommendations]

---

**Tester**: ________________
**Date Completed**: ________________
**Overall Status**: [ ] PASS / [ ] FAIL / [ ] NEEDS REVISION

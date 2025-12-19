# Phase 2 Manual Testing Verification Script

## Testing Environment
- **Production URL**: https://xojqs9m8cr6n.space.minimax.io
- **Browser**: Chrome/Firefox/Safari (latest)
- **Test Account**: ntqtcbqk@minimax.com / zKhtFq0dHz
- **Note**: Automated browser testing unavailable - manual verification required

---

## Quick Verification Checklist

### ✓ Pre-Test Setup
1. Open browser (Chrome recommended)
2. Open Developer Tools (F12)
3. Navigate to production URL
4. Have test credentials ready
5. Clear browser cache if needed

---

## PATHWAY 1: Homepage & Smart Search Bar (5 min)

### Steps:
1. **Load Homepage**
   - URL: https://xojqs9m8cr6n.space.minimax.io
   - ✓ Page loads without errors
   - ✓ Header displays correctly
   - ✓ Products grid visible

2. **Test Smart Search**
   - Click search bar in header
   - Type: "pain"
   - **Expected**: Dropdown appears with suggestions
   - **Expected**: Suggestions show search terms with counts
   - Click a suggestion
   - **Expected**: Navigate to search results page

### Validation:
- [ ] Smart Search Bar is visible (not basic input)
- [ ] Suggestions dropdown works
- [ ] Suggestions are clickable
- [ ] Navigation to search results works

### Console Check:
- Open DevTools → Console tab
- Look for errors related to SmartSearchBar or search_suggestions
- Document any errors

---

## PATHWAY 2: Quick View Modal (5 min)

### Steps:
1. **Navigate to Homepage**
   - Scroll to product grid
   
2. **Hover Product Card**
   - Hover mouse over first product image
   - **Expected**: "Quick View" button overlay appears
   
3. **Open Modal**
   - Click "Quick View" button
   - **Expected**: Modal popup opens
   - **Expected**: Shows product image, name, price, description
   - **Expected**: Has quantity selector (+/- buttons)
   - **Expected**: Has "Add to Cart" button

4. **Test Modal**
   - Click + button to increase quantity
   - Click - button to decrease quantity
   - Click "Add to Cart"
   - **Expected**: Modal closes, cart count updates

5. **Close Modal**
   - Open another Quick View
   - Click X button or outside modal
   - **Expected**: Modal closes

### Validation:
- [ ] Quick View button appears on hover
- [ ] Modal opens smoothly
- [ ] All product info displayed
- [ ] Quantity controls work
- [ ] Add to cart works from modal
- [ ] Modal closes properly

### Console Check:
- Look for QuickViewModal errors
- Check Network tab for image loading

---

## PATHWAY 3: Product Detail with Recommendations (7 min)

### Steps:
1. **Navigate to Product Page**
   - Click any product card (not Quick View)
   - Product detail page loads

2. **Scroll Down**
   - Scroll past product description sections
   - Look for recommendations sections

3. **Check "Frequently Bought Together"**
   - **Expected**: Section title visible
   - **Expected**: 5 product cards displayed
   - **Expected**: Each card shows image, name, price
   - **Expected**: Cards have "Add to Cart" buttons

4. **Check "Similar Products"**
   - Scroll further down
   - **Expected**: "Similar Products" section visible
   - **Expected**: 5 product cards displayed
   - **Expected**: Products are relevant to current item

5. **Test Recommendations**
   - Click a recommended product
   - **Expected**: Navigate to that product's page
   - **Expected**: Recommendations update for new product

### Validation:
- [ ] "Frequently Bought Together" section appears
- [ ] "Similar Products" section appears
- [ ] Each section shows 5 products
- [ ] Products are clickable
- [ ] Recommendations update per product

### Console Check:
- Look for SmartRecommendations errors
- Check for get_product_recommendations RPC calls in Network tab

---

## PATHWAY 4: Bulk Order Interface (5 min)

### Steps:
1. **Navigate to Bulk Order**
   - URL: https://xojqs9m8cr6n.space.minimax.io/bulk-order
   - **Expected**: Page loads (not 404)

2. **Check Page Elements**
   - **Expected**: "Bulk Order" heading visible
   - **Expected**: Instructions section displays
   - **Expected**: "Download CSV Template" button visible
   - **Expected**: File upload area visible

3. **Download Template**
   - Click "Download CSV Template"
   - **Expected**: CSV file downloads
   - Open file: Should have header "SKU,Quantity"

4. **Upload Test (Optional)**
   - Create simple CSV: SKU,Quantity\nPROD-001,10
   - Upload to interface
   - **Expected**: File uploads successfully
   - **Expected**: Product validation occurs
   - **Expected**: Table displays with results

### Validation:
- [ ] /bulk-order route exists (not 404)
- [ ] Page layout displays correctly
- [ ] Instructions are clear
- [ ] CSV template downloads
- [ ] Upload interface functional

### Console Check:
- Look for BulkOrderInterface errors
- Check bulk_orders table access

---

## PATHWAY 5: Admin Analytics Dashboard (5 min)

### Steps:
1. **Navigate to Analytics**
   - URL: https://xojqs9m8cr6n.space.minimax.io/admin/analytics
   - **Expected**: Page loads (not 404)

2. **Check Dashboard Layout**
   - **Expected**: "Analytics Dashboard" heading visible
   - **Expected**: Time range selector (24h, 7d, 30d) visible
   - **Expected**: 8 stat cards displayed:
     * Sessions
     * Product Views
     * Cart Additions
     * Purchases
     * Revenue
     * Conversion Rate
     * Searches
     * Avg Session Duration

3. **Check Data Sections**
   - Scroll down
   - **Expected**: "Top Products" section with product list
   - **Expected**: "Top Searches" section with search queries

4. **Test Time Range**
   - Click "24h" button
   - **Expected**: Button highlights, data updates
   - Click "7d" button
   - **Expected**: Button highlights, data updates

### Validation:
- [ ] /admin/analytics route exists (not 404)
- [ ] All 8 stat cards visible
- [ ] Time range selector works
- [ ] Top Products list shows
- [ ] Top Searches list shows
- [ ] Data displays correctly (may be 0 if no historical data)

### Console Check:
- Look for AdminAnalyticsDashboard errors
- Check for analytics table queries in Network tab

---

## PATHWAY 6: Core Functionality (5 min)

### Steps:
1. **Navigation**
   - Click category link in header
   - **Expected**: Category page loads
   - **Expected**: Products display

2. **Add to Cart**
   - Click "Add to Cart" on a product
   - **Expected**: Cart count badge updates in header
   - Click cart icon
   - **Expected**: Cart page loads with items

3. **Bilingual Toggle**
   - Click language toggle (العربية/English)
   - **Expected**: Interface switches language
   - **Expected**: RTL/LTR layout changes
   - Toggle back
   - **Expected**: Returns to original language

### Validation:
- [ ] Category navigation works
- [ ] Product display works
- [ ] Add to cart works
- [ ] Cart page accessible
- [ ] Bilingual toggle functional

---

## PATHWAY 7: Cart Recovery Banner (3 min)

### Note: 
This feature only appears if user has abandoned cart. If not visible, it's expected behavior.

### Steps:
1. **Create Abandoned Cart** (if needed)
   - Log in: ntqtcbqk@minimax.com / zKhtFq0dHz
   - Add 2-3 items to cart
   - Navigate away from cart (to homepage)
   - Close browser/wait 5 minutes
   - Reopen site

2. **Check for Banner**
   - After page load, wait 2-3 seconds
   - **Expected**: Banner slides in from bottom corner
   - **Expected**: Shows cart summary (item count, total)
   - **Expected**: Has "Complete Purchase" button

3. **Test Banner**
   - Click "Complete Purchase"
   - **Expected**: Navigate to cart page
   - OR click X to dismiss
   - **Expected**: Banner disappears

### Validation:
- [ ] Banner appears (if abandoned cart exists)
- [ ] Shows correct cart data
- [ ] "Complete Purchase" button works
- [ ] Dismiss button works
- [ ] OR No banner (expected if no abandoned cart)

---

## PATHWAY 8: Mobile Responsiveness (5 min)

### Steps:
1. **Enable Device Mode**
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Select "iPhone 12 Pro" or similar

2. **Test Smart Search**
   - Click search bar
   - Type query
   - **Expected**: Suggestions dropdown fits screen
   - **Expected**: Touch interactions work

3. **Test Quick View**
   - Tap product card to hover (may need to tap twice)
   - Tap Quick View button
   - **Expected**: Modal scales to screen width
   - **Expected**: All buttons are tappable

4. **Test Bulk Order**
   - Navigate to /bulk-order
   - **Expected**: Layout responsive
   - **Expected**: Table scrolls horizontally if needed
   - **Expected**: Upload button accessible

5. **Test Analytics Dashboard**
   - Navigate to /admin/analytics
   - **Expected**: Stat cards stack vertically
   - **Expected**: Time range buttons accessible
   - **Expected**: No horizontal overflow

### Validation:
- [ ] Smart Search responsive
- [ ] Quick View modal scales
- [ ] Bulk Order layout responsive
- [ ] Analytics dashboard responsive
- [ ] No layout breaks on mobile

---

## PATHWAY 9: Performance Check (5 min)

### Steps:
1. **Network Tab**
   - Open DevTools → Network tab
   - Reload homepage
   - **Check**: Initial JS bundle < 200KB gzipped
   - **Check**: Images lazy load
   - **Check**: Page-specific chunks load on navigation

2. **Application Tab**
   - Open DevTools → Application tab
   - Check Service Workers
   - **Expected**: sw.js is activated and running
   - Check Cache Storage
   - **Expected**: workbox-precache with ~72 entries

3. **Console Tab**
   - **Check**: No JavaScript errors
   - **Check**: No 404 errors in Network tab
   - **Check**: No CORS errors

4. **Lighthouse Audit** (Optional)
   - DevTools → Lighthouse tab
   - Run audit (Mobile/Desktop)
   - **Target**: Performance > 85, Best Practices > 90

### Validation:
- [ ] Bundle sizes acceptable
- [ ] Service Worker active
- [ ] No console errors
- [ ] No 404 errors
- [ ] Page load speed good

---

## FINAL ASSESSMENT

### Phase 2 Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Quick View Modal | [ ] ✓ / [ ] ✗ | |
| Smart Search Bar | [ ] ✓ / [ ] ✗ | |
| Smart Recommendations | [ ] ✓ / [ ] ✗ | |
| Bulk Order Interface | [ ] ✓ / [ ] ✗ | |
| Admin Analytics Dashboard | [ ] ✓ / [ ] ✗ | |
| Cart Recovery Banner | [ ] ✓ / [ ] ✗ / [ ] N/A | |
| Analytics Tracking | [ ] ✓ / [ ] ✗ | (Backend - check console) |
| Mobile Responsive | [ ] ✓ / [ ] ✗ | |
| Performance | [ ] ✓ / [ ] ✗ | |

### Issues Found

| # | Issue | Severity | Pathway |
|---|-------|----------|---------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Console Errors

```
[List any JavaScript errors from console]
```

### Network Errors

```
[List any 404 or failed requests]
```

---

## Overall Assessment

**Testing Completed**: [ ] Yes / [ ] No

**Total Issues**: ___

**Critical Issues**: ___

**Production Status**: [ ] READY / [ ] NEEDS FIXES

### Summary:
```
[Brief summary of testing results]

Working Features:
- [List]

Issues Found:
- [List]

Recommendations:
- [List]
```

---

## Next Steps

1. [ ] Complete all pathways
2. [ ] Document all issues
3. [ ] Fix critical issues (if any)
4. [ ] Re-test affected areas
5. [ ] Final sign-off

---

**Tester Name**: _____________  
**Date**: _____________  
**Time Spent**: _____________  
**Signature**: _____________

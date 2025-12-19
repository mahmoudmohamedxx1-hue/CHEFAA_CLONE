# Phase 2 Integration Testing Guide

**Production URL**: https://xojqs9m8cr6n.space.minimax.io
**Test Account**: ntqtcbqk@minimax.com / zKhtFq0dHz

## Overview
Phase 2 adds 6 major e-commerce enhancements integrated across the platform:
1. Quick View Modal (ProductCard)
2. Smart Search Bar (Header)
3. Smart Recommendations (Product Detail Page)
4. Analytics Tracking (App-wide)
5. Cart Recovery Banner (App-wide)
6. Bulk Order Interface (New Page)
7. Admin Analytics Dashboard (New Page)

---

## Test Pathway 1: Quick View Modal

### Objective
Verify instant product preview popup functionality

### Steps
1. Navigate to homepage or any category page
2. Hover over any product card
3. Look for "Quick View" button overlay on product image
4. Click "Quick View" button
5. Verify modal opens with:
   - Product images gallery
   - Product name, price, description
   - Stock status indicator
   - Quantity selector
   - "Add to Cart" button
   - Close (X) button
6. Change quantity using +/- buttons
7. Click "Add to Cart"
8. Verify modal closes and item added to cart
9. Open another product's Quick View
10. Click outside modal to close
11. Verify modal closes properly

### Expected Results
- ✓ Quick View button appears on hover
- ✓ Modal opens smoothly with full product info
- ✓ Quantity selector works correctly
- ✓ Add to cart functions properly
- ✓ Modal closes on button click and outside click
- ✓ No navigation occurs (stays on same page)

---

## Test Pathway 2: Smart Search Bar

### Objective
Verify auto-complete search with suggestions

### Steps
1. Navigate to any page
2. Click on the search bar in header
3. Type at least 2 characters (e.g., "pain")
4. Verify suggestions dropdown appears
5. Check suggestions show:
   - Related search terms
   - Search frequency indicators
   - Category tags (if available)
6. Click on a suggestion
7. Verify navigation to search results page
8. Return to homepage
9. Type a complete search query
10. Press Enter or click search icon
11. Verify navigation to search results

### Expected Results
- ✓ Suggestions appear after 2+ characters
- ✓ Suggestions are relevant to query
- ✓ Clicking suggestion navigates correctly
- ✓ Manual search (Enter) works properly
- ✓ Dropdown closes after selection
- ✓ Recent searches displayed (if feature enabled)

---

## Test Pathway 3: Smart Recommendations

### Objective
Verify AI-powered product recommendations

### Steps
1. Navigate to any product detail page
2. Scroll down past product description
3. Locate "Frequently Bought Together" section
4. Verify 5 recommended products displayed
5. Check each recommendation shows:
   - Product image
   - Product name
   - Price
   - Add to cart button
6. Scroll further to "Similar Products" section
7. Verify 5 similar products displayed
8. Click on a recommended product
9. Verify navigation to that product's page
10. Check recommendations update based on new product

### Expected Results
- ✓ "Frequently Bought Together" section appears
- ✓ "Similar Products" section appears
- ✓ Each section shows 5 products
- ✓ Products are relevant to current item
- ✓ All product cards are clickable
- ✓ Recommendations update per product

---

## Test Pathway 4: Analytics Tracking

### Objective
Verify user behavior tracking (backend verification)

### Steps
1. Open browser developer console (F12)
2. Navigate to Network tab
3. Browse through multiple pages
4. Check for analytics requests to Supabase
5. View a few products
6. Add items to cart
7. Perform searches
8. Navigate to Admin Dashboard (/admin/analytics)
9. Verify stats are being recorded:
   - Session count
   - Page views
   - Product interactions
   - Search queries

### Expected Results
- ✓ Analytics requests sent on page views
- ✓ Product interactions tracked
- ✓ Search queries logged
- ✓ Cart events recorded
- ✓ Data visible in admin dashboard
- ✓ No errors in console

---

## Test Pathway 5: Cart Recovery Banner

### Objective
Verify abandoned cart recovery popup

### Prerequisites
- Must be logged in
- Must have previously abandoned a cart (items in cart, left site)

### Steps
1. Log in with test account
2. Add 2-3 items to cart
3. Navigate away from cart page (don't checkout)
4. Leave the site for 5+ minutes (or simulate)
5. Return to the site
6. Wait 2-3 seconds after page load
7. Look for recovery banner (bottom corner)
8. Verify banner shows:
   - Cart icon
   - Item count
   - Total amount
   - Discount code (if available)
   - "Complete Purchase" button
9. Click "Complete Purchase"
10. Verify navigation to cart page
11. Check banner dismisses

### Expected Results
- ✓ Banner appears after delay
- ✓ Shows correct item count and total
- ✓ Discount code displayed (if applicable)
- ✓ "Complete Purchase" navigates to cart
- ✓ Banner can be dismissed with X button
- ✓ Banner stays dismissed for session

**Note**: If no abandoned cart exists, banner won't appear (expected behavior)

---

## Test Pathway 6: Bulk Order Interface

### Objective
Verify CSV bulk ordering system

### Steps
1. Navigate to /bulk-order
2. Verify page loads with instructions
3. Click "Download CSV Template"
4. Verify CSV file downloads with format: SKU,Quantity
5. Open CSV in Excel/text editor
6. Add 3-4 product SKUs with quantities (e.g., PROD-001,10)
7. Save the CSV file
8. Return to bulk order page
9. Click "Upload CSV File" or drag-drop CSV
10. Verify file uploads successfully
11. Check products table appears with:
    - SKU
    - Product name (auto-populated)
    - Quantity
    - Unit price
    - Total
    - Status (Found/Not Found)
12. Verify valid products show green checkmark
13. Check total amount calculation
14. Click "Submit Order"
15. Verify success message appears

### Expected Results
- ✓ Template downloads correctly
- ✓ CSV uploads successfully
- ✓ Product validation occurs automatically
- ✓ Valid products identified
- ✓ Invalid SKUs marked as "Not Found"
- ✓ Total calculated correctly
- ✓ Order submission works
- ✓ Success confirmation displayed

---

## Test Pathway 7: Admin Analytics Dashboard

### Objective
Verify analytics dashboard displays correctly

### Steps
1. Navigate to /admin/analytics
2. Verify dashboard loads with stats cards
3. Check time range selector (24h, 7d, 30d)
4. Click different time ranges
5. Verify data updates accordingly
6. Check stat cards show:
   - Total sessions
   - Unique users
   - Product views
   - Cart additions
   - Purchases
   - Revenue
   - Conversion rate
   - Average session duration
   - Search count
7. Scroll down to "Top Products" section
8. Verify products ranked by engagement
9. Check "Top Searches" section
10. Verify search queries listed with frequencies

### Expected Results
- ✓ Dashboard loads without errors
- ✓ All 9 stat cards display
- ✓ Time range selector works
- ✓ Data updates when range changes
- ✓ Top products list shows correctly
- ✓ Top searches list shows correctly
- ✓ Numbers are accurate and realistic
- ✓ Icons and styling render properly

---

## Test Pathway 8: Mobile Responsiveness (Phase 2 Features)

### Objective
Verify Phase 2 features work on mobile devices

### Steps
1. Open DevTools (F12) and toggle device toolbar (Ctrl+Shift+M)
2. Select mobile device (iPhone 12 Pro, Samsung Galaxy S20, etc.)
3. Test Quick View Modal:
   - Verify modal scales to screen
   - Check all buttons are tappable
   - Test quantity controls
4. Test Smart Search:
   - Tap search bar
   - Type query
   - Verify suggestions dropdown fits screen
5. Test Cart Recovery Banner:
   - Check banner appears at bottom
   - Verify readable on small screen
   - Test close button
6. Test Bulk Order Interface:
   - Navigate to /bulk-order
   - Verify table scrolls horizontally if needed
   - Test file upload button
7. Test Admin Dashboard:
   - Navigate to /admin/analytics
   - Verify stat cards stack vertically
   - Check time range buttons are accessible

### Expected Results
- ✓ All Phase 2 features responsive
- ✓ Modals scale properly
- ✓ Touch interactions work
- ✓ No horizontal overflow
- ✓ Text remains readable
- ✓ Buttons adequately sized for touch

---

## Test Pathway 9: Performance & Integration

### Objective
Verify Phase 1 optimizations still work with Phase 2

### Steps
1. Open DevTools Network tab
2. Reload homepage
3. Check bundle sizes:
   - Initial JS load < 200KB gzipped
   - Page-specific chunks load on demand
4. Verify Service Worker active (Application tab)
5. Check PWA precache (72 entries expected)
6. Navigate between pages
7. Verify smooth transitions
8. Check lazy loading for:
   - Product images
   - Route components
9. Open Lighthouse (DevTools > Lighthouse)
10. Run performance audit
11. Check scores:
    - Performance: > 85
    - Best Practices: > 90
    - SEO: > 90

### Expected Results
- ✓ Code splitting still active
- ✓ Service Worker caching works
- ✓ Images lazy load properly
- ✓ Page transitions smooth
- ✓ Lighthouse scores maintained
- ✓ No performance regression

---

## Test Pathway 10: Cross-Feature Integration

### Objective
Verify Phase 2 features work together cohesively

### Complete User Journey:
1. Start on homepage
2. Use Smart Search to find product
3. Click product from search results
4. Use Quick View on another related product
5. Add both items to cart from Quick View
6. Navigate to product detail page
7. Verify Smart Recommendations appear
8. Add recommended product to cart
9. Navigate away from cart (abandon)
10. Return after 2 minutes
11. Verify Cart Recovery Banner appears
12. Click "Complete Purchase" from banner
13. Complete checkout process
14. Navigate to /admin/analytics
15. Verify all actions tracked:
    - Search query logged
    - Product views recorded
    - Cart additions counted
    - Purchase tracked

### Expected Results
- ✓ All features work together seamlessly
- ✓ No conflicts between components
- ✓ Analytics captures all interactions
- ✓ User flow is intuitive
- ✓ No errors or glitches
- ✓ Performance remains smooth

---

## Critical Issues to Watch

1. **Quick View Modal**
   - Modal doesn't open: Check browser console for errors
   - Images not loading: Verify product has valid image URLs
   - Add to cart fails: Check Supabase connection

2. **Smart Search**
   - No suggestions: Verify `get_search_suggestions` RPC function exists
   - Slow response: Check database indexes on search_suggestions table
   - Suggestions irrelevant: May need more historical data

3. **Smart Recommendations**
   - No products shown: Check product_copurchases table has data
   - Same products always: Need more interaction data over time
   - Slow loading: Verify indexes on product_interactions table

4. **Analytics Tracking**
   - Data not recording: Check user_sessions and product_interactions tables
   - Console errors: Verify Supabase client initialized correctly
   - Missing data: May need to generate test interactions

5. **Cart Recovery Banner**
   - Banner doesn't appear: Check abandoned_carts table for entries
   - Wrong data: Verify cart_data JSON structure
   - Banner stuck: Check dismiss logic in localStorage

6. **Bulk Order Interface**
   - Upload fails: Check file format (must be CSV with SKU,Quantity)
   - Validation fails: Verify products have SKUs in database
   - Submit error: Check bulk_orders table and RLS policies

7. **Admin Dashboard**
   - Empty stats: Need historical data in analytics tables
   - Slow loading: Check database query performance
   - Time range not working: Verify date filtering logic

---

## Database Verification Queries

Run these in Supabase SQL Editor to verify Phase 2 backend:

```sql
-- Check analytics tables exist
SELECT COUNT(*) FROM user_sessions;
SELECT COUNT(*) FROM product_interactions;
SELECT COUNT(*) FROM search_history;
SELECT COUNT(*) FROM abandoned_carts;
SELECT COUNT(*) FROM bulk_orders;

-- Verify RPC functions
SELECT proname FROM pg_proc WHERE proname IN (
  'get_product_recommendations',
  'get_search_suggestions'
);

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN (
  'user_sessions', 'product_interactions', 
  'search_history', 'abandoned_carts'
);
```

---

## Phase 2 Success Criteria

- [ ] All 7 features integrated and functional
- [ ] Quick View works on all product cards
- [ ] Smart Search provides relevant suggestions
- [ ] Recommendations displayed on product pages
- [ ] Analytics tracking all user interactions
- [ ] Cart Recovery Banner shows for abandoned carts
- [ ] Bulk Order Interface processes CSV uploads
- [ ] Admin Dashboard displays accurate stats
- [ ] No TypeScript or runtime errors
- [ ] Performance metrics maintained from Phase 1
- [ ] Mobile responsive across all features
- [ ] Cross-feature integration seamless

---

## Post-Testing Checklist

After completing all test pathways:

1. **Document Issues**
   - List all bugs found
   - Categorize by severity (Critical, High, Medium, Low)
   - Provide reproduction steps

2. **Verify Fixes**
   - Re-test each reported issue
   - Confirm resolution

3. **Performance Audit**
   - Run Lighthouse on 3+ pages
   - Compare to Phase 1 baseline
   - Ensure no regression

4. **User Experience Review**
   - Rate intuitiveness of each feature (1-5)
   - Identify UX improvements
   - Suggest enhancements

5. **Final Sign-Off**
   - All features working: ✓ / ✗
   - Performance acceptable: ✓ / ✗
   - Ready for production: ✓ / ✗

---

**Testing Completed By**: _____________  
**Date**: _____________  
**Overall Status**: ✓ PASS / ✗ FAIL  
**Notes**: _______________________________________

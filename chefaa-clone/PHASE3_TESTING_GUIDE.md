# Phase 3 Testing Guide

## Quick Start

**Deployment URL**: https://clut5478fkv4.space.minimax.io  
**Test Account**: ntqtcbqk@minimax.com / zKhtFq0dHz

---

## Test Pathways

### 1. Trust Badges - Footer Integration (2 min)
**Goal**: Verify professional trust indicators displayed

**Steps**:
1. Visit homepage: https://clut5478fkv4.space.minimax.io
2. Scroll to bottom of page (footer area)
3. Look for security badges section above main footer content

**Expected**:
- ✓ Professional security seals displayed
- ✓ Pharmacy license badge visible
- ✓ GDPR/HIPAA compliance indicators
- ✓ SSL/encryption badge
- ✓ Dark background (gray-800) section
- ✓ Icons: Shield, Award, Lock, CheckCircle

**Verify**:
- Badges load from database (not hardcoded)
- Bilingual support (Arabic/English)
- Responsive on mobile

---

### 2. Security Indicator - Header (1 min)
**Goal**: Verify security icon appears for logged-in users

**Steps**:
1. Login with test account (ntqtcbqk@minimax.com / zKhtFq0dHz)
2. Look at header navigation (top right area)
3. Find green shield icon next to language toggle

**Expected**:
- ✓ Green shield icon visible after login
- ✓ Icon positioned between language toggle and user menu
- ✓ Hover shows tooltip: "Security & Compliance"
- ✓ Clicking navigates to /compliance-center

**Verify**:
- Icon only visible when logged in
- Link navigation works correctly

---

### 3. Compliance Center Page (5 min)
**Goal**: Test user privacy and compliance controls

**URL**: https://clut5478fkv4.space.minimax.io/compliance-center

**Steps**:
1. Click shield icon in header OR navigate directly
2. Review privacy settings section
3. Test consent toggles (marketing, analytics, medical data)
4. Try "Export My Data" button
5. Try "Request Data Deletion" button
6. View personal audit logs

**Expected**:
- ✓ Page loads without errors
- ✓ Privacy settings displayed with toggles
- ✓ Consent management section visible
- ✓ Data access request buttons functional
- ✓ Audit log viewer shows user activity
- ✓ Professional, clean UI
- ✓ Bilingual labels (Arabic/English)

**Verify**:
- Toggles save changes to database
- Export data generates JSON file
- Delete request creates database record
- Audit logs fetch from database
- RLS prevents accessing other users' data

---

### 4. Two-Factor Authentication Page (5 min)
**Goal**: Test 2FA enrollment workflow

**URL**: https://clut5478fkv4.space.minimax.io/2fa

**Steps**:
1. Navigate to /2fa
2. Review method selection (TOTP vs SMS)
3. Select TOTP (Authenticator App)
4. Check QR code placeholder and secret key
5. Note backup codes generation
6. Try verification step (enter any 6 digits to test validation)

**Expected**:
- ✓ Page loads correctly
- ✓ Both methods presented clearly
- ✓ TOTP option shows QR code area
- ✓ SMS option shows phone input
- ✓ Backup codes generated (10 unique codes)
- ✓ Step-by-step workflow clear
- ✓ Professional security-focused design

**Verify**:
- Method selection works
- QR code placeholder visible
- Secret key displayable
- Backup codes copyable
- Verification code input validates (6 digits only)

---

### 5. Checkout Trust Integration (3 min)
**Goal**: Verify trust badges in checkout flow

**Steps**:
1. Browse products and add one to cart
2. Click cart icon in header
3. Proceed to checkout
4. Look at order summary panel (right side)
5. Scroll to bottom of order summary

**Expected**:
- ✓ Trust badges displayed below order total
- ✓ Compact inline variant shown
- ✓ Security seals visible
- ✓ Professional appearance
- ✓ Doesn't disrupt checkout flow

**Verify**:
- Badges integrate seamlessly
- Responsive on mobile
- Builds trust during payment

---

### 6. Security Dashboard - Admin (5 min)
**Goal**: Test admin security monitoring interface

**URL**: https://clut5478fkv4.space.minimax.io/security-dashboard

**Steps**:
1. Navigate to /security-dashboard
2. Review security metrics cards (top section)
3. Check recent security events feed
4. View active user sessions table
5. Test audit log browser with filters

**Expected**:
- ✓ Metrics cards display counts (threats, sessions, events)
- ✓ Security events feed shows recent activity
- ✓ Real-time updates (Supabase Realtime)
- ✓ Active sessions table populated
- ✓ Audit log browser filterable
- ✓ Professional dashboard design

**Verify**:
- Data loads from database
- Realtime subscriptions work
- Filters apply correctly
- Tables sortable
- RLS enforces admin-only access

---

## Component Checklist

### TrustBadges Component
- [ ] Displays in footer
- [ ] Displays in checkout
- [ ] Shows 4+ security badges
- [ ] Fetches from database
- [ ] Bilingual support works
- [ ] Responsive on mobile

### SecurityDashboard Component
- [ ] Metrics cards display data
- [ ] Security events feed populated
- [ ] Real-time updates work
- [ ] Active sessions tracked
- [ ] Audit logs browsable
- [ ] Admin-only access enforced

### ComplianceCenter Component
- [ ] Privacy settings displayed
- [ ] Consent toggles functional
- [ ] Data export works
- [ ] Delete requests work
- [ ] Audit log viewer shows data
- [ ] User can only see own data

### TwoFactorAuth Component
- [ ] Method selection clear
- [ ] TOTP setup flow works
- [ ] SMS setup flow works
- [ ] Backup codes generated
- [ ] Verification validates input
- [ ] Enable/disable workflow complete

### PrescriptionUpload Component
- [ ] File upload works
- [ ] Preview displays images
- [ ] Validates file types
- [ ] Captures patient info
- [ ] Creates verification record
- [ ] Shows verification status

---

## Database Verification

### Tables Created (10)
- [ ] audit_logs
- [ ] security_events
- [ ] two_factor_auth
- [ ] fraud_detection_rules
- [ ] compliance_settings
- [ ] prescription_verifications
- [ ] security_certifications
- [ ] user_consent
- [ ] data_access_logs
- [ ] security_incidents

### RPC Functions (4)
- [ ] detect_fraud()
- [ ] get_security_metrics()
- [ ] check_compliance_status()
- [ ] get_recent_security_events()

### RLS Policies
- [ ] User tables enforce user-only access
- [ ] Admin tables enforce admin-only access
- [ ] Public tables allow read access
- [ ] Write operations properly restricted

---

## Visual Quality Checks

### Overall Design
- [ ] Professional and trustworthy appearance
- [ ] Consistent with existing design system
- [ ] Clear hierarchy and layout
- [ ] Proper spacing and alignment
- [ ] Icons render correctly

### Responsive Design
- [ ] Desktop (1920x1080) - All features visible
- [ ] Tablet (768x1024) - Layout adapts
- [ ] Mobile (375x667) - Usable interface

### Color Scheme
- [ ] Security indicators use green (trust)
- [ ] Warnings use yellow/orange
- [ ] Errors use red
- [ ] Neutral grays for backgrounds
- [ ] Brand colors maintained

### Typography
- [ ] Headings clear and readable
- [ ] Body text appropriate size
- [ ] Bilingual fonts render correctly
- [ ] No text overflow

---

## Functional Quality Checks

### Navigation
- [ ] All new routes accessible
- [ ] Header security icon links work
- [ ] Footer compliance link works
- [ ] Breadcrumbs/back navigation functional

### Forms & Inputs
- [ ] Consent toggles save changes
- [ ] 2FA phone input validates
- [ ] Verification code validates (6 digits)
- [ ] File upload accepts correct formats
- [ ] Required fields enforced

### Data Loading
- [ ] Trust badges fetch certifications
- [ ] Security dashboard loads metrics
- [ ] Audit logs display user activity
- [ ] Real-time events update live
- [ ] Loading states shown appropriately

### Error Handling
- [ ] Invalid inputs show errors
- [ ] Network errors handled gracefully
- [ ] Database errors display user-friendly messages
- [ ] 404 for invalid routes
- [ ] Auth errors redirect to login

---

## Security Quality Checks

### Authentication
- [ ] Shield icon only for logged-in users
- [ ] Compliance center requires login
- [ ] Security dashboard requires login
- [ ] 2FA page requires login

### Authorization
- [ ] Users see only their own data
- [ ] Admin pages blocked for regular users
- [ ] RLS policies enforced
- [ ] Unauthorized access returns 403

### Data Protection
- [ ] Sensitive data not exposed in logs
- [ ] API keys not visible in client
- [ ] User data encrypted in transit
- [ ] Audit logs track access

### Audit Logging
- [ ] Login events logged
- [ ] 2FA changes logged
- [ ] Consent changes logged
- [ ] Data access logged

---

## Performance Checks

### Load Times
- [ ] Homepage loads < 2 seconds
- [ ] Compliance center loads < 1 second
- [ ] Security dashboard loads < 1.5 seconds
- [ ] 2FA page loads < 1 second

### Bundle Size
- [ ] Total bundle ~470 KB (acceptable)
- [ ] Code splitting applied
- [ ] Components lazy-loaded
- [ ] Images optimized

### Database Queries
- [ ] Queries complete < 100ms
- [ ] No N+1 query issues
- [ ] Indexes utilized
- [ ] RPC functions optimized

---

## Bug Reporting Template

If issues found, report using this format:

```markdown
## Bug Report

**Component**: [TrustBadges/SecurityDashboard/etc.]
**Severity**: [Critical/High/Medium/Low]
**URL**: [specific page URL]

### Description
[What went wrong]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Result]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Screenshots
[If applicable]

### Browser/Device
[Chrome 120 / Windows 11 / etc.]
```

---

## Testing Completion Checklist

- [ ] All 6 test pathways completed
- [ ] All components verified
- [ ] Database verification done
- [ ] Visual quality checked
- [ ] Functional quality checked
- [ ] Security quality checked
- [ ] Performance acceptable
- [ ] Bugs documented (if any)
- [ ] Screenshots captured
- [ ] Final report prepared

---

## Success Criteria

Phase 3 is considered successful when:

✅ **Trust Indicators**: Professional badges displayed in footer and checkout  
✅ **Security Features**: 2FA, monitoring, and audit logging functional  
✅ **Compliance Tools**: GDPR/HIPAA controls accessible and working  
✅ **Prescription System**: Upload and verification workflow complete  
✅ **Visual Quality**: Professional, trustworthy design throughout  
✅ **Performance**: Fast load times, optimized bundle  
✅ **Security**: RLS enforced, authentication required, audit logged  
✅ **User Experience**: Clear, intuitive, confidence-building

**Target Security Score**: 95+

---

**Last Updated**: November 2, 2025  
**Testing Status**: Ready for Manual Validation  
**Deployment**: Production (https://clut5478fkv4.space.minimax.io)

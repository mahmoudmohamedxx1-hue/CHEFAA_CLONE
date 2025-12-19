# PWA Testing Guide

## Manual Testing Checklist

### Installation Testing

#### Desktop Installation (Chrome)
- [ ] Visit the website in Chrome
- [ ] Check for install icon in address bar or toolbar
- [ ] Click install button
- [ ] Confirm installation in dialog
- [ ] Verify app appears in applications menu
- [ ] Launch app and verify standalone mode
- [ ] Check app icon is properly set

#### Mobile Installation (iOS)
- [ ] Visit website in Safari
- [ ] Tap Share button
- [ ] Scroll down and tap "Add to Home Screen"
- [ ] Confirm installation
- [ ] Verify icon appears on home screen
- [ ] Launch app and verify it opens in standalone mode

#### Mobile Installation (Android)
- [ ] Visit website in Chrome
- [ ] Wait for install banner or check menu for "Add to Home Screen"
- [ ] Tap install button or menu item
- [ ] Confirm installation
- [ ] Verify app appears in app drawer
- [ ] Launch app and verify standalone mode

### Offline Functionality Testing

#### Basic Offline Testing
- [ ] Visit website while online
- [ ] Turn off network connection
- [ ] Refresh page - should load from cache
- [ ] Navigate to different pages - should work offline
- [ ] Add items to cart while offline
- [ ] Check that cart data persists

#### Offline Data Testing
- [ ] Turn on network
- [ ] Browse products and add to cart
- [ ] Turn off network
- [ ] Check cached products are available
- [ ] Verify offline cart shows correct items
- [ ] Turn network back on
- [ ] Verify queued requests sync properly

### Push Notifications Testing

#### Permission Testing
- [ ] Visit website in browser that supports notifications
- [ ] Look for notification permission prompt
- [ ] Grant permission
- [ ] Check browser settings for notification permission
- [ ] Deny permission (test denial flow)
- [ ] Revoke permission and test re-request

#### Notification Display Testing
- [ ] Enable notifications
- [ ] Perform actions that trigger notifications
- [ ] Verify notifications appear with correct styling
- [ ] Test notification actions (buttons)
- [ ] Verify notification data is passed correctly
- [ ] Check notification closes properly

#### Subscription Testing
- [ ] Enable notifications
- [ ] Check that subscription is created
- [ ] Reload page and verify subscription persists
- [ ] Test notification delivery
- [ ] Disable notifications and verify cleanup

### Update Testing

#### Update Detection
- [ ] Deploy new version of service worker
- [ ] Visit website with old version
- [ ] Check for update notification
- [ ] Verify update prompt appears correctly

#### Update Installation
- [ ] Accept update when prompted
- [ ] Verify app updates without crashing
- [ ] Check that new features work
- [ ] Verify no data is lost during update
- [ ] Test update on different browsers

### Performance Testing

#### Service Worker Performance
- [ ] Test cold load time (first visit)
- [ ] Test warm load time (subsequent visits)
- [ ] Verify caching improves performance
- [ ] Check service worker doesn't block main thread
- [ ] Test background sync performance

#### Memory Usage
- [ ] Monitor memory usage over time
- [ ] Check for memory leaks
- [ ] Verify cache cleanup works
- [ ] Test with large amounts of cached data

### Cross-Browser Testing

#### Chrome (Desktop & Mobile)
- [ ] All PWA features work
- [ ] Install prompt appears
- [ ] Service worker registers
- [ ] Notifications work
- [ ] Offline mode functions

#### Firefox
- [ ] All PWA features work
- [ ] Install prompt appears (if supported)
- [ ] Service worker registers
- [ ] Notifications work (if supported)
- [ ] Offline mode functions

#### Safari (Desktop & iOS)
- [ ] Service worker registers
- [ ] Add to Home Screen works
- [ ] Offline mode functions
- [ ] Check iOS-specific behavior
- [ ] Verify no crash on install

#### Edge
- [ ] All PWA features work
- [ ] Install prompt appears
- [ ] Service worker registers
- [ ] Notifications work
- [ ] Offline mode functions

## Automated Testing

### Service Worker Tests

```javascript
// Service Worker Registration Test
describe('Service Worker', () => {
  beforeEach(() => {
    // Clean up any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  });

  test('should register service worker successfully', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    expect(registration).toBeDefined();
    expect(registration.scope).toBe('/');
  });

  test('should install required assets', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await new Promise(resolve => {
      registration.addEventListener('updatefound', resolve);
    });
    
    const newWorker = registration.installing;
    expect(newWorker).toBeDefined();
  });
});

// Cache Tests
describe('Caching', () => {
  test('should cache app shell', async () => {
    const cache = await caches.open('app-shell');
    const response = await cache.match('/');
    expect(response).toBeDefined();
  });

  test('should serve cached content when offline', async () => {
    // Simulate offline
    const online = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    
    const response = await fetch('/');
    expect(response.ok).toBe(true);
    
    // Restore online status
    Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
  });
});

// Push Notification Tests
describe('Push Notifications', () => {
  test('should request permission', async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    expect(['granted', 'denied']).toContain(permission);
  });

  test('should show notification', async () => {
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const notification = new Notification('Test Notification', {
      body: 'This is a test notification',
      icon: '/icon-192.png'
    });

    expect(notification).toBeDefined();
    notification.close();
  });
});
```

### PWA Manifest Tests

```javascript
describe('Web App Manifest', () => {
  test('should have valid manifest', async () => {
    const response = await fetch('/manifest.json');
    const manifest = await response.json();
    
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have required icon sizes', async () => {
    const response = await fetch('/manifest.json');
    const manifest = await response.json();
    
    const requiredSizes = ['192x192', '512x512'];
    const hasRequiredIcons = manifest.icons.some(icon => 
      requiredSizes.includes(icon.sizes) && icon.purpose.includes('any')
    );
    
    expect(hasRequiredIcons).toBe(true);
  });
});
```

### Lighthouse PWA Audits

```bash
# Run Lighthouse PWA audit
lighthouse https://your-app-url.com --only-categories=pwa --output=html --output-path=./pwa-audit.html

# PWA Audit Checklist
# - Service Worker registered
# - Manifest is valid
# - Site is served over HTTPS
# - Pages are responsive
# - All links have descriptive text
# - Has a viewport meta tag
# - Content is sized correctly for viewport
# - Installable (if applicable)
# - Uses HTTPS
# - Redirects HTTP to HTTPS
# - Has a Service Worker
# - Page load is fast enough on 3G
# - Content appears quickly
# - Interactive at 4G
# - Has a theme-color meta tag
```

## Test Data

### Test Products for Caching
```javascript
const testProducts = [
  {
    id: 'test-1',
    name: 'Panadol 500mg',
    price: 5.99,
    category: 'pain-relief',
    image: '/images/panadol-500mg.jpg'
  },
  {
    id: 'test-2',
    name: 'CeraVe Moisturizing Lotion',
    price: 12.99,
    category: 'skincare',
    image: '/images/cerave-lotion.jpg'
  }
];

// Store for offline testing
localStorage.setItem('pwa-offline-data-products', JSON.stringify({
  products: testProducts,
  timestamp: Date.now()
}));
```

### Test Cart Data
```javascript
const testCart = {
  items: [
    {
      id: 'test-1',
      name: 'Panadol 500mg',
      price: 5.99,
      quantity: 2
    }
  ],
  total: 11.98
};

localStorage.setItem('pwa-offline-data-cart', JSON.stringify(testCart));
```

## Performance Testing

### Core Web Vitals
```javascript
// Measure FCP
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
  if (fcp) {
    console.log('FCP:', fcp.startTime);
  }
}).observe({ entryTypes: ['paint'] });

// Measure LCP
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.startTime);
}).observe({ entryTypes: ['largest-contentful-paint'] });

// Measure CLS
let clsValue = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
    }
  }
  console.log('CLS:', clsValue);
}).observe({ entryTypes: ['layout-shift'] });
```

### Load Testing
```javascript
// Test multiple page loads
for (let i = 0; i < 10; i++) {
  const startTime = performance.now();
  await fetch('/');
  const loadTime = performance.now() - startTime;
  console.log(`Load ${i + 1}: ${loadTime}ms`);
}
```

## Browser-Specific Testing

### Chrome Testing
```javascript
// Test Chrome-specific features
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.ready;
  console.log('Chrome SW ready:', registration);
}

// Test background sync
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  console.log('Background sync supported');
}
```

### Safari Testing
```javascript
// Test iOS Add to Home Screen
if (window.navigator.standalone) {
  console.log('Running in iOS standalone mode');
}

// Test iOS-specific notification behavior
if (typeof DeviceMotionEvent !== 'undefined') {
  console.log('iOS motion events supported');
}
```

## Continuous Integration

### GitHub Actions PWA Test
```yaml
name: PWA Tests
on: [push, pull_request]

jobs:
  pwa-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build PWA
        run: npm run build
      
      - name: Start test server
        run: npm run serve &
      
      - name: Run PWA tests
        run: npm test
      
      - name: Run Lighthouse audit
        run: |
          npx lighthouse http://localhost:3000 \
            --only-categories=pwa \
            --output=json \
            --output-path=./lighthouse-results.json
```

## Test Scenarios

### E-commerce Scenarios
1. **Browse → Add to Cart → Go Offline → Checkout (should queue)**
2. **Install → Add to Cart → Update Available → Update**
3. **Go Offline → Browse Products → Add to Cart → Back Online → Sync**
4. **Enable Notifications → Order Product → Receive Delivery Update**
5. **Add to Home Screen → Launch → Use All Features**

### Error Scenarios
1. **Service worker fails to register**
2. **Network offline during install**
3. **Push notification permission denied**
4. **Cache storage full**
5. **Update fails to apply**

### Performance Scenarios
1. **Cold start on 3G**
2. **Warm start from cache**
3. **Background sync with large data**
4. **Notification while app is closed**
5. **Update while using app**

## Debugging Tools

### Chrome DevTools
- Application tab → Service Workers
- Application tab → Storage (Cache, Local Storage)
- Application tab → Manifest
- Network tab → Check caching behavior
- Lighthouse → PWA audit

### Firefox DevTools
- Storage tab → Check caches
- Application tab → Service Workers
- Network tab → Verify offline behavior

### Safari DevTools
- Storage → Local Storage, IndexedDB
- Application → Service Workers
- iOS Simulator for device testing

### Browser Extensions
- Lighthouse
- PWA Builder
- Web Server for Chrome
- PWA Demo
- Service Worker Test

## Known Issues and Solutions

### Service Worker Issues
1. **SW not updating**: Clear browser cache, check version number
2. **Fetch failing**: Check CORS headers, verify HTTPS
3. **Cache not working**: Check cache name, verify assets

### Push Notification Issues
1. **Permission not granted**: Check site is HTTPS, user gesture required
2. **Not receiving**: Check subscription, server push endpoint
3. **Not showing**: Check notification permission, service worker scope

### Install Issues
1. **Install prompt not showing**: Check engagement criteria, browser support
2. **Install fails**: Check manifest, HTTPS requirement
3. **Icon not showing**: Check icon sizes, format, manifest entry

### Offline Issues
1. **Page not loading**: Check service worker registration, cache strategy
2. **Data not syncing**: Check background sync, network connectivity
3. **Cache full**: Implement cache cleanup, limit cache size

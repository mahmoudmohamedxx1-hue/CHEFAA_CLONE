/**
 * Enhanced Service Worker for Chefaa E-commerce Platform
 * Handles background sync, offline notifications, and advanced caching
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { 
  NetworkFirst, 
  CacheFirst, 
  StaleWhileRevalidate,
  NetworkOnly 
} from 'workbox-strategies';
import { 
  ExpirationPlugin, 
  CacheableResponsePlugin,
  BackgroundSyncPlugin
} from 'workbox-precaching';
import { BackgroundSync } from 'workbox-background-sync';

// Extend Workbox's precache list
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// Cache names
const CACHE_NAMES = {
  static: 'chefaa-static-v1',
  images: 'chefaa-images-v1',
  api: 'chefaa-api-v1',
  products: 'chefaa-products-v1',
  userData: 'chefaa-user-data-v1'
};

// Enhanced caching strategies
// 1. API requests - NetworkFirst with offline fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: CACHE_NAMES.api,
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })
    ]
  })
);

// 2. Images - CacheFirst with compression
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// 3. Product catalog - NetworkFirst with background sync
registerRoute(
  ({ url }) => url.pathname.includes('/products'),
  new NetworkFirst({
    cacheName: CACHE_NAMES.products,
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// 4. Static resources - StaleWhileRevalidate
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.static,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Background Sync Queues
const cartSyncQueue = new BackgroundSync('cart-sync-queue', {
  maxRetentionTime: 24 * 60 // 24 hours in minutes
});

const orderSyncQueue = new BackgroundSync('order-sync-queue', {
  maxRetentionTime: 24 * 60 // 24 hours in minutes
});

const userDataSyncQueue = new BackgroundSync('user-data-sync-queue', {
  maxRetentionTime: 24 * 60 // 24 hours in minutes
});

// Background Sync for cart operations
registerRoute(
  ({ url }) => url.pathname.includes('/api/cart'),
  new NetworkOnly({
    plugins: [cartSyncQueue]
  }),
  'POST'
);

registerRoute(
  ({ url }) => url.pathname.includes('/api/cart'),
  new NetworkOnly({
    plugins: [cartSyncQueue]
  }),
  'PUT'
);

registerRoute(
  ({ url }) => url.pathname.includes('/api/cart'),
  new NetworkOnly({
    plugins: [cartSyncQueue]
  }),
  'DELETE'
);

// Background Sync for orders
registerRoute(
  ({ url }) => url.pathname.includes('/api/orders'),
  new NetworkOnly({
    plugins: [orderSyncQueue]
  }),
  'POST'
);

// Background Sync for user data
registerRoute(
  ({ url }) => url.pathname.includes('/api/user'),
  new NetworkOnly({
    plugins: [userDataSyncQueue]
  }),
  'PUT'
);

// Service Worker Events
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Precache critical resources
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/manifest.json'
      ]).catch(console.error);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  // Take control of all clients
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background Sync Event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Notify all clients that background sync started
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_STARTED',
        timestamp: new Date().toISOString()
      });
    });

    // Here you could add logic to sync IndexedDB data
    // This would be integrated with the offlineStorage system
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: 'You have new notifications!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/icons/xmark.png'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(
    self.registration.showNotification('Chefaa App', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        // Focus existing tab if available
        for (const client of clients) {
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Message Handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CACHE_PRODUCTS':
        cacheProducts(event.data.products);
        break;
        
      case 'CLEAR_CACHE':
        clearSpecificCache(event.data.cacheName);
        break;
        
      case 'GET_CACHE_SIZE':
        getCacheSize().then(size => {
          event.ports[0].postMessage({ size });
        });
        break;
        
      default:
        console.log('[SW] Unknown message type:', event.data.type);
    }
  }
});

async function cacheProducts(products) {
  try {
    const cache = await caches.open(CACHE_NAMES.products);
    await cache.put('/api/products/cached', new Response(JSON.stringify(products)));
    console.log('[SW] Products cached successfully');
  } catch (error) {
    console.error('[SW] Failed to cache products:', error);
  }
}

async function clearSpecificCache(cacheName) {
  try {
    await caches.delete(cacheName);
    console.log('[SW] Cache cleared:', cacheName);
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
  }
}

async function getCacheSize() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      totalSize += requests.length;
    }
    
    return totalSize;
  } catch (error) {
    console.error('[SW] Failed to get cache size:', error);
    return 0;
  }
}

// Network Status Change Detection
self.addEventListener('online', () => {
  console.log('[SW] Network online');
  
  // Notify clients of network restoration
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_ONLINE',
        timestamp: new Date().toISOString()
      });
    });
  });
});

self.addEventListener('offline', () => {
  console.log('[SW] Network offline');
  
  // Notify clients of network loss
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_OFFLINE',
        timestamp: new Date().toISOString()
      });
    });
  });
});

// Cache Management Functions
export async function getOfflineFallbackResponse(request) {
  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    return caches.match('/offline.html') || 
           new Response('Offline - Please check your connection', {
             headers: { 'Content-Type': 'text/plain' }
           });
  }
  
  // For API requests, return cached response or offline message
  if (request.url.includes('/api/')) {
    return new Response(JSON.stringify({ 
      error: 'Offline',
      message: 'This feature is not available offline',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // For other requests, try cache first
  const cachedResponse = await caches.match(request);
  return cachedResponse || new Response('Resource not found offline', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Periodic Background Sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-sync') {
      event.waitUntil(syncContent());
    }
  });
}

async function syncContent() {
  try {
    // Sync product catalog and user data
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}
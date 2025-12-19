/**
 * Enhanced Service Worker for PWA
 * Provides advanced caching, background sync, and offline capabilities
 */

// Version for cache management
const VERSION = '2.0.0';
const CACHE_NAME = `pharmacare-pwa-${VERSION}`;
const RUNTIME_CACHE = 'runtime-cache';
const MEDICATION_CACHE = 'medication-data-cache';
const PRESCRIPTION_CACHE = 'prescription-cache';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cacheFirst',
  NETWORK_FIRST: 'networkFirst',
  STALE_WHILE_REVALIDATE: 'staleWhileRevalidate',
  NETWORK_ONLY: 'networkOnly',
  CACHE_ONLY: 'cacheOnly'
};

// Cache configuration
const CACHE_CONFIG = {
  appShell: {
    pattern: /\/(assets\/|\/images\/|\.js|\.css|\.woff2?|\.png|\.jpg|\.jpeg|\.svg|\.webp)/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100
  },
  api: {
    pattern: /\/api\/(products|categories|user|cart)/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  images: {
    pattern: /\.(png|jpg|jpeg|svg|webp|avif)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  },
  static: {
    pattern: /\.(js|css|woff2?)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50
  },
  // Healthcare-specific caching
  medications: {
    pattern: /\/api\/(products|medications|drugs)/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 60 * 60 * 1000, // 1 hour (medication data should be relatively fresh)
    maxEntries: 500,
    cacheName: MEDICATION_CACHE
  },
  prescriptions: {
    pattern: /\/api\/prescriptions/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100,
    cacheName: PRESCRIPTION_CACHE
  },
  userHealth: {
    pattern: /\/api\/(user\/health|medical-history|allergies)/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 30 * 60 * 1000, // 30 minutes
    maxEntries: 50
  }
};

// API endpoints that support background sync
const SYNC_ENDPOINTS = [
  '/api/cart/add',
  '/api/cart/remove',
  '/api/cart/update',
  '/api/orders',
  '/api/prescriptions',
  '/api/user/preferences'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/offline.html'
        ]);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('pharmacare-pwa-') && cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle POST/PUT/DELETE requests for offline queuing
    if (SYNC_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
      event.respondWith(handleApiRequest(request));
    }
    return;
  }
  
  // Skip external requests (except our API)
  if (!url.pathname.startsWith('/') && !url.hostname.includes('supabase.co')) {
    return;
  }
  
  // Apply caching strategy
  event.respondWith(handleRequest(request));
});

// Handle API requests with offline queue
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      return response;
    }
    
    throw new Error('Network response was not ok');
  } catch (error) {
    console.log('Network request failed, queueing for sync:', request.url);
    
    // Queue request for later sync
    await queueRequest(request);
    
    // Return a response indicating the request was queued
    return new Response(JSON.stringify({
      queued: true,
      message: 'Request queued for sync when online'
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle general requests with caching
async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Check for custom offline page
  if (request.mode === 'navigate') {
    try {
      const networkResponse = await fetch(request);
      return networkResponse;
    } catch (error) {
      // Fallback to offline page
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match('/offline.html');
      return cachedResponse || new Response('Offline', { status: 503 });
    }
  }
  
  // Apply caching strategy based on URL pattern
  const strategy = getCacheStrategy(url.pathname);
  
  switch (strategy.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, strategy);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, strategy);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, strategy);
    default:
      return fetch(request);
  }
}

// Cache first strategy
async function cacheFirst(request, config) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    throw error;
  }
}

// Network first strategy
async function networkFirst(request, config) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network first, falling back to cache:', request.url);
    
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, config) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in the background
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.log('Background revalidation failed:', error);
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network response if no cache
  try {
    return await networkResponsePromise;
  } catch (error) {
    throw error;
  }
}

// Get cache strategy for URL
function getCacheStrategy(pathname) {
  for (const [name, config] of Object.entries(CACHE_CONFIG)) {
    if (config.pattern.test(pathname)) {
      return config;
    }
  }
  
  // Default strategy
  return {
    pattern: /.*/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  };
}

// Queue request for background sync
async function queueRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: Date.now()
    };
    
    // Add body for POST/PUT requests
    if (request.method === 'POST' || request.method === 'PUT') {
      requestData.body = await request.text();
    }
    
    // Get existing queue from IndexedDB
    const db = await openDB();
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    
    await store.add(requestData);
    
    // Register background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-offline-requests');
    }
    
    console.log('Request queued for sync:', requestData);
  } catch (error) {
    console.error('Failed to queue request:', error);
  }
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-requests') {
    event.waitUntil(processOfflineQueue());
  }
});

// Process queued offline requests
async function processOfflineQueue() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    
    const requests = await store.getAll();
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          // Remove from queue on success
          await store.delete(requestData.id);
          console.log('Synced offline request:', requestData.url);
        }
      } catch (error) {
        console.error('Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('Failed to process offline queue:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: data.data,
    actions: data.actions,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag,
    renotify: data.renotify || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  
  if (action) {
    // Handle action buttons
    event.waitUntil(
      handleNotificationAction(action, data)
    );
  } else {
    // Handle notification click (open app)
    event.waitUntil(
      clients.openWindow(data?.url || '/')
    );
  }
});

// Handle notification actions
async function handleNotificationAction(action, data) {
  const url = getActionUrl(action, data);
  
  if (url) {
    const clientList = await clients.matchAll({ type: 'window' });
    
    // Check if app is already open
    for (const client of clientList) {
      if (client.url === url && 'focus' in client) {
        return client.focus();
      }
    }
    
    // Open new window
    return clients.openWindow(url);
  }
}

// Get URL for notification action
function getActionUrl(action, data) {
  const urlMap = {
    'view': data?.url || '/',
    'track': '/track-delivery',
    'add': '/cart',
    'schedule': '/prescriptions',
    'locate': '/pharmacy-network'
  };
  
  return urlMap[action] || data?.url || '/';
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: VERSION });
      break;
    case 'CLEAR_CACHE':
      clearCache().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage(status);
      });
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Clear all caches
async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return {
    version: VERSION,
    caches: status,
    totalKeys: Object.values(status).reduce((sum, count) => sum + count, 0)
  };
}

// IndexedDB helper functions
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PWAOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Create requests store
      if (!db.objectStoreNames.contains('requests')) {
        const store = db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
      
      // Create data store
      if (!db.objectStoreNames.contains('data')) {
        const store = db.createObjectStore('data', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

console.log('Enhanced Service Worker loaded successfully');

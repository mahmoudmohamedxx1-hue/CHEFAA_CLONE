/**
 * Comprehensive Offline Storage System
 * Handles IndexedDB operations for products, cart, user data, and synchronization queue
 */

export interface Product {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  price: number;
  images: string[];
  category: string;
  description: string;
  description_ar: string;
  prescription_required: boolean;
  in_stock: boolean;
  stock_quantity: number;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  sync_status: 'pending' | 'synced' | 'error';
  version: number;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  medical_history?: string[];
  allergies?: string[];
  prescriptions?: string[];
  last_sync: string;
  version: number;
}

export interface MedicalRecord {
  id: string;
  user_id: string;
  type: 'prescription' | 'allergy' | 'medical_condition' | 'medication';
  title: string;
  content: string;
  date: string;
  attachment_url?: string;
  sync_status: 'pending' | 'synced' | 'error';
  version: number;
}

export interface OfflineOrder {
  id: string;
  user_id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
  sync_status: 'pending' | 'synced' | 'error';
  error_message?: string;
  version: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'cart_update' | 'order' | 'user_update' | 'medical_record';
  data: any;
  timestamp: string;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface ConflictResolution {
  entity_type: 'product' | 'cart' | 'user' | 'medical_record';
  entity_id: string;
  local_version: number;
  server_version: number;
  local_data: any;
  server_data: any;
  resolution_strategy: 'use_local' | 'use_server' | 'merge' | 'manual';
  resolved_data?: any;
}

class OfflineStorageManager {
  private dbName = 'ChefaaOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('updated_at', 'updated_at', { unique: false });
          productStore.createIndex('slug', 'slug', { unique: false });
        }

        // Cart items store
        if (!db.objectStoreNames.contains('cart')) {
          const cartStore = db.createObjectStore('cart', { keyPath: 'id' });
          cartStore.createIndex('sync_status', 'sync_status', { unique: false });
          cartStore.createIndex('product_id', 'product_id', { unique: false });
        }

        // User data store
        if (!db.objectStoreNames.contains('user_data')) {
          const userStore = db.createObjectStore('user_data', { keyPath: 'id' });
          userStore.createIndex('version', 'version', { unique: false });
        }

        // Medical records store
        if (!db.objectStoreNames.contains('medical_records')) {
          const medicalStore = db.createObjectStore('medical_records', { keyPath: 'id' });
          medicalStore.createIndex('user_id', 'user_id', { unique: false });
          medicalStore.createIndex('sync_status', 'sync_status', { unique: false });
          medicalStore.createIndex('type', 'type', { unique: false });
        }

        // Offline orders store
        if (!db.objectStoreNames.contains('offline_orders')) {
          const orderStore = db.createObjectStore('offline_orders', { keyPath: 'id' });
          orderStore.createIndex('user_id', 'user_id', { unique: false });
          orderStore.createIndex('sync_status', 'sync_status', { unique: false });
          orderStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Conflicts store
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictStore.createIndex('entity_type', 'entity_type', { unique: false });
          conflictStore.createIndex('entity_id', 'entity_id', { unique: false });
        }

        // Cache metadata store
        if (!db.objectStoreNames.contains('cache_metadata')) {
          db.createObjectStore('cache_metadata', { keyPath: 'cache_name' });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // Product Cache Management
  async cacheProducts(products: Product[]): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');

    for (const product of products) {
      store.put(product);
    }

    // Update cache metadata
    await this.updateCacheMetadata('products', {
      last_updated: new Date().toISOString(),
      count: products.length,
      version: Date.now()
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCachedProducts(filters?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    const db = await this.getDB();
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let products = request.result as Product[];

        // Apply filters
        if (filters?.category) {
          products = products.filter(p => p.category === filters.category);
        }

        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          products = products.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.name_ar.includes(filters.search) ||
            p.description.toLowerCase().includes(searchLower)
          );
        }

        // Apply pagination
        if (filters?.offset) {
          products = products.slice(filters.offset);
        }
        if (filters?.limit) {
          products = products.slice(0, filters.limit);
        }

        resolve(products);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedProduct(slug: string): Promise<Product | null> {
    const db = await this.getDB();
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const index = store.index('slug');

    return new Promise((resolve, reject) => {
      const request = index.get(slug);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Cart Management
  async addToCart(item: Omit<CartItem, 'id' | 'added_at' | 'sync_status' | 'version'>): Promise<string> {
    const cartItem: CartItem = {
      ...item,
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      added_at: new Date().toISOString(),
      sync_status: 'pending',
      version: 1
    };

    const db = await this.getDB();
    const transaction = db.transaction(['cart', 'sync_queue'], 'readwrite');
    
    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore('cart').put(cartItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}`,
      type: 'cart_update',
      data: cartItem,
      timestamp: new Date().toISOString(),
      retry_count: 0,
      max_retries: 3,
      status: 'pending'
    };

    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore('sync_queue').put(syncItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(cartItem.id);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async updateCartItem(id: string, updates: Partial<CartItem>): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['cart', 'sync_queue'], 'readwrite');

    // Get existing item
    const existing = await new Promise<CartItem>((resolve, reject) => {
      const request = transaction.objectStore('cart').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (existing) {
      const updated = { ...existing, ...updates, version: existing.version + 1 };
      
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('cart').put(updated);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Add to sync queue
      const syncItem: SyncQueueItem = {
        id: `sync_${Date.now()}`,
        type: 'cart_update',
        data: updated,
        timestamp: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending'
      };

      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('sync_queue').put(syncItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCartItems(): Promise<CartItem[]> {
    const db = await this.getDB();
    const transaction = db.transaction(['cart'], 'readonly');
    const store = transaction.objectStore('cart');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as CartItem[]);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromCart(id: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['cart'], 'readwrite');
    const store = transaction.objectStore('cart');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // User Data Management
  async saveUserData(userData: UserData): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['user_data', 'sync_queue'], 'readwrite');
    
    const updatedData = {
      ...userData,
      last_sync: new Date().toISOString()
    };

    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore('user_data').put(updatedData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}`,
      type: 'user_update',
      data: updatedData,
      timestamp: new Date().toISOString(),
      retry_count: 0,
      max_retries: 3,
      status: 'pending'
    };

    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore('sync_queue').put(syncItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getUserData(userId: string): Promise<UserData | null> {
    const db = await this.getDB();
    const transaction = db.transaction(['user_data'], 'readonly');
    const store = transaction.objectStore('user_data');

    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Medical Records Management
  async saveMedicalRecord(record: MedicalRecord): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['medical_records', 'sync_queue'], 'readwrite');

    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore('medical_records').put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}`,
      type: 'medical_record',
      data: record,
      timestamp: new Date().toISOString(),
      retry_count: 0,
      max_retries: 3,
      status: 'pending'
    };

    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore('sync_queue').put(syncItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getMedicalRecords(userId: string): Promise<MedicalRecord[]> {
    const db = await this.getDB();
    const transaction = db.transaction(['medical_records'], 'readonly');
    const store = transaction.objectStore('medical_records');
    const index = store.index('user_id');

    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result as MedicalRecord[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Offline Orders Management
  async createOfflineOrder(order: Omit<OfflineOrder, 'id' | 'created_at' | 'sync_status' | 'version'>): Promise<string> {
    const offlineOrder: OfflineOrder = {
      ...order,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      sync_status: 'pending',
      version: 1
    };

    const db = await this.getDB();
    const transaction = db.transaction(['offline_orders', 'sync_queue'], 'readwrite');

    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore('offline_orders').put(offlineOrder);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    const syncItem: SyncQueueItem = {
      id: `sync_${Date.now()}`,
      type: 'order',
      data: offlineOrder,
      timestamp: new Date().toISOString(),
      retry_count: 0,
      max_retries: 3,
      status: 'pending'
    };

    await new Promise<void>((resolve, reject) => {
      const request = transaction.objectStore('sync_queue').put(syncItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(offlineOrder.id);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getOfflineOrders(userId: string): Promise<OfflineOrder[]> {
    const db = await this.getDB();
    const transaction = db.transaction(['offline_orders'], 'readonly');
    const store = transaction.objectStore('offline_orders');
    const index = store.index('user_id');

    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result as OfflineOrder[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue Management
  async getSyncQueueItems(status?: SyncQueueItem['status']): Promise<SyncQueueItem[]> {
    const db = await this.getDB();
    const transaction = db.transaction(['sync_queue'], 'readonly');
    const store = transaction.objectStore('sync_queue');

    if (status) {
      const index = store.index('status');
      return new Promise((resolve, reject) => {
        const request = index.getAll(status);
        request.onsuccess = () => resolve(request.result as SyncQueueItem[]);
        request.onerror = () => reject(request.error);
      });
    }

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as SyncQueueItem[]);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');

    // Get existing item
    const existing = await new Promise<SyncQueueItem>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (existing) {
      const updated = { ...existing, ...updates };
      
      return new Promise((resolve, reject) => {
        const request = store.put(updated);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['sync_queue'], 'readwrite');
    const store = transaction.objectStore('sync_queue');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Conflict Resolution
  async addConflict(conflict: ConflictResolution): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['conflicts'], 'readwrite');
    const store = transaction.objectStore('conflicts');

    return new Promise((resolve, reject) => {
      const request = store.put(conflict);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConflicts(): Promise<ConflictResolution[]> {
    const db = await this.getDB();
    const transaction = db.transaction(['conflicts'], 'readonly');
    const store = transaction.objectStore('conflicts');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as ConflictResolution[]);
      request.onerror = () => reject(request.error);
    });
  }

  async resolveConflict(conflictId: string, resolution: 'use_local' | 'use_server' | 'merge', resolvedData?: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['conflicts'], 'readwrite');
    const store = transaction.objectStore('conflicts');

    const conflict = await new Promise<ConflictResolution>((resolve, reject) => {
      const request = store.get(conflictId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (conflict) {
      let dataToResolve = conflict.local_data;
      
      if (resolution === 'use_server') {
        dataToResolve = conflict.server_data;
      } else if (resolution === 'merge' && resolvedData) {
        dataToResolve = resolvedData;
      }

      // Update the entity with resolved data
      await this.updateEntityWithConflictResolution(conflict.entity_type, conflict.entity_id, dataToResolve);
      
      // Remove from conflicts
      return new Promise((resolve, reject) => {
        const request = store.delete(conflictId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  private async updateEntityWithConflictResolution(entityType: string, entityId: string, data: any): Promise<void> {
    const storeName = entityType === 'product' ? 'products' : 
                      entityType === 'cart' ? 'cart' : 
                      entityType === 'user' ? 'user_data' : 'medical_records';

    const db = await this.getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put({ ...data, id: entityId });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache Metadata Management
  private async updateCacheMetadata(cacheName: string, metadata: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction(['cache_metadata'], 'readwrite');
    const store = transaction.objectStore('cache_metadata');

    return new Promise((resolve, reject) => {
      const request = store.put({ cache_name: cacheName, ...metadata });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCacheMetadata(cacheName: string): Promise<any> {
    const db = await this.getDB();
    const transaction = db.transaction(['cache_metadata'], 'readonly');
    const store = transaction.objectStore('cache_metadata');

    return new Promise((resolve, reject) => {
      const request = store.get(cacheName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup Methods
  async clearExpiredCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> { // 7 days default
    const db = await this.getDB();
    const transaction = db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    const index = store.index('updated_at');

    const cutoffTime = new Date(Date.now() - maxAgeMs).toISOString();
    
    return new Promise((resolve, reject) => {
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (used / quota) * 100 : 0;

      return { used, quota, percentage };
    }

    return { used: 0, quota: 0, percentage: 0 };
  }

  // Database Management
  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    const storeNames = Array.from(db.objectStoreNames);
    
    const transaction = db.transaction(storeNames, 'readwrite');
    
    for (const storeName of storeNames) {
      transaction.objectStore(storeName).clear();
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async exportData(): Promise<any> {
    const db = await this.getDB();
    const storeNames = Array.from(db.objectStoreNames);
    const data: any = {};

    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          data[storeName] = request.result;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }

    return data;
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();
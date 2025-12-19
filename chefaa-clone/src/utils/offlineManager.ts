/**
 * PWA Offline Management System
 * Handles offline detection, caching strategies, and offline data preview
 */

interface OfflineData {
  [key: string]: any;
}

interface CacheStrategy {
  name: string;
  match: (url: string) => boolean;
  strategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate' | 'networkOnly' | 'cacheOnly';
  maxAge?: number;
  maxEntries?: number;
}

interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineManager {
  private isOnline: boolean = navigator.onLine;
  private offlineQueue: OfflineQueueItem[] = [];
  private syncInProgress = false;
  private maxQueueSize = 100;
  private readonly queueStorageKey = 'pwa-offline-queue';
  private readonly dataStorageKey = 'pwa-offline-data';
  private readonly syncEndpoint = '/api/sync-offline-data';

  // Define cache strategies
  private cacheStrategies: CacheStrategy[] = [
    {
      name: 'app-shell',
      match: (url) => url.includes('/assets/') || url.includes('/images/'),
      strategy: 'cacheFirst',
      maxAge: 86400000, // 24 hours
      maxEntries: 50
    },
    {
      name: 'api-data',
      match: (url) => url.includes('/api/products') || url.includes('/api/categories'),
      strategy: 'staleWhileRevalidate',
      maxAge: 3600000, // 1 hour
      maxEntries: 100
    },
    {
      name: 'user-data',
      match: (url) => url.includes('/api/user') || url.includes('/api/profile'),
      strategy: 'networkFirst',
      maxAge: 300000, // 5 minutes
      maxEntries: 20
    },
    {
      name: 'cart-data',
      match: (url) => url.includes('/api/cart'),
      strategy: 'networkFirst',
      maxAge: 60000, // 1 minute
      maxEntries: 10
    }
  ];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize offline manager
   */
  private initialize(): void {
    this.setupOnlineOfflineListeners();
    this.loadOfflineQueue();
    this.loadOfflineData();
    this.setupPeriodicSync();
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onBackOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onGoneOffline();
    });
  }

  /**
   * Check if currently online
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get offline status with details
   */
  getOfflineStatus(): {
    isOnline: boolean;
    connectionType?: string;
    offlineQueueSize: number;
    hasOfflineData: boolean;
  } {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    return {
      isOnline: this.isOnline,
      connectionType: connection?.effectiveType,
      offlineQueueSize: this.offlineQueue.length,
      hasOfflineData: this.hasOfflineData()
    };
  }

  /**
   * Add item to offline queue
   */
  addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    if (this.offlineQueue.length >= this.maxQueueSize) {
      // Remove oldest item
      this.offlineQueue.shift();
    }

    const queueItem: OfflineQueueItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();

    // Try to sync if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Process offline queue
   */
  async processQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const successfulItems: string[] = [];

    try {
      for (const item of [...this.offlineQueue]) {
        try {
          const success = await this.processQueueItem(item);
          if (success) {
            successfulItems.push(item.id);
          } else if (item.retryCount >= item.maxRetries) {
            successfulItems.push(item.id); // Remove after max retries
          }
        } catch (error) {
          console.error('Failed to process queue item:', error);
          item.retryCount++;
        }
      }

      // Remove successful items from queue
      this.offlineQueue = this.offlineQueue.filter(item => 
        !successfulItems.includes(item.id)
      );
      
      this.saveOfflineQueue();
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: OfflineQueueItem): Promise<boolean> {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...item.headers
        },
        body: item.body ? JSON.stringify(item.body) : undefined
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.error('Queue item processing failed:', error);
    }

    return false;
  }

  /**
   * Store data for offline access
   */
  storeOfflineData(key: string, data: any): void {
    const offlineData = this.getOfflineData();
    offlineData[key] = {
      data,
      timestamp: Date.now(),
      version: process.env.REACT_APP_VERSION || '1.0.0'
    };
    this.saveOfflineData(offlineData);
  }

  /**
   * Retrieve offline data
   */
  getOfflineData(key?: string): any {
    const offlineData = this.getStoredOfflineData();
    
    if (key) {
      return offlineData[key]?.data || null;
    }
    
    return offlineData;
  }

  /**
   * Check if offline data exists and is fresh
   */
  hasOfflineData(key?: string, maxAge?: number): boolean {
    const offlineData = this.getStoredOfflineData();
    const now = Date.now();
    const ageLimit = maxAge || 3600000; // Default 1 hour

    if (key) {
      const item = offlineData[key];
      return item && (now - item.timestamp) < ageLimit;
    }

    return Object.keys(offlineData).some(key => {
      const item = offlineData[key];
      return item && (now - item.timestamp) < ageLimit;
    });
  }

  /**
   * Clear expired offline data
   */
  clearExpiredData(): void {
    const offlineData = this.getStoredOfflineData();
    const now = Date.now();
    const maxAge = 86400000; // 24 hours

    for (const [key, item] of Object.entries(offlineData)) {
      if ((now - item.timestamp) > maxAge) {
        delete offlineData[key];
      }
    }

    this.saveOfflineData(offlineData);
  }

  /**
   * Get cached product data for offline browsing
   */
  getOfflineProducts(category?: string, searchQuery?: string): any[] {
    const productsData = this.getOfflineData('products');
    if (!productsData) return [];

    let products = productsData.products || [];

    if (category) {
      products = products.filter(p => 
        p.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (searchQuery) {
      products = products.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return products;
  }

  /**
   * Get offline cart data
   */
  getOfflineCart(): any {
    return this.getOfflineData('cart') || { items: [], total: 0 };
  }

  /**
   * Store cart data for offline access
   */
  storeOfflineCart(cartData: any): void {
    this.storeOfflineData('cart', cartData);
  }

  /**
   * Handle going offline
   */
  private onGoneOffline(): void {
    console.log('App is now offline');
    
    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('pwa-offline'));
    
    // Show offline indicator
    this.showOfflineIndicator();
  }

  /**
   * Handle coming back online
   */
  private onBackOnline(): void {
    console.log('App is back online');
    
    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('pwa-online'));
    
    // Hide offline indicator
    this.hideOfflineIndicator();
    
    // Process queued items
    this.processQueue();
    
    // Sync offline data
    this.syncOfflineData();
  }

  /**
   * Sync offline data with server
   */
  private async syncOfflineData(): Promise<void> {
    const offlineData = this.getOfflineData();
    
    try {
      await fetch(this.syncEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: offlineData,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  /**
   * Show offline indicator
   */
  private showOfflineIndicator(): void {
    // Dispatch event for UI components to handle
    window.dispatchEvent(new CustomEvent('pwa-show-offline-indicator'));
  }

  /**
   * Hide offline indicator
   */
  private hideOfflineIndicator(): void {
    // Dispatch event for UI components to handle
    window.dispatchEvent(new CustomEvent('pwa-hide-offline-indicator'));
  }

  /**
   * Setup periodic background sync
   */
  private setupPeriodicSync(): void {
    // Clear expired data periodically
    setInterval(() => {
      this.clearExpiredData();
    }, 3600000); // Every hour

    // Process queue periodically if online
    setInterval(() => {
      if (this.isOnline && this.offlineQueue.length > 0) {
        this.processQueue();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Save offline queue to storage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem(this.queueStorageKey, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from storage
   */
  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem(this.queueStorageKey);
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline data to storage
   */
  private saveOfflineData(data: OfflineData): void {
    try {
      localStorage.setItem(this.dataStorageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  /**
   * Load offline data from storage
   */
  private loadOfflineData(): void {
    try {
      const stored = localStorage.getItem(this.dataStorageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Validate data structure
        if (typeof data === 'object' && data !== null) {
          return;
        }
      }
      localStorage.setItem(this.dataStorageKey, JSON.stringify({}));
    } catch (error) {
      console.error('Failed to load offline data:', error);
      localStorage.setItem(this.dataStorageKey, JSON.stringify({}));
    }
  }

  /**
   * Get stored offline data
   */
  private getStoredOfflineData(): OfflineData {
    try {
      const stored = localStorage.getItem(this.dataStorageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse offline data:', error);
      return {};
    }
  }

  /**
   * Generate unique ID for queue items
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get cache strategy for URL
   */
  getCacheStrategy(url: string): CacheStrategy | null {
    return this.cacheStrategies.find(strategy => strategy.match(url)) || null;
  }

  /**
   * Record offline usage for analytics
   */
  recordOfflineUsage(action: string): void {
    const usage = this.getOfflineData('usage') || { actions: [] };
    usage.actions.push({ action, timestamp: Date.now() });
    this.storeOfflineData('usage', usage);
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

// React hook for offline management
export const useOfflineManager = () => {
  return {
    isOnline: () => offlineManager.isOnlineStatus(),
    getOfflineStatus: () => offlineManager.getOfflineStatus(),
    addToOfflineQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>) => 
      offlineManager.addToOfflineQueue(item),
    getOfflineProducts: (category?: string, searchQuery?: string) => 
      offlineManager.getOfflineProducts(category, searchQuery),
    getOfflineCart: () => offlineManager.getOfflineCart(),
    storeOfflineCart: (cartData: any) => offlineManager.storeOfflineCart(cartData),
    storeOfflineData: (key: string, data: any) => offlineManager.storeOfflineData(key, data),
    getOfflineData: (key?: string) => offlineManager.getOfflineData(key),
    hasOfflineData: (key?: string, maxAge?: number) => offlineManager.hasOfflineData(key, maxAge),
    processQueue: () => offlineManager.processQueue(),
    recordOfflineUsage: (action: string) => offlineManager.recordOfflineUsage(action)
  };
};

export default offlineManager;

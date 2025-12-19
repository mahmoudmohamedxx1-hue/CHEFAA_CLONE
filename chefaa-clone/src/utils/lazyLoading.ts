import { lazy, LazyExoticComponent } from 'react';

// Enhanced lazy loading utility with error handling and retry logic
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  retries = 2
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await loader();
    } catch (error) {
      if (retries > 0) {
        console.warn(`Lazy loading failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return lazyLoadComponent(loader, retries - 1) as any;
      }
      throw error;
    }
  });
}

// Preload critical components
export const preloadComponent = (importFunc: () => Promise<any>) => {
  importFunc().catch(() => {
    // Silently fail for preloading
  });
};

// Critical components that should be preloaded
export const preloadCriticalComponents = () => {
  // Preload homepage after a brief delay to avoid blocking initial render
  setTimeout(() => {
    preloadComponent(() => import('../pages/HomePage'));
    preloadComponent(() => import('../pages/ProductDetailPage'));
    preloadComponent(() => import('../pages/CartPage'));
  }, 2000);
};

// Critical route chunks mapping for better caching
export const ROUTE_CHUNKS = {
  home: 'home-page',
  category: 'category-page',
  product: 'product-page',
  cart: 'cart-page',
  checkout: 'checkout-page',
  admin: 'admin-pages',
  blog: 'blog-pages',
  auth: 'auth-pages',
} as const;
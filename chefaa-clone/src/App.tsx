import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, Suspense, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './lib/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCart } from './hooks/useCart';
import Header from './components/Header';
import Footer from './components/Footer';
import { MobileCartDrawer } from './components/MobileCartDrawer';
import { PullToRefresh, NetworkStatusIndicator } from './components/MobileOptimizations';
import { lazyLoadComponent, preloadCriticalComponents } from './utils/lazyLoading';
import { initRUM } from './utils/performanceMonitoring';
import { 
  useViewportHeight, 
  useNetworkStatus,
  useBatteryStatus,
  usePWAInstall,
  useReducedMotion 
} from './hooks/useMobileEnhancements';
import { useIsMobile } from './hooks/use-mobile';
import './index.css';

export type CartItem = {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  quantity: number;
  image: string;
};

// Lazy load page components for better performance
const HomePage = lazyLoadComponent(() => import('./pages/HomePage'));
const CategoryPage = lazyLoadComponent(() => import('./pages/CategoryPage'));
const ProductDetailPage = lazyLoadComponent(() => import('./pages/ProductDetailPage'));
const CartPage = lazyLoadComponent(() => import('./pages/CartPage'));
const SearchPage = lazyLoadComponent(() => import('./pages/SearchPage'));
const AboutPage = lazyLoadComponent(() => import('./pages/AboutPage'));
const ContactPage = lazyLoadComponent(() => import('./pages/ContactPage'));
const LoginPage = lazyLoadComponent(() => import('./pages/LoginPage'));
const CheckoutPage = lazyLoadComponent(() => import('./pages/CheckoutPage'));
const PrescriptionPage = lazyLoadComponent(() => import('./pages/PrescriptionPage'));
const OrderSuccessPage = lazyLoadComponent(() => import('./pages/OrderSuccessPage'));
const NotFoundPage = lazyLoadComponent(() => import('./pages/NotFoundPage'));
const ProfilePage = lazyLoadComponent(() => import('./pages/ProfilePage'));
const OrdersPage = lazyLoadComponent(() => import('./pages/OrdersPage'));
const AIInsightsPage = lazyLoadComponent(() => import('./pages/AIInsightsPage'));
const MedicalRecordsPage = lazyLoadComponent(() => import('./pages/MedicalRecordsPage'));
const BlogListingPage = lazyLoadComponent(() => import('./pages/BlogListingPage'));
const BlogDetailPage = lazyLoadComponent(() => import('./pages/BlogDetailPage'));
const AnalyticsDashboardPage = lazyLoadComponent(() => import('./pages/AnalyticsDashboardPage'));
const PharmacyNetworkPage = lazyLoadComponent(() => import('./pages/PharmacyNetworkPage'));
const TrackDeliveryPage = lazyLoadComponent(() => import('./pages/TrackDeliveryPage'));
const SettingsPage = lazyLoadComponent(() => import('./pages/SettingsPage'));

// Loading component with optimized styling
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="text-gray-600 text-sm">Loading...</span>
    </div>
  </div>
);

/**
 * PWA Install Prompt Component
 * Phase 7: PWA Features
 */
function PWAInstallPrompt({ language }: { language: 'ar' | 'en' }) {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (isInstallable) {
      // Show prompt after 5 seconds
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  if (!showPrompt) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white border-2 border-brand-blue-500 rounded-lg shadow-2xl z-30 p-4">
      <button
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label={t('إغلاق', 'Close')}
      >
        ×
      </button>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-brand-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-2xl font-bold">ش</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">
            {t('تثبيت التطبيق', 'Install App')}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {t(
              'احصل على تجربة أفضل مع تطبيقنا!',
              'Get a better experience with our app!'
            )}
          </p>
          <button
            onClick={handleInstall}
            className="w-full py-2 px-4 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
          >
            {t('تثبيت', 'Install')}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const batteryStatus = useBatteryStatus();
  
  // Mobile enhancements
  useViewportHeight();
  
  const {
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartCount,
  } = useCart();

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const handleCartClick = () => {
    if (isMobile) {
      setIsCartDrawerOpen(true);
    }
  };

  const handleRefresh = async () => {
    // Reload the current page
    window.location.reload();
  };

  // Initialize performance monitoring and preload critical components
  useEffect(() => {
    // Initialize Real User Monitoring for Core Web Vitals
    initRUM();
    
    // Preload critical components after initial render
    preloadCriticalComponents();
  }, []);

  // Apply battery and performance optimizations
  useEffect(() => {
    if (batteryStatus.powerMode === 'critical') {
      document.body.setAttribute('data-power-mode', 'critical');
    } else if (batteryStatus.powerMode === 'low') {
      document.body.setAttribute('data-power-mode', 'low');
    } else {
      document.body.removeAttribute('data-power-mode');
    }
  }, [batteryStatus.powerMode]);

  // Apply reduced motion preference
  useEffect(() => {
    if (prefersReducedMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }, [prefersReducedMotion]);

  // Transform cart items to match MobileCartDrawer interface
  const cartDrawerItems = cartItems.map(item => ({
    id: item.id,
    product_id: item.id,
    product_name: item.name,
    product_name_ar: item.name_ar,
    price: item.price,
    quantity: item.quantity,
    image_url: item.image,
    in_stock: true,
  }));

  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <div className={language === 'ar' ? 'rtl' : 'ltr'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Header
              language={language}
              onToggleLanguage={toggleLanguage}
              cartCount={getCartCount()}
              onCartClick={handleCartClick}
            />
            
            {/* Network Status Indicator */}
            <NetworkStatusIndicator language={language} />
            
            {/* PWA Install Prompt */}
            <PWAInstallPrompt language={language} />
            
            {/* Main Content with Pull to Refresh */}
            <PullToRefresh onRefresh={handleRefresh}>
              <main className="flex-grow pb-20 md:pb-0">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage language={language} onAddToCart={addToCart} />} />
                    <Route path="/category/:slug" element={<CategoryPage language={language} onAddToCart={addToCart} />} />
                    <Route path="/product/:slug" element={<ProductDetailPage language={language} onAddToCart={addToCart} />} />
                    <Route path="/search" element={<SearchPage language={language} onAddToCart={addToCart} />} />
                    <Route path="/cart" element={
                      <CartPage
                        language={language}
                        items={cartItems}
                        onUpdateQuantity={updateCartQuantity}
                        onRemove={removeFromCart}
                      />
                    } />
                    <Route path="/checkout" element={
                      <CheckoutPage
                        language={language}
                        items={cartItems}
                        onClearCart={clearCart}
                      />
                    } />
                    <Route path="/prescription" element={<PrescriptionPage language={language} />} />
                    <Route path="/about" element={<AboutPage language={language} />} />
                    <Route path="/contact" element={<ContactPage language={language} />} />
                    <Route path="/login" element={<LoginPage language={language} />} />
                    <Route path="/order-success" element={<OrderSuccessPage language={language} />} />
                    <Route path="/profile" element={<ProfilePage language={language} />} />
                    <Route path="/orders" element={<OrdersPage language={language} />} />
                    <Route path="/ai-insights" element={<AIInsightsPage language={language} />} />
                    <Route path="/medical-records" element={<MedicalRecordsPage language={language} />} />
                    <Route path="/blog" element={<BlogListingPage language={language} />} />
                    <Route path="/blog/:slug" element={<BlogDetailPage language={language} />} />
                    <Route path="/analytics" element={<AnalyticsDashboardPage language={language} />} />
                    <Route path="/pharmacy-network" element={<PharmacyNetworkPage language={language} />} />
                    <Route path="/track-delivery" element={<TrackDeliveryPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFoundPage language={language} />} />
                  </Routes>
                </Suspense>
              </main>
            </PullToRefresh>
            
            <Footer language={language} />

            {/* Mobile Cart Drawer */}
            {isMobile && (
              <MobileCartDrawer
                isOpen={isCartDrawerOpen}
                onClose={() => setIsCartDrawerOpen(false)}
                items={cartDrawerItems}
                language={language}
                onUpdateQuantity={updateCartQuantity}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
              />
            )}
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}

export default App;

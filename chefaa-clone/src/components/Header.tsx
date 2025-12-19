import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Globe, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MobileNavigation } from './MobileNavigation';
import { MobileSearch } from './MobileSearch';
import { useIsMobile } from '../hooks/use-mobile';

type HeaderProps = {
  language: 'ar' | 'en';
  onToggleLanguage: () => void;
  cartCount: number;
  onCartClick?: () => void;
};

export default function Header({ language, onToggleLanguage, cartCount, onCartClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleMobileSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Top Alert Bar - Hidden on mobile */}
        <div className="bg-accent-amber text-white py-2 px-4 text-center text-sm hidden md:block">
          <span>{t('حدد موقعك لعرض المنتجات المتاحة', 'Specify your location to view available products')}</span>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <MobileNavigation
                language={language}
                cartCount={cartCount}
                onToggleLanguage={onToggleLanguage}
              />
            </div>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">ش</span>
              </div>
              <span className="text-xl md:text-2xl font-bold text-brand-blue-500">
                {t('شفاء', 'Chefaa')}
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            {!isMobile && (
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('ابحث عن المنتجات...', 'Search for products...')}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}

            {/* Header Actions - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={onToggleLanguage}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-semibold">{language === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              {user ? (
                <button 
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">{t('تسجيل الخروج', 'Logout')}</span>
                </button>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <User className="w-5 h-5" />
                  <span className="text-sm">{t('تسجيل الدخول', 'Login')}</span>
                </Link>
              )}

              <Link to="/cart" className="relative flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-green text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile Cart Icon */}
            <button
              onClick={onCartClick || (() => navigate('/cart'))}
              className="md:hidden relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={t('السلة', 'Cart')}
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Search Bar */}
          {isMobile && (
            <div className="mt-3">
              <MobileSearch
                language={language}
                onSearch={handleMobileSearch}
                placeholder={t('ابحث عن المنتجات...', 'Search for products...')}
              />
            </div>
          )}
        </div>

        {/* Navigation - Desktop Only */}
        <nav className="border-t border-gray-200 bg-white hidden md:block">
          <div className="container mx-auto px-4">
            <ul className="flex items-center gap-8 py-3">
              <li>
                <Link to="/" className="text-sm font-semibold hover:text-brand-blue-500 transition-colors">
                  {t('الرئيسية', 'Home')}
                </Link>
              </li>
              <li>
                <Link to="/prescription" className="text-sm font-semibold hover:text-brand-blue-500 transition-colors">
                  {t('رفع روشتة', 'Upload Prescription')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm font-semibold hover:text-brand-blue-500 transition-colors">
                  {t('من نحن', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm font-semibold hover:text-brand-blue-500 transition-colors">
                  {t('اتصل بنا', 'Contact Us')}
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Bottom nav is rendered in MobileNavigation component */}
      </div>
    </>
  );
}

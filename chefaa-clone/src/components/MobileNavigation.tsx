import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Menu, X, FileText, Phone, Info } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface MobileNavigationProps {
  language: 'ar' | 'en';
  cartCount: number;
  onToggleLanguage: () => void;
}

/**
 * Comprehensive Mobile Navigation System
 * Phase 1: Mobile Navigation Enhancement
 * - Responsive hamburger menu for mobile
 * - Bottom navigation bar with key actions
 * - Optimized header height for mobile screens
 * - Mobile-specific navigation gestures
 */
export function MobileNavigation({ language, cartCount, onToggleLanguage }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navigationLinks = [
    { path: '/', label: t('الرئيسية', 'Home'), icon: Home },
    { path: '/prescription', label: t('رفع روشتة', 'Prescription'), icon: FileText },
    { path: '/about', label: t('من نحن', 'About'), icon: Info },
    { path: '/contact', label: t('اتصل بنا', 'Contact'), icon: Phone },
  ];

  return (
    <>
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-button"
        aria-label={t('القائمة', 'Menu')}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Side Drawer Menu - Mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: language === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-0 ${
                language === 'ar' ? 'right-0' : 'left-0'
              } h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden overflow-y-auto`}
              style={{ 
                direction: language === 'ar' ? 'rtl' : 'ltr',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-brand-blue-500">
                    {t('شفاء', 'Chefaa')}
                  </h2>
                  <button
                    onClick={toggleMenu}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-button"
                    aria-label={t('إغلاق', 'Close')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Section */}
                {user ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-brand-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={toggleMenu}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <User className="w-5 h-5 text-brand-blue-500" />
                    <span className="font-semibold text-brand-blue-500">
                      {t('تسجيل الدخول', 'Login')}
                    </span>
                  </Link>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="p-4">
                <ul className="space-y-2">
                  {navigationLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          onClick={toggleMenu}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors touch-button ${
                            location.pathname === link.path
                              ? 'bg-brand-blue-50 text-brand-blue-600'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => {
                    onToggleLanguage();
                    toggleMenu();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-button"
                >
                  <span className="font-medium">
                    {language === 'ar' ? 'English' : 'العربية'}
                  </span>
                </button>

                {user && (
                  <button
                    onClick={() => {
                      signOut();
                      toggleMenu();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors touch-button"
                  >
                    <span className="font-medium">
                      {t('تسجيل الخروج', 'Logout')}
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar - Mobile Only */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-30"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          <BottomNavItem
            to="/"
            icon={Home}
            label={t('الرئيسية', 'Home')}
            isActive={location.pathname === '/'}
          />
          <BottomNavItem
            to="/search"
            icon={Search}
            label={t('بحث', 'Search')}
            isActive={location.pathname === '/search'}
          />
          <BottomNavItem
            to="/cart"
            icon={ShoppingCart}
            label={t('السلة', 'Cart')}
            isActive={location.pathname === '/cart'}
            badge={cartCount}
          />
          <BottomNavItem
            to={user ? '/profile' : '/login'}
            icon={User}
            label={t('حسابي', 'Profile')}
            isActive={location.pathname === '/profile' || location.pathname === '/login'}
          />
        </div>
      </nav>
    </>
  );
}

function BottomNavItem({
  to,
  icon: Icon,
  label,
  isActive,
  badge,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-1 relative transition-colors touch-button ${
        isActive ? 'text-brand-blue-500' : 'text-gray-500'
      }`}
      aria-label={label}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 ${isActive ? 'text-brand-blue-500' : 'text-gray-500'}`} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span
        className={`text-xs mt-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${
          isActive ? 'text-brand-blue-500' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ShoppingCart, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  slug: string;
  name: string;
  name_ar?: string;
  price: number;
  image_url?: string;
  in_stock?: boolean;
  description?: string;
  description_ar?: string;
  rating?: number;
}

interface SwipeableProductCardProps {
  product: Product;
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
}

/**
 * Swipeable Product Card for Mobile
 * Phase 3: Mobile Product Display Optimization
 * - Mobile-first product grid layouts (1-2 columns on mobile)
 * - Swipe gestures for product browsing
 * - Optimized ProductCard for mobile touch interactions
 * - Quick view modals for mobile
 */
export function SwipeableProductCard({
  product,
  language,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  isInWishlist = false,
}: SwipeableProductCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [x, setX] = useState(0);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleDragStart = () => {
    setIsDragging(true);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    const swipeThreshold = 100;
    
    // Swipe right: Add to cart
    if (info.offset.x > swipeThreshold) {
      onAddToCart(product);
      // Haptic feedback for success
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
    }
    // Swipe left: Quick view
    else if (info.offset.x < -swipeThreshold) {
      onQuickView(product);
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
    
    setX(0);
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setX(info.offset.x);
  };

  const displayName = language === 'ar' && product.name_ar ? product.name_ar : product.name;

  return (
    <div className="relative">
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-lg overflow-hidden">
        {/* Add to Cart (Right Swipe) */}
        <motion.div
          className="flex items-center gap-2 text-white bg-green-500 px-4 py-2 rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: x > 50 ? 1 : 0,
            scale: x > 50 ? 1 : 0.8 
          }}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold text-sm">{t('أضف', 'Add')}</span>
        </motion.div>

        {/* Quick View (Left Swipe) */}
        <motion.div
          className="flex items-center gap-2 text-white bg-brand-blue-500 px-4 py-2 rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: x < -50 ? 1 : 0,
            scale: x < -50 ? 1 : 0.8 
          }}
        >
          <span className="font-semibold text-sm">{t('معاينة', 'View')}</span>
          <Eye className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Product Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: isDragging ? x : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } touch-manipulation`}
      >
        {/* Product Image */}
        <Link to={`/product/${product.slug}`} className="block relative aspect-square bg-gray-100">
          <img
            src={product.image_url || '/placeholder-product.jpg'}
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleWishlist(product.id);
              }}
              className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-colors touch-button"
              aria-label={t('إضافة للمفضلة', 'Add to wishlist')}
            >
              <Heart
                className={`w-5 h-5 ${
                  isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </button>
          )}

          {/* Stock Badge */}
          {!product.in_stock && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              {t('غير متوفر', 'Out of Stock')}
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="p-3">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-brand-blue-500 transition-colors">
              {displayName}
            </h3>
          </Link>

          {/* Price and Rating */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-brand-blue-600">
              {product.price} {t('ج.م', 'EGP')}
            </span>
            {product.rating && (
              <div className="flex items-center gap-1 text-yellow-500 text-xs">
                <span>★</span>
                <span className="text-gray-600">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onAddToCart(product)}
              disabled={!product.in_stock}
              className="flex-1 py-2.5 px-3 bg-brand-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-brand-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-button"
            >
              {t('أضف للسلة', 'Add to Cart')}
            </button>
            <button
              onClick={() => onQuickView(product)}
              className="p-2.5 border-2 border-gray-300 rounded-lg hover:border-brand-blue-500 hover:text-brand-blue-500 transition-colors touch-button"
              aria-label={t('معاينة سريعة', 'Quick View')}
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Quick View Modal for Mobile
 * Part of Phase 3: Mobile Product Display
 */
interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  language: 'ar' | 'en';
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  language,
}: QuickViewModalProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  if (!product) return null;

  const displayName = language === 'ar' && product.name_ar ? product.name_ar : product.name;
  const displayDescription = language === 'ar' && product.description_ar ? product.description_ar : product.description;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-hidden flex flex-col"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-colors touch-button"
              aria-label={t('إغلاق', 'Close')}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={product.image_url || '/placeholder-product.jpg'}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {displayName}
                </h2>

                {/* Price and Stock */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-brand-blue-600">
                    {product.price} {t('ج.م', 'EGP')}
                  </span>
                  {product.in_stock ? (
                    <span className="text-green-600 font-semibold text-sm bg-green-50 px-3 py-1 rounded-full">
                      {t('متوفر', 'In Stock')}
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold text-sm bg-red-50 px-3 py-1 rounded-full">
                      {t('غير متوفر', 'Out of Stock')}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(product.rating!) ? 'text-yellow-500' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-gray-600 text-sm">({product.rating.toFixed(1)})</span>
                  </div>
                )}

                {/* Description */}
                {displayDescription && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {t('الوصف', 'Description')}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {displayDescription}
                    </p>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  disabled={!product.in_stock}
                  className="w-full py-4 px-6 bg-brand-blue-500 text-white rounded-full font-bold text-lg hover:bg-brand-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-button shadow-lg"
                >
                  {t('أضف للسلة', 'Add to Cart')}
                </button>

                {/* View Full Details Link */}
                <Link
                  to={`/product/${product.slug}`}
                  onClick={onClose}
                  className="block text-center mt-4 text-brand-blue-600 font-semibold hover:text-brand-blue-700 transition-colors"
                >
                  {t('عرض التفاصيل الكاملة', 'View Full Details')}
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

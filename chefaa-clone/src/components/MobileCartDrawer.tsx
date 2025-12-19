import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_name_ar?: string;
  price: number;
  quantity: number;
  image_url?: string;
  in_stock?: boolean;
}

interface MobileCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  language: 'ar' | 'en';
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart?: () => void;
}

/**
 * Mobile Shopping Cart Drawer
 * Phase 4: Mobile Shopping Cart Experience
 * - Mobile-optimized cart drawer/sheet
 * - Mobile-friendly quantity selectors
 * - Mobile checkout optimization
 * - Cart shortcuts and quick actions
 */
export function MobileCartDrawer({
  isOpen,
  onClose,
  items,
  language,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: MobileCartDrawerProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: language === 'ar' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: language === 'ar' ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed top-0 ${
              language === 'ar' ? 'left-0' : 'right-0'
            } h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col`}
            style={{ 
              direction: language === 'ar' ? 'rtl' : 'ltr',
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-brand-blue-500" />
                {t('سلة التسوق', 'Shopping Cart')}
                {itemCount > 0 && (
                  <span className="text-sm font-normal text-gray-600">
                    ({itemCount} {t('منتج', 'items')})
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-button"
                aria-label={t('إغلاق', 'Close')}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('السلة فارغة', 'Cart is Empty')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('لم تقم بإضافة أي منتجات بعد', "You haven't added any items yet")}
                </p>
                <Link
                  to="/"
                  onClick={onClose}
                  className="px-6 py-3 bg-brand-blue-500 text-white rounded-full font-semibold hover:bg-brand-blue-600 transition-colors touch-button"
                >
                  {t('تصفح المنتجات', 'Browse Products')}
                </Link>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      language={language}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemove={onRemoveItem}
                    />
                  ))}
                </div>

                {/* Footer with Summary and Actions */}
                <div className="border-t border-gray-200 bg-white p-4 space-y-4">
                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('المجموع الفرعي', 'Subtotal')}</span>
                      <span className="font-semibold">{subtotal.toFixed(2)} {t('ج.م', 'EGP')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('الشحن', 'Shipping')}</span>
                      <span className="text-green-600 font-semibold">{t('مجاني', 'Free')}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{t('المجموع', 'Total')}</span>
                        <span className="text-2xl font-bold text-brand-blue-600">
                          {subtotal.toFixed(2)} {t('ج.م', 'EGP')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Link
                      to="/checkout"
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-brand-blue-500 text-white rounded-full font-bold text-lg hover:bg-brand-blue-600 transition-colors touch-button shadow-lg"
                    >
                      {t('إتمام الطلب', 'Proceed to Checkout')}
                      <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                    </Link>

                    <Link
                      to="/cart"
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:border-brand-blue-500 hover:text-brand-blue-500 transition-colors touch-button"
                    >
                      {t('عرض السلة الكاملة', 'View Full Cart')}
                    </Link>

                    {onClearCart && (
                      <button
                        onClick={() => {
                          if (window.confirm(t('هل تريد تفريغ السلة؟', 'Clear cart?'))) {
                            onClearCart();
                          }
                        }}
                        className="w-full py-2 text-red-600 text-sm font-semibold hover:text-red-700 transition-colors"
                      >
                        {t('تفريغ السلة', 'Clear Cart')}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Mobile Cart Item Card
 */
interface CartItemCardProps {
  item: CartItem;
  language: 'ar' | 'en';
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

function CartItemCard({ item, language, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const displayName = language === 'ar' && item.product_name_ar 
    ? item.product_name_ar 
    : item.product_name;

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 30]);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
    >
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={item.image_url || '/placeholder-product.jpg'}
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
            {displayName}
          </h3>

          {/* Price */}
          <p className="text-brand-blue-600 font-bold text-base mb-2">
            {item.price.toFixed(2)} {t('ج.م', 'EGP')}
          </p>

          {/* Quantity Controls and Remove */}
          <div className="flex items-center justify-between">
            {/* Quantity Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
              <button
                onClick={handleDecrement}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors touch-button"
                aria-label={t('تقليل', 'Decrease')}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-sm min-w-[2rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors touch-button"
                aria-label={t('زيادة', 'Increase')}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemove}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-button"
              aria-label={t('حذف', 'Remove')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Stock Status */}
          {item.in_stock === false && (
            <p className="text-xs text-red-600 mt-1">
              {t('غير متوفر', 'Out of stock')}
            </p>
          )}
        </div>
      </div>

      {/* Item Subtotal */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-600">{t('المجموع الفرعي', 'Subtotal')}</span>
        <span className="font-bold text-gray-900">
          {(item.price * item.quantity).toFixed(2)} {t('ج.م', 'EGP')}
        </span>
      </div>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, Clock, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QuickOrderItem {
  id: string;
  name: string;
  name_ar: string;
  price_egp: number;
  image: string;
  lastOrderDate: string;
}

interface QuickReorderProps {
  language: 'ar' | 'en';
  userId?: string;
  onAddToCart: (productId: string) => void;
}

/**
 * Quick Reorder component for returning customers
 * Shows frequently ordered items with one-click reorder
 */
export default function QuickReorder({ language, userId, onAddToCart }: QuickReorderProps) {
  const [recentOrders, setRecentOrders] = useState<QuickOrderItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (userId) {
      loadRecentOrders();
    }
  }, [userId]);

  const loadRecentOrders = async () => {
    // Load user's recent orders from database
    const { data } = await supabase
      .from('order_items')
      .select(`
        product_id,
        products (id, name, name_ar, price_egp, images),
        orders!inner (created_at, user_id)
      `)
      .eq('orders.user_id', userId)
      .order('orders.created_at', { ascending: false })
      .limit(10);

    if (data) {
      // Group by product and get most recent order date
      const grouped = data.reduce((acc: Record<string, any>, item: any) => {
        const productId = item.product_id;
        if (!acc[productId] || new Date(item.orders.created_at) > new Date(acc[productId].lastOrderDate)) {
          acc[productId] = {
            id: item.products.id,
            name: item.products.name,
            name_ar: item.products.name_ar,
            price_egp: parseFloat(item.products.price_egp),
            image: item.products.images?.[0] || '',
            lastOrderDate: item.orders.created_at,
          };
        }
        return acc;
      }, {});

      setRecentOrders(Object.values(grouped).slice(0, 6));
    }
  };

  const handleQuickAdd = (productId: string) => {
    onAddToCart(productId);
    setAddedItems(new Set(addedItems).add(productId));
    
    // Reset added state after animation
    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, 2000);
  };

  if (!userId || recentOrders.length === 0) return null;

  return (
    <>
      {/* Quick Reorder Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-brand-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-brand-blue-600 transition-all hover:scale-110"
        aria-label={t('إعادة الطلب السريع', 'Quick Reorder')}
      >
        <Clock className="w-6 h-6" />
      </button>

      {/* Quick Reorder Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:w-2/3 lg:w-1/2 max-w-2xl bg-white rounded-t-2xl md:rounded-2xl max-h-[70vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-brand-blue-500" />
                <h2 className="text-lg font-bold">
                  {t('إعادة الطلب السريع', 'Quick Reorder')}
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-600 mb-4">
                {t(
                  'أضف المنتجات التي طلبتها سابقاً بنقرة واحدة',
                  'Add your previously ordered products with one click'
                )}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {recentOrders.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={item.image || 'https://placehold.co/80x80/2563EB/white?text=Product'}
                      alt={language === 'ar' ? item.name_ar : item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {language === 'ar' ? item.name_ar : item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.price_egp.toFixed(2)} {t('ج.م', 'EGP')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('آخر طلب:', 'Last ordered:')} {new Date(item.lastOrderDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      disabled={addedItems.has(item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        addedItems.has(item.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-brand-blue-500 text-white hover:bg-brand-blue-600'
                      }`}
                    >
                      {addedItems.has(item.id) ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm">{t('تمت الإضافة', 'Added')}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span className="text-sm">{t('أضف', 'Add')}</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 px-4 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
              >
                {t('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Saved Items / Wishlist component
 */
export function SavedItems({ language, userId }: { language: 'ar' | 'en'; userId?: string }) {
  const [savedCount, setSavedCount] = useState(0);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (userId) {
      loadSavedCount();
    }
  }, [userId]);

  const loadSavedCount = async () => {
    const { count } = await supabase
      .from('saved_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    setSavedCount(count || 0);
  };

  if (!userId) return null;

  return (
    <button
      className="fixed bottom-36 right-4 z-40 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-all hover:scale-110"
      aria-label={t('العناصر المحفوظة', 'Saved Items')}
    >
      <Heart className="w-6 h-6" />
      {savedCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {savedCount}
        </span>
      )}
    </button>
  );
}

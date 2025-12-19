import { useEffect, useState } from 'react';
import { X, ShoppingCart, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CartRecoveryBannerProps {
  language: 'ar' | 'en';
}

interface AbandonedCart {
  id: string;
  cart_data: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    total: number;
  };
  discount_code: string | null;
  created_at: string;
}

export default function CartRecoveryBanner({ language }: CartRecoveryBannerProps) {
  const [abandonedCart, setAbandonedCart] = useState<AbandonedCart | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (user && !dismissed) {
      checkAbandonedCart();
    }
  }, [user, dismissed]);

  const checkAbandonedCart = async () => {
    if (!user) return;

    try {
      // Get the most recent abandoned cart (not recovered, created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('user_id', user.id)
        .eq('recovered', false)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setAbandonedCart(data);
        
        // Show banner after a short delay
        setTimeout(() => setIsVisible(true), 2000);
      }
    } catch (error) {
      // No abandoned cart found - this is fine
      console.log('No abandoned cart found');
    }
  };

  const handleRecoverCart = async () => {
    if (!abandonedCart) return;

    // Mark cart as recovered
    await supabase
      .from('abandoned_carts')
      .update({ recovered: true })
      .eq('id', abandonedCart.id);

    // Navigate to cart page
    navigate('/cart');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  if (!isVisible || !abandonedCart) return null;

  const itemCount = abandonedCart.cart_data.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const total = abandonedCart.cart_data.total;

  return (
    <div
      className={`fixed bottom-4 ${
        language === 'ar' ? 'left-4' : 'right-4'
      } max-w-md bg-white rounded-lg shadow-2xl border border-brand-blue-500 z-40 transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="p-6">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-brand-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              {t('لديك عربة تسوق معلقة', 'You Have an Abandoned Cart')}
            </h3>
            <p className="text-sm text-gray-600">
              {itemCount} {t('منتج في انتظارك', 'items waiting for you')}
            </p>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">
              {t('إجمالي السلة', 'Cart Total')}
            </span>
            <span className="text-xl font-bold text-brand-blue-500">
              {total.toFixed(2)} {t('ج.م', 'EGP')}
            </span>
          </div>

          {abandonedCart.discount_code && (
            <div className="flex items-center gap-2 text-sm text-accent-green">
              <Tag className="w-4 h-4" />
              <span>
                {t('كود خصم متاح:', 'Discount code available:')} {abandonedCart.discount_code}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRecoverCart}
            className="w-full py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
          >
            {t('استكمال الشراء', 'Complete Your Purchase')}
          </button>
          {abandonedCart.discount_code && (
            <p className="text-xs text-center text-gray-600">
              {t(
                'استخدم الكود للحصول على خصم إضافي',
                'Use the code for an additional discount'
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

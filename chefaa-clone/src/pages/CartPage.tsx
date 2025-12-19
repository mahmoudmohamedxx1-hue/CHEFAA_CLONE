import { CartItem } from '../App';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

type CartPageProps = {
  language: 'ar' | 'en';
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
};

export default function CartPage({ language, items, onUpdateQuantity, onRemove }: CartPageProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 30 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('سلة التسوق', 'Shopping Cart')}</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-xl text-text-secondary mb-6">
              {t('سلتك فارغة', 'Your cart is empty')}
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
            >
              {t('تصفح المنتجات', 'Browse Products')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 flex gap-4">
                  <img
                    src={item.image || 'https://placehold.co/100x100/2563EB/white?text=Product'}
                    alt={language === 'ar' ? item.name_ar : item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {language === 'ar' ? item.name_ar : item.name}
                    </h3>
                    <p className="text-brand-blue-500 font-bold mb-2">
                      {item.price.toFixed(2)} {t('ج.م', 'EGP')}
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-semantic-error hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">{t('حذف', 'Remove')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {(item.price * item.quantity).toFixed(2)} {t('ج.م', 'EGP')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4">{t('ملخص الطلب', 'Order Summary')}</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('المجموع الفرعي', 'Subtotal')}</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} {t('ج.م', 'EGP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{t('رسوم التوصيل', 'Delivery Fee')}</span>
                    <span className="font-semibold">{deliveryFee.toFixed(2)} {t('ج.م', 'EGP')}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-bold">{t('الإجمالي', 'Total')}</span>
                    <span className="text-lg font-bold text-brand-blue-500">
                      {total.toFixed(2)} {t('ج.م', 'EGP')}
                    </span>
                  </div>
                </div>

                <Link 
                  to="/checkout"
                  className="block w-full py-3 px-6 bg-brand-blue-500 text-white rounded-lg font-bold hover:bg-brand-blue-600 transition-colors text-center"
                >
                  {t('متابعة الدفع', 'Proceed to Checkout')}
                </Link>

                <p className="text-xs text-text-secondary text-center mt-4">
                  {t('التوصيل السريع خلال 30-60 دقيقة', 'Fast delivery in 30-60 minutes')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

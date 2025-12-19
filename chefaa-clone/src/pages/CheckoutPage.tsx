import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CartItem } from '../App';

type CheckoutPageProps = {
  language: 'ar' | 'en';
  items: CartItem[];
  onClearCart: () => void;
};

export default function CheckoutPage({ language, items, onClearCart }: CheckoutPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState({
    city: '',
    district: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
  });
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 30;
  const total = subtotal + deliveryFee;

  if (!user) {
    return (
      <div className="min-h-screen bg-background-secondary py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {t('يرجى تسجيل الدخول لإتمام الطلب', 'Please login to complete your order')}
          </h1>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600"
          >
            {t('تسجيل الدخول', 'Login')}
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create order in database
      const orderData = {
        user_id: user.id,
        products: items.map(item => ({
          id: item.id,
          name: item.name,
          name_ar: item.name_ar,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: total,
        status: 'pending',
        delivery_type: 'instant',
        delivery_address: address,
        payment_method: paymentMethod,
        phone,
      };

      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData]);

      if (orderError) throw orderError;

      // Clear cart and redirect
      onClearCart();
      navigate('/order-success');
    } catch (err: any) {
      setError(err.message || t('حدث خطأ في إنشاء الطلب', 'Error creating order'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('إتمام الطلب', 'Checkout')}</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6">
              {/* Delivery Address */}
              <div>
                <h2 className="text-xl font-bold mb-4">{t('عنوان التوصيل', 'Delivery Address')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t('المدينة', 'City')}</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t('الحي', 'District')}</label>
                    <input
                      type="text"
                      value={address.district}
                      onChange={(e) => setAddress({ ...address, district: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2">{t('الشارع', 'Street')}</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t('رقم المبنى', 'Building')}</label>
                    <input
                      type="text"
                      value={address.building}
                      onChange={(e) => setAddress({ ...address, building: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t('الطابق', 'Floor')}</label>
                    <input
                      type="text"
                      value={address.floor}
                      onChange={(e) => setAddress({ ...address, floor: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t('رقم الشقة', 'Apartment')}</label>
                    <input
                      type="text"
                      value={address.apartment}
                      onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold mb-2">{t('رقم الهاتف', 'Phone Number')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <h2 className="text-xl font-bold mb-4">{t('طريقة الدفع', 'Payment Method')}</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-brand-blue-500">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4 text-brand-blue-500"
                    />
                    <span className="font-semibold">{t('الدفع عند الاستلام', 'Cash on Delivery')}</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-brand-blue-500 opacity-50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      disabled
                      className="w-4 h-4 text-brand-blue-500"
                    />
                    <span className="font-semibold">{t('الدفع الإلكتروني (قريباً)', 'Online Payment (Coming Soon)')}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-brand-blue-500 text-white rounded-lg font-bold text-lg hover:bg-brand-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('جاري تأكيد الطلب...', 'Processing...') : t('تأكيد الطلب', 'Confirm Order')}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">{t('ملخص الطلب', 'Order Summary')}</h2>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{language === 'ar' ? item.name_ar : item.name} x{item.quantity}</span>
                    <span>{(item.price * item.quantity).toFixed(2)} {t('ج.م', 'EGP')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('المجموع الفرعي', 'Subtotal')}</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} {t('ج.م', 'EGP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">{t('رسوم التوصيل', 'Delivery Fee')}</span>
                  <span className="font-semibold">{deliveryFee.toFixed(2)} {t('ج.م', 'EGP')}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-lg font-bold">{t('الإجمالي', 'Total')}</span>
                  <span className="text-lg font-bold text-brand-blue-500">
                    {total.toFixed(2)} {t('ج.م', 'EGP')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

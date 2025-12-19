import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Package, Loader2, ChevronRight, Eye } from 'lucide-react';
import { format } from 'date-fns';

type OrdersPageProps = {
  language: 'ar' | 'en';
};

type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  items: any[];
  delivery_address: any;
};

export default function OrdersPage({ language }: OrdersPageProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      loadOrders();
    }
  }, [user, authLoading, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { ar: string; en: string }> = {
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
      processing: { ar: 'قيد المعالجة', en: 'Processing' },
      shipped: { ar: 'تم الشحن', en: 'Shipped' },
      delivered: { ar: 'تم التوصيل', en: 'Delivered' },
      completed: { ar: 'مكتمل', en: 'Completed' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };
    return statusMap[status.toLowerCase()]?.[language] || status;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('جارٍ تحميل الطلبات...', 'Loading orders...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('طلباتي', 'My Orders')}
          </h1>
          <p className="text-gray-600">
            {t('عرض وإدارة جميع طلباتك', 'View and manage all your orders')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-base p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {t('لا توجد طلبات بعد', 'No orders yet')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('ابدأ التسوق الآن لتقديم طلبك الأول', 'Start shopping now to place your first order')}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
            >
              {t('تصفح المنتجات', 'Browse Products')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-base overflow-hidden hover:shadow-hover transition-shadow"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">
                          {t('طلب رقم', 'Order')} #{order.id.slice(0, 8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('تاريخ الطلب:', 'Order date:')} {format(new Date(order.created_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">{t('الإجمالي', 'Total')}</p>
                      <p className="text-2xl font-bold text-brand-blue-500">
                        {order.total_amount.toFixed(2)} {t('ج.م', 'EGP')}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        {t('المنتجات:', 'Items:')} {order.items.length} {t('منتج', 'items')}
                      </p>
                      <div className="flex gap-2">
                        {order.items.slice(0, 3).map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-sm bg-gray-50 px-3 py-1 rounded-lg"
                          >
                            {item.quantity}x {language === 'ar' ? item.name_ar : item.name}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-sm bg-gray-50 px-3 py-1 rounded-lg">
                            +{order.items.length - 3} {t('المزيد', 'more')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      {t('عرض التفاصيل', 'View Details')}
                    </button>
                    {order.status.toLowerCase() === 'delivered' && (
                      <button
                        className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        {t('إعادة الطلب', 'Reorder')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

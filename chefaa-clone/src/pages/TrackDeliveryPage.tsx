import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DeliveryTracking from '../components/DeliveryTracking';

const TrackDeliveryPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('chefaa-language') as 'ar' | 'en';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Simulate fetching order data
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call with demo order data
        const demoOrderData = {
          id: orderId,
          status: 'processing',
          total_amount: 150.00,
          items: [
            { name: 'Paracetamol 500mg', quantity: 2, price: 25 },
            { name: 'Vitamin D3', quantity: 1, price: 45 },
            { name: 'Antibiotic Ointment', quantity: 1, price: 35 }
          ],
          delivery_address: {
            street: '123 Main Street',
            city: 'Cairo',
            district: 'Downtown',
            postal_code: '11511'
          },
          customer_phone: '+20 123 456 7890',
          customer_name: 'Ahmed Mohamed'
        };
        
        setOrderData(demoOrderData);
      } catch (error) {
        console.error('Error fetching order data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  // Arabic text mapping
  const text = {
    ar: {
      pageTitle: 'تتبع طلبك',
      orderNumber: 'رقم الطلب',
      backToOrders: 'العودة للطلبات',
      customerInfo: 'معلومات العميل',
      phone: 'الهاتف',
      address: 'العنوان',
      orderItems: 'محتويات الطلب',
      quantity: 'الكمية',
      price: 'السعر',
      total: 'المجموع',
      loading: 'جاري التحميل...',
      noOrderFound: 'لم يتم العثور على الطلب',
      trackDelivery: 'تتبع التوصيل'
    },
    en: {
      pageTitle: 'Track Your Order',
      orderNumber: 'Order Number',
      backToOrders: 'Back to Orders',
      customerInfo: 'Customer Information',
      phone: 'Phone',
      address: 'Address',
      orderItems: 'Order Items',
      quantity: 'Quantity',
      price: 'Price',
      total: 'Total',
      loading: 'Loading...',
      noOrderFound: 'Order not found',
      trackDelivery: 'Track Delivery'
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">{text[language].loading}</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{text[language].noOrderFound}</h2>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <span>🏠</span>
              {text[language].backToOrders}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="text-xl">←</span>
                {text[language].backToOrders}
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🚚</span>
                {text[language].pageTitle}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Information Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-lg border">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  {text[language].orderNumber}
                </h2>
                <p className="text-blue-100 text-sm mt-1">#{orderData.id?.slice(-8)}</p>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    {text[language].customerInfo}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{orderData.customer_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{text[language].phone}:</span>
                      <span className="font-medium">{orderData.customer_phone}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600 text-sm">📍 {text[language].address}:</span>
                      <div className="mt-1">
                        <div>{orderData.delivery_address?.street}</div>
                        <div>{orderData.delivery_address?.district}, {orderData.delivery_address?.city}</div>
                        <div>{orderData.delivery_address?.postal_code}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-lg">🛍️</span>
                    {text[language].orderItems}
                  </h3>
                  <div className="space-y-2">
                    {orderData.items?.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">
                              {text[language].quantity}: {item.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${item.price}</div>
                            <div className="text-sm text-gray-600">
                              Total: ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3 mt-4 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-blue-900">{text[language].total}:</span>
                      <span className="text-xl font-bold text-blue-900">
                        ${orderData.total_amount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Tracking Main Content */}
          <div className="lg:col-span-2">
            <DeliveryTracking 
              orderId={orderId!} 
              language={language}
              onDeliveryComplete={() => {
                // Handle delivery completion
                console.log('Delivery completed');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDeliveryPage;
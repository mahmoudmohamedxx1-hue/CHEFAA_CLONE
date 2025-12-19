import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../lib/deliveryAPI';

// Types for delivery tracking
interface DeliveryStatus {
  delivery_id: string;
  order_id: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  status_message?: string;
  driver_name?: string;
  driver_phone?: string;
  current_latitude?: number;
  current_longitude?: number;
  estimated_delivery_time?: string;
  delivery_type: 'express' | 'standard' | 'scheduled';
  progress_percentage: number;
  estimatedArrivalMinutes?: number;
  statusHistory?: any[];
  recentGpsLogs?: any[];
  currentLocation?: { lat: number; lng: number };
}

interface DeliveryTrackingProps {
  orderId: string;
  language: 'ar' | 'en';
  onDeliveryComplete?: () => void;
}

const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({ 
  orderId, 
  language, 
  onDeliveryComplete 
}) => {
  const [deliveryData, setDeliveryData] = useState<DeliveryStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showIssueReport, setShowIssueReport] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');

  // Arabic text mapping
  const text = {
    ar: {
      trackingDelivery: 'تتبع التوصيل',
      estimatedArrival: 'الوقت المتوقع للوصول',
      currentLocation: 'الموقع الحالي',
      driverInfo: 'معلومات السائق',
      statusTimeline: 'الجدول الزمني للحالة',
      contactDriver: 'اتصل بالسائق',
      reportIssue: 'الإبلاغ عن مشكلة',
      confirmDelivery: 'تأكيد استلام الطلب',
      deliveryCompleted: 'تم تسليم الطلب',
      status: {
        pending: 'قيد التحضير',
        assigned: 'تم تعيين السائق',
        picked_up: 'تم الاستلام من الصيدلية',
        in_transit: 'في الطريق',
        out_for_delivery: 'في طريق التوصيل',
        delivered: 'تم التسليم',
        failed: 'فشل في التسليم'
      },
      estimatedTime: (minutes: number) => `${minutes} دقيقة تقريباً`,
      minutesAgo: (minutes: number) => `منذ ${minutes} دقيقة`,
      noDelivery: 'لا يوجد تتبع متاح للطلب',
      loading: 'جاري تحميل بيانات التتبع...',
      error: 'خطأ في تحميل بيانات التتبع',
      issueType: 'نوع المشكلة',
      description: 'وصف المشكلة',
      submit: 'إرسال',
      cancel: 'إلغاء',
      refresh: 'تحديث'
    },
    en: {
      trackingDelivery: 'Delivery Tracking',
      estimatedArrival: 'Estimated Arrival',
      currentLocation: 'Current Location',
      driverInfo: 'Driver Information',
      statusTimeline: 'Status Timeline',
      contactDriver: 'Contact Driver',
      reportIssue: 'Report Issue',
      confirmDelivery: 'Confirm Delivery',
      deliveryCompleted: 'Delivery Completed',
      status: {
        pending: 'Preparing Order',
        assigned: 'Driver Assigned',
        picked_up: 'Picked Up from Pharmacy',
        in_transit: 'In Transit',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        failed: 'Delivery Failed'
      },
      estimatedTime: (minutes: number) => `${minutes} minutes approx`,
      minutesAgo: (minutes: number) => `${minutes} minutes ago`,
      noDelivery: 'No tracking available for this order',
      loading: 'Loading tracking data...',
      error: 'Error loading tracking data',
      issueType: 'Issue Type',
      description: 'Description',
      submit: 'Submit',
      cancel: 'Cancel',
      refresh: 'Refresh'
    }
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch delivery tracking data
  useEffect(() => {
    const fetchDeliveryData = async () => {
      try {
        setIsLoading(true);
        const result = await deliveryAPI.getDeliveryStatus(orderId);
        
        if (result.data.hasDelivery) {
          setDeliveryData(result.data.delivery);
        } else {
          setError(text[language].noDelivery);
        }
      } catch (err) {
        setError(text[language].error);
        console.error('Error fetching delivery data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchDeliveryData();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(fetchDeliveryData, 30000);
      return () => clearInterval(interval);
    }
  }, [orderId, language]);

  // Report issue
  const reportIssue = async () => {
    if (!issueType || !issueDescription || !deliveryData) return;
    
    try {
      await deliveryAPI.reportIssue(deliveryData.delivery_id, {
        type: issueType,
        description: issueDescription
      });
      
      setShowIssueReport(false);
      setIssueType('');
      setIssueDescription('');
      alert(language === 'ar' ? 'تم الإبلاغ عن المشكلة بنجاح' : 'Issue reported successfully');
    } catch (err) {
      console.error('Error reporting issue:', err);
      alert(language === 'ar' ? 'حدث خطأ في الإبلاغ عن المشكلة' : 'Error reporting issue');
    }
  };

  // Confirm delivery
  const confirmDelivery = async () => {
    if (!deliveryData) return;
    
    try {
      await deliveryAPI.updateDeliveryStatus(deliveryData.delivery_id, 'delivered', 'Delivery confirmed by customer');
      alert(language === 'ar' ? 'تم تأكيد استلام الطلب' : 'Delivery confirmed');
      onDeliveryComplete?.();
    } catch (err) {
      console.error('Error confirming delivery:', err);
      alert(language === 'ar' ? 'حدث خطأ في تأكيد الاستلام' : 'Error confirming delivery');
    }
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setIsLoading(true);
      const result = await deliveryAPI.getDeliveryStatus(orderId);
      
      if (result.data.hasDelivery) {
        setDeliveryData(result.data.delivery);
      }
    } catch (err) {
      console.error('Error refreshing delivery data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_transit': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon (using emojis for simplicity)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return '✅';
      case 'failed': return '❌';
      case 'in_transit': return '🚚';
      case 'out_for_delivery': return '🏃‍♂️';
      case 'picked_up': return '📦';
      case 'assigned': return '👤';
      default: return '⏳';
    }
  };

  if (isLoading && !deliveryData) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{text[language].loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!deliveryData) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border">
        <div className="p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="text-xl">📍</span>
              <span>{text[language].noDelivery}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Main Tracking Card */}
      <div className="bg-white rounded-lg shadow-lg border">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">🚚</span>
              {text[language].trackingDelivery}
            </h1>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
              {text[language].refresh}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold">{deliveryData.progress_percentage}%</span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(deliveryData.status)}`}>
                <span className="mr-2">{getStatusIcon(deliveryData.status)}</span>
                {text[language].status[deliveryData.status]}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${deliveryData.progress_percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Estimated Arrival */}
          {deliveryData.estimatedArrivalMinutes !== undefined && deliveryData.estimatedArrivalMinutes > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 text-blue-800">
                <span className="text-2xl">⏰</span>
                <div>
                  <div className="font-semibold">{text[language].estimatedArrival}</div>
                  <div className="text-blue-600">{text[language].estimatedTime(deliveryData.estimatedArrivalMinutes)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Driver Information */}
          {deliveryData.driver_name && (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">👤</span>
                {text[language].driverInfo}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{deliveryData.driver_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Phone:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{deliveryData.driver_phone}</span>
                    <button
                      onClick={() => window.open(`tel:${deliveryData.driver_phone}`)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      📞 {text[language].contactDriver}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📋</span>
              {text[language].statusTimeline}
            </h3>
            <div className="space-y-4">
              {deliveryData.statusHistory?.map((status: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-white rounded-lg border">
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {getStatusIcon(status.status)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{text[language].status[status.status]}</p>
                        {status.status_message && (
                          <p className="text-gray-600 text-sm mt-1">{status.status_message}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {text[language].minutesAgo(Math.floor((Date.now() - new Date(status.created_at).getTime()) / 60000))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setShowIssueReport(true)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <span>⚠️</span>
              {text[language].reportIssue}
            </button>
            
            {deliveryData.status === 'out_for_delivery' && (
              <button
                onClick={confirmDelivery}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <span>✅</span>
                {text[language].confirmDelivery}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Issue Report Modal */}
      {showIssueReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              {text[language].reportIssue}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {text[language].issueType}
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select issue type</option>
                  <option value="address_wrong">Wrong Address</option>
                  <option value="customer_not_available">Customer Not Available</option>
                  <option value="traffic_delay">Traffic Delay</option>
                  <option value="vehicle_breakdown">Vehicle Breakdown</option>
                  <option value="weather">Weather Conditions</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {text[language].description}
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe the issue..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={reportIssue} 
                  disabled={!issueType || !issueDescription}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {text[language].submit}
                </button>
                <button 
                  onClick={() => setShowIssueReport(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {text[language].cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;
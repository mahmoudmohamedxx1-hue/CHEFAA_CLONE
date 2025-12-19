import React, { useState, useEffect } from 'react';
import PharmacyNetwork from '../components/PharmacyNetwork';
import { MapPin, Search, Filter, Navigation } from 'lucide-react';

interface PharmacyNetworkPageProps {
  language: 'ar' | 'en';
}

export default function PharmacyNetworkPage({ language }: PharmacyNetworkPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Cairo coordinates
          setCurrentLocation({
            lat: 30.0444,
            lng: 31.2357,
            address: 'القاهرة، مصر (Cairo, Egypt)'
          });
        }
      );
    }
  }, []);

  const handleLocationSelect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({
            lat: latitude,
            lng: longitude,
            address: `الموقع الحالي (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
          });
        },
        (error) => {
          alert(language === 'ar' ? 
            'خطأ في تحديد الموقع' : 
            'Error getting location'
          );
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('شبكة الصيدليات الشريكة', 'Partner Pharmacy Network')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t(
                  'اكتشف أقرب الصيدليات المعتمدة واحصل على الأدوية الموصوفة',
                  'Discover certified pharmacies nearby and get prescribed medications'
                )}
              </p>
            </div>
            
            {/* Location Selector */}
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {t('الموقع:', 'Location:')}
              </span>
              <span className="font-medium text-brand-blue-600">
                {currentLocation?.address || t('جاري التحديد...', 'Getting location...')}
              </span>
              <button
                onClick={handleLocationSelect}
                className="ml-2 px-3 py-1 text-sm bg-brand-blue-100 text-brand-blue-700 rounded-lg hover:bg-brand-blue-200 transition-colors"
              >
                {t('تحديث الموقع', 'Update Location')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Product Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('ابحث عن دواء معين...', 'Search for specific medication...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Quick Filters */}
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {t('معتمد فقط', 'Verified Only')}
              </button>
              
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                {t('قريب مني', 'Near Me')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <PharmacyNetwork
          language={language}
          selectedProduct={selectedProduct}
          onSelectPharmacy={(pharmacy) => {
            console.log('Selected pharmacy:', pharmacy);
          }}
        />
      </div>

      {/* Information Section */}
      <div className="bg-white border-t mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* How it Works */}
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t('البحث عن صيدلية', 'Find a Pharmacy')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t(
                  'ابحث عن أقرب الصيدليات المعتمدة في منطقتك باستخدام نظام تحديد المواقع',
                  'Search for certified pharmacies near you using GPS location services'
                )}
              </p>
            </div>

            {/* Prescription Upload */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t('توجيه الروشتة', 'Route Prescription')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t(
                  'ارفع روشتتك واختر صيدلية للتوجيه المباشر واستلام الأدوية',
                  'Upload your prescription and choose a pharmacy for direct routing and medication pickup'
                )}
              </p>
            </div>

            {/* Delivery Tracking */}
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t('تتبع التوصيل', 'Track Delivery')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t(
                  'تتبع حالة طلبك ومتوسط زمن التوصيل لكل صيدلية شريكة',
                  'Track your order status and average delivery time for each partner pharmacy'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50 border-t">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t('مميزات شبكة الصيدليات الشريكة', 'Partner Pharmacy Network Benefits')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">{t('معتمد طبياً', 'Medically Certified')}</h3>
              <p className="text-gray-600 text-sm">
                {t('جميع الصيدليات معتمدة ومرخصة', 'All pharmacies are certified and licensed')}
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">{t('قريب منك', 'Near You')}</h3>
              <p className="text-gray-600 text-sm">
                {t('عثر على أقرب صيدلية باستخدام GPS', 'Find the nearest pharmacy using GPS')}
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">{t('جودة مضمونة', 'Guaranteed Quality')}</h3>
              <p className="text-gray-600 text-sm">
                {t('مؤشرات جودة وأداء موثوقة', 'Reliable quality and performance indicators')}
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">{t('تتبع فوري', 'Real-time Tracking')}</h3>
              <p className="text-gray-600 text-sm">
                {t('تتبع حالة الطلب والمخزون في الوقت الفعلي', 'Track order status and inventory in real-time')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Star, Phone, Mail, Car, Shield, Package, TrendingUp, RefreshCw, Filter, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Pharmacy = {
  id: string;
  name: string;
  name_ar: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  rating: number;
  latitude: number;
  longitude: number;
  verified: boolean;
  quality_score: number;
  monthly_orders: number;
  average_delivery_time: number;
  insurance_accepted: string[];
  payment_methods: string[];
  services: string[];
  distance?: number;
};

type InventoryItem = {
  product_id: string;
  product_name: string;
  product_name_ar: string;
  stock_quantity: number;
  price: number;
  last_updated: string;
};

type PerformanceMetrics = {
  total_orders: number;
  completed_orders: number;
  average_rating: number;
  customer_complaints: number;
  response_time_avg: number;
  delivery_time_avg: number;
  inventory_accuracy: number;
  revenue_generated: number;
};

interface PharmacyNetworkProps {
  language: 'ar' | 'en';
  selectedProduct?: string;
  onSelectPharmacy?: (pharmacy: Pharmacy) => void;
}

export default function PharmacyNetwork({ language, selectedProduct, onSelectPharmacy }: PharmacyNetworkProps) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(10); // km
  const [filterVerified, setFilterVerified] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation({ lat: 30.0444, lng: 31.2357 }); // Default to Cairo
        }
      );
    }
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };

  // Fetch pharmacies
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('verified', filterVerified);

        if (error) throw error;

        let pharmaciesWithDistance = data || [];
        
        // Calculate distances if location is available
        if (location && pharmaciesWithDistance.length > 0) {
          pharmaciesWithDistance = pharmaciesWithDistance.map(pharmacy => ({
            ...pharmacy,
            distance: calculateDistance(
              location.lat,
              location.lng,
              pharmacy.latitude,
              pharmacy.longitude
            )
          })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        // Filter by service if selected
        if (selectedService) {
          pharmaciesWithDistance = pharmaciesWithDistance.filter(pharmacy =>
            pharmacy.services.some(service => 
              service.toLowerCase().includes(selectedService.toLowerCase())
            )
          );
        }

        // Filter by search radius
        if (location && searchRadius > 0) {
          pharmaciesWithDistance = pharmaciesWithDistance.filter(pharmacy =>
            (pharmacy.distance || 0) <= searchRadius
          );
        }

        setPharmacies(pharmaciesWithDistance);
      } catch (error) {
        console.error('Error fetching pharmacies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPharmacies();
  }, [location, filterVerified, selectedService, searchRadius]);

  // Fetch inventory for selected pharmacy
  const fetchInventory = async (pharmacyId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory_sync_logs')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .eq('sync_status', 'success')
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  // Fetch performance metrics for selected pharmacy
  const fetchPerformance = async (pharmacyId: string) => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_performance_metrics')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('metric_date', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        const aggregated = data.reduce((acc, curr) => {
          acc.total_orders += curr.total_orders;
          acc.completed_orders += curr.completed_orders;
          acc.average_rating = (acc.average_rating + curr.average_rating) / 2;
          acc.customer_complaints += curr.customer_complaints;
          acc.response_time_avg = (acc.response_time_avg + curr.response_time_avg) / 2;
          acc.delivery_time_avg = (acc.delivery_time_avg + curr.delivery_time_avg) / 2;
          acc.inventory_accuracy = (acc.inventory_accuracy + curr.inventory_accuracy) / 2;
          acc.revenue_generated += curr.revenue_generated;
          return acc;
        }, {
          total_orders: 0,
          completed_orders: 0,
          average_rating: 0,
          customer_complaints: 0,
          response_time_avg: 0,
          delivery_time_avg: 0,
          inventory_accuracy: 0,
          revenue_generated: 0
        });

        setPerformance(aggregated);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }
  };

  // Handle pharmacy selection
  const handlePharmacySelect = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    fetchInventory(pharmacy.id);
    fetchPerformance(pharmacy.id);
    if (onSelectPharmacy) {
      onSelectPharmacy(pharmacy);
    }
  };

  // Handle prescription routing
  const handlePrescriptionRouting = async (pharmacyId: string, prescriptionData: any) => {
    try {
      const { error } = await supabase
        .from('prescription_routing_history')
        .insert([{
          pharmacy_id: pharmacyId,
          prescription_id: crypto.randomUUID(),
          medication_name: prescriptionData.medicationName,
          medication_name_ar: prescriptionData.medicationNameAr,
          dosage: prescriptionData.dosage,
          quantity: prescriptionData.quantity,
          delivery_address: prescriptionData.address,
          status: 'routed'
        }]);

      if (error) throw error;

      alert(t('تم توجيه الروشتة بنجاح', 'Prescription routed successfully'));
    } catch (error) {
      console.error('Error routing prescription:', error);
      alert(t('حدث خطأ في توجيه الروشتة', 'Error routing prescription'));
    }
  };

  // Map initialization (simplified - in a real app you'd use Google Maps or similar)
  const renderMap = () => {
    if (!mapRef.current) return null;

    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-brand-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">
              {t('خريطة تفاعلية للصيدليات القريبة', 'Interactive Map of Nearby Pharmacies')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t(
                'تعرض الخريطة موقع الصيدليات المختارة مع المسافات',
                'Shows selected pharmacy locations with distances'
              )}
            </p>
          </div>
        </div>
        
        {/* Simulated map markers */}
        {pharmacies.slice(0, 5).map((pharmacy, index) => (
          <div
            key={pharmacy.id}
            className="absolute w-6 h-6 bg-brand-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:bg-brand-blue-600 transition-colors"
            style={{
              left: `${20 + index * 15}%`,
              top: `${30 + (index % 2) * 20}%`
            }}
            onClick={() => handlePharmacySelect(pharmacy)}
            title={language === 'ar' ? pharmacy.name_ar : pharmacy.name}
          >
            <div className="w-full h-full rounded-full bg-brand-blue-500 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('شبكة الصيدليات الشريكة', 'Partner Pharmacy Network')}
        </h1>
        <p className="text-gray-600">
          {t(
            'اعثر على أقرب صيدلية معتمدة مع المنتجات المتاحة',
            'Find nearest certified pharmacy with available products'
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium">{t('تصفية:', 'Filters:')}</span>
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterVerified}
              onChange={(e) => setFilterVerified(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">{t('الصيدليات المعتمدة فقط', 'Verified Only')}</span>
          </label>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">{t('جميع الخدمات', 'All Services')}</option>
            <option value="delivery">{t('توصيل للمنزل', 'Home Delivery')}</option>
            <option value="24/7">{t('خدمة ٢٤/٧', '24/7 Service')}</option>
            <option value="insurance">{t('تأمين', 'Insurance')}</option>
            <option value="consultation">{t('استشارة طبية', 'Medical Consultation')}</option>
          </select>

          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-gray-500" />
            <label className="text-sm">{t('نطاق البحث:', 'Search Radius:')}</label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value={5}>5 {t('كم', 'km')}</option>
              <option value={10}>10 {t('كم', 'km')}</option>
              <option value={25}>25 {t('كم', 'km')}</option>
              <option value={50}>50 {t('كم', 'km')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-xl font-semibold mb-4">{t('الخريطة التفاعلية', 'Interactive Map')}</h2>
        {renderMap()}
      </div>

      {/* Pharmacy List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">
            {t('الصيدليات القريبة', 'Nearby Pharmacies')}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({pharmacies.length} {t('صيدلية', 'pharmacies')})
            </span>
          </h2>
        </div>
        
        <div className="divide-y">
          {pharmacies.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedPharmacy?.id === pharmacy.id ? 'bg-blue-50 border-l-4 border-brand-blue-500' : ''
              }`}
              onClick={() => handlePharmacySelect(pharmacy)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      {language === 'ar' ? pharmacy.name_ar : pharmacy.name}
                    </h3>
                    {pharmacy.verified && (
                      <Shield className="w-5 h-5 text-green-500" title={t('معتمد', 'Verified')} />
                    )}
                    {pharmacy.distance && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {pharmacy.distance.toFixed(1)} {t('كم', 'km')}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">{pharmacy.address}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{pharmacy.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{pharmacy.average_delivery_time} {t('دقيقة', 'min')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{pharmacy.monthly_orders} {t('طلب/شهر', 'orders/month')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>{pharmacy.quality_score}/5.0</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {pharmacy.services.slice(0, 3).map((service, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-brand-blue-100 text-brand-blue-800 text-xs rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                    {pharmacy.services.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{pharmacy.services.length - 3} {t('المزيد', 'more')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{pharmacy.phone}</span>
                  </div>
                  {pharmacy.email && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate max-w-32">{pharmacy.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Pharmacy Details */}
      {selectedPharmacy && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? selectedPharmacy.name_ar : selectedPharmacy.name}
              </h2>
              <p className="text-gray-600">{selectedPharmacy.address}</p>
            </div>
            <button
              onClick={() => {
                fetchInventory(selectedPharmacy.id);
                fetchPerformance(selectedPharmacy.id);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-500 text-white rounded-lg hover:bg-brand-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('تحديث البيانات', 'Refresh Data')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quality Indicators */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">
                  {t('مؤشر الجودة', 'Quality Score')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {selectedPharmacy.quality_score}/5.0
              </p>
            </div>

            {/* Delivery Performance */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">
                  {t('متوسط التوصيل', 'Avg Delivery')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {selectedPharmacy.average_delivery_time} {t('دقيقة', 'min')}
              </p>
            </div>

            {/* Monthly Orders */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">
                  {t('الطلبات الشهرية', 'Monthly Orders')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {selectedPharmacy.monthly_orders}
              </p>
            </div>

            {/* Customer Rating */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">
                  {t('تقييم العملاء', 'Customer Rating')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {selectedPharmacy.rating.toFixed(1)}/5.0
              </p>
            </div>
          </div>

          {/* Inventory Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t('المخزون المتاح', 'Available Inventory')}
            </h3>
            {inventory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.slice(0, 9).map((item) => (
                  <div key={item.product_id} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm">
                      {language === 'ar' ? item.product_name_ar : item.product_name}
                    </h4>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-green-600 font-semibold">
                        {item.price} {t('جنيه', 'EGP')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {t('متوفر:', 'Stock:')} {item.stock_quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                {t('لا توجد بيانات مخزون متاحة', 'No inventory data available')}
              </p>
            )}
          </div>

          {/* Performance Dashboard */}
          {performance && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t('لوحة الأداء', 'Performance Dashboard')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{performance.total_orders}</p>
                  <p className="text-sm text-gray-600">{t('إجمالي الطلبات', 'Total Orders')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{performance.completed_orders}</p>
                  <p className="text-sm text-gray-600">{t('طلبات مكتملة', 'Completed Orders')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{performance.customer_complaints}</p>
                  <p className="text-sm text-gray-600">{t('شكوى عملاء', 'Customer Complaints')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {performance.inventory_accuracy.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">{t('دقة المخزون', 'Inventory Accuracy')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Prescription Routing Interface */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              {t('واجهة توجيه الروشتة', 'Prescription Routing Interface')}
            </h3>
            <PrescriptionRoutingForm
              pharmacyId={selectedPharmacy.id}
              language={language}
              onRoute={handlePrescriptionRouting}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Prescription Routing Form Component
function PrescriptionRoutingForm({ 
  pharmacyId, 
  language, 
  onRoute 
}: { 
  pharmacyId: string;
  language: 'ar' | 'en';
  onRoute: (pharmacyId: string, data: any) => void;
}) {
  const [formData, setFormData] = useState({
    medicationName: '',
    medicationNameAr: '',
    dosage: '',
    quantity: 1,
    address: '',
    notes: ''
  });

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.medicationName && formData.address) {
      onRoute(pharmacyId, formData);
      setFormData({
        medicationName: '',
        medicationNameAr: '',
        dosage: '',
        quantity: 1,
        address: '',
        notes: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder={t('اسم الدواء (بالإنجليزية)', 'Medication Name (English)')}
          value={formData.medicationName}
          onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
          className="px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="text"
          placeholder={t('اسم الدواء (بالعربية)', 'Medication Name (Arabic)')}
          value={formData.medicationNameAr}
          onChange={(e) => setFormData({ ...formData, medicationNameAr: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder={t('الجرعة', 'Dosage')}
          value={formData.dosage}
          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="number"
          placeholder={t('الكمية', 'Quantity')}
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
          className="px-3 py-2 border rounded-lg"
          min="1"
          required
        />
      </div>
      <textarea
        placeholder={t('عنوان التوصيل', 'Delivery Address')}
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg"
        rows={3}
        required
      />
      <textarea
        placeholder={t('ملاحظات إضافية', 'Additional Notes')}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg"
        rows={2}
      />
      <button
        type="submit"
        className="w-full md:w-auto px-6 py-2 bg-brand-blue-500 text-white rounded-lg hover:bg-brand-blue-600 transition-colors"
      >
        {t('توجيه الروشتة', 'Route Prescription')}
      </button>
    </form>
  );
}
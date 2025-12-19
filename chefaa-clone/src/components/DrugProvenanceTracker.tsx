import React, { useState } from 'react';
import { QrCode, MapPin, CheckCircle, AlertTriangle, Package, Truck, Building, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DrugProvenanceTrackerProps {
  language: 'ar' | 'en';
}

const DrugProvenanceTracker: React.FC<DrugProvenanceTrackerProps> = ({ language }) => {
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const [error, setError] = useState('');

  const isRTL = language === 'ar';

  const texts = {
    title: {
      ar: 'تتبع مصدر الدواء بتقنية البلوك تشين',
      en: 'Blockchain Drug Provenance Tracker'
    },
    subtitle: {
      ar: 'تحقق من أصالة الدواء وتتبع رحلته من المصنع إليك',
      en: 'Verify medication authenticity and track its journey from manufacturer to you'
    },
    inputLabel: {
      ar: 'رقم الدفعة أو رمز QR',
      en: 'Batch Number or QR Code'
    },
    verifyButton: {
      ar: 'التحقق من الأصالة',
      en: 'Verify Authenticity'
    },
    scanQR: {
      ar: 'مسح رمز QR',
      en: 'Scan QR Code'
    },
    verified: {
      ar: 'موثق - منتج أصلي',
      en: 'Verified - Authentic Product'
    },
    expired: {
      ar: 'منتهي الصلاحية',
      en: 'Expired'
    },
    counterfeit: {
      ar: 'تحذير: منتج مزيف محتمل',
      en: 'Warning: Potential Counterfeit'
    },
    batchInfo: {
      ar: 'معلومات الدفعة',
      en: 'Batch Information'
    },
    supplyChain: {
      ar: 'سلسلة التوريد',
      en: 'Supply Chain Journey'
    },
    manufacturer: {
      ar: 'المصنّع',
      en: 'Manufacturer'
    },
    mfgDate: {
      ar: 'تاريخ التصنيع',
      en: 'Manufacturing Date'
    },
    expDate: {
      ar: 'تاريخ انتهاء الصلاحية',
      en: 'Expiry Date'
    },
    blockchain: {
      ar: 'هاش البلوك تشين',
      en: 'Blockchain Hash'
    },
    units: {
      ar: 'الوحدات',
      en: 'Units'
    },
    produced: {
      ar: 'المنتج',
      en: 'Produced'
    },
    distributed: {
      ar: 'الموزع',
      en: 'Distributed'
    }
  };

  const handleVerify = async () => {
    if (!batchNumber.trim()) {
      setError(isRTL ? 'الرجاء إدخال رقم الدفعة' : 'Please enter a batch number');
      return;
    }

    setLoading(true);
    setError('');
    setVerification(null);

    try {
      const { data, error } = await supabase.functions.invoke('blockchain-verification', {
        body: {
          action: 'verify_batch',
          data: {
            batchNumber: batchNumber.trim(),
            qrCode: batchNumber.trim(),
          },
        },
      });

      if (error) throw error;

      setVerification(data);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'counterfeit':
      case 'unknown':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'expired':
        return <Clock className="h-6 w-6 text-orange-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'manufactured':
        return <Building className="h-5 w-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'received':
        return <Package className="h-5 w-5 text-indigo-600" />;
      case 'dispensed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              {texts.title[language]}
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {texts.subtitle[language]}
          </p>
        </div>

        {/* Verification Input */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts.inputLabel[language]}
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isRTL ? 'أدخل رقم الدفعة أو امسح رمز QR' : 'Enter batch number or scan QR code'}
                disabled={loading}
              />
            </div>
            <div className="flex gap-3 items-end">
              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {loading ? (isRTL ? 'جاري التحقق...' : 'Verifying...') : texts.verifyButton[language]}
              </button>
              <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                {texts.scanQR[language]}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Verification Results */}
        {verification && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`rounded-lg border-2 p-6 ${getStatusColor(verification.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(verification.status)}
                  <span className="ml-3 text-xl font-bold">
                    {verification.status === 'verified' && texts.verified[language]}
                    {verification.status === 'expired' && texts.expired[language]}
                    {verification.status === 'unknown' && texts.counterfeit[language]}
                  </span>
                </div>
                <div className="text-sm">
                  {new Date(verification.verifiedAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </div>
              </div>
            </div>

            {/* Batch Information */}
            {verification.batch && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {texts.batchInfo[language]}
                </h2>

                {verification.batch.product && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center">
                    {verification.batch.product.image_url && (
                      <img
                        src={verification.batch.product.image_url}
                        alt={verification.batch.product.name_en}
                        className="w-20 h-20 object-cover rounded-lg mr-4"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {language === 'ar' ? verification.batch.product.name_ar : verification.batch.product.name_en}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {language === 'ar' ? verification.batch.product.description_ar : verification.batch.product.description_en}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium mb-1">{texts.manufacturer[language]}</div>
                    <div className="font-semibold">{verification.batch.manufacturer.name}</div>
                    <div className="text-sm text-gray-600">{verification.batch.manufacturer.location}</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium mb-1">{texts.mfgDate[language]}</div>
                    <div className="font-semibold">{new Date(verification.batch.manufacturingDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm text-orange-600 font-medium mb-1">{texts.expDate[language]}</div>
                    <div className="font-semibold">{new Date(verification.batch.expiryDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium mb-1">{texts.units[language]}</div>
                    <div className="font-semibold">
                      {texts.distributed[language]}: {verification.batch.unitsDistributed} / {texts.produced[language]}: {verification.batch.unitsProduced}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <div className="text-xs text-gray-500 mb-1">{texts.blockchain[language]}</div>
                  <div className="text-xs font-mono break-all">{verification.batch.blockchainHash}</div>
                </div>
              </div>
            )}

            {/* Supply Chain Timeline */}
            {verification.supplyChain && verification.supplyChain.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {texts.supplyChain[language]}
                </h2>

                <div className="space-y-4">
                  {verification.supplyChain.map((event: any, index: number) => (
                    <div key={event.id} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                          {getEventIcon(event.event_type)}
                        </div>
                      </div>
                      <div className={`${isRTL ? 'mr-4' : 'ml-4'} flex-1`}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold capitalize">
                            {event.event_type.replace('_', ' ')}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {new Date(event.event_timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>
                        <div className="mt-1 text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.location_name}
                          </div>
                          <div className="text-sm mt-1">
                            {isRTL ? 'المسؤول' : 'Handler'}: {event.handler_name}
                          </div>
                          {event.units_transferred && (
                            <div className="text-sm mt-1">
                              {isRTL ? 'الوحدات المنقولة' : 'Units Transferred'}: {event.units_transferred}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* How it Works Section */}
        {!verification && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isRTL ? 'كيف يعمل النظام' : 'How It Works'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                  <QrCode className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  {isRTL ? '1. امسح رمز QR' : '1. Scan QR Code'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isRTL ? 'كل عبوة دواء تحتوي على رمز QR فريد مرتبط بالبلوك تشين' : 'Every medication package has a unique QR code linked to the blockchain'}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  {isRTL ? '2. التحقق الفوري' : '2. Instant Verification'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isRTL ? 'النظام يتحقق من أصالة الدواء عبر البلوك تشين' : 'System verifies authenticity through blockchain'}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
                  <Truck className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  {isRTL ? '3. تتبع الرحلة' : '3. Track Journey'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isRTL ? 'شاهد رحلة الدواء الكاملة من المصنع إليك' : 'View complete journey from manufacturer to you'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrugProvenanceTracker;

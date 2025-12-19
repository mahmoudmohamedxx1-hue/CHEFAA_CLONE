import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, CreditCard, Calendar, ArrowRight, Shield, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SmartContractPrescriptionProps {
  language: 'ar' | 'en';
}

interface PrescriptionContract {
  id: string;
  prescription_id: string;
  patient_name: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  total_cost: number;
  current_state: string;
  insurance_verified: boolean;
  payment_authorized: boolean;
  pharmacy_assigned: boolean;
  dispensed_at?: string;
  refill_scheduled_at?: string;
  created_at: string;
}

interface LifecycleStep {
  step: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp?: string;
  metadata?: Record<string, any>;
}

const SmartContractPrescription: React.FC<SmartContractPrescriptionProps> = ({ language }) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<PrescriptionContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<PrescriptionContract | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleStep[]>([]);
  const [error, setError] = useState('');

  const isRTL = language === 'ar';

  const texts = {
    title: {
      ar: 'العقود الذكية للوصفات الطبية',
      en: 'Smart Contract Prescription Management'
    },
    subtitle: {
      ar: 'إدارة تلقائية للوصفات الطبية باستخدام تقنية العقود الذكية',
      en: 'Automated prescription fulfillment using smart contract technology'
    },
    myContracts: {
      ar: 'عقودي النشطة',
      en: 'My Active Contracts'
    },
    createNew: {
      ar: 'إنشاء عقد جديد',
      en: 'Create New Contract'
    },
    contractDetails: {
      ar: 'تفاصيل العقد',
      en: 'Contract Details'
    },
    lifecycle: {
      ar: 'دورة حياة العقد',
      en: 'Contract Lifecycle'
    },
    medication: {
      ar: 'الدواء',
      en: 'Medication'
    },
    dosage: {
      ar: 'الجرعة',
      en: 'Dosage'
    },
    frequency: {
      ar: 'التكرار',
      en: 'Frequency'
    },
    duration: {
      ar: 'المدة',
      en: 'Duration'
    },
    totalCost: {
      ar: 'التكلفة الإجمالية',
      en: 'Total Cost'
    },
    currentState: {
      ar: 'الحالة الحالية',
      en: 'Current State'
    },
    insuranceVerified: {
      ar: 'التأمين موثق',
      en: 'Insurance Verified'
    },
    paymentAuthorized: {
      ar: 'الدفع معتمد',
      en: 'Payment Authorized'
    },
    pharmacyAssigned: {
      ar: 'الصيدلية محددة',
      en: 'Pharmacy Assigned'
    },
    dispensed: {
      ar: 'تم الصرف',
      en: 'Dispensed'
    },
    refillScheduled: {
      ar: 'إعادة التعبئة مجدولة',
      en: 'Refill Scheduled'
    },
    days: {
      ar: 'يوم',
      en: 'days'
    },
    verifyInsurance: {
      ar: 'التحقق من التأمين',
      en: 'Verify Insurance'
    },
    authorizePayment: {
      ar: 'اعتماد الدفع',
      en: 'Authorize Payment'
    },
    scheduleRefill: {
      ar: 'جدولة إعادة التعبئة',
      en: 'Schedule Refill'
    },
    viewLifecycle: {
      ar: 'عرض دورة الحياة',
      en: 'View Lifecycle'
    },
    noContracts: {
      ar: 'لا توجد عقود نشطة',
      en: 'No active contracts'
    },
    loading: {
      ar: 'جارٍ التحميل...',
      en: 'Loading...'
    },
    status: {
      initiated: { ar: 'تم الإنشاء', en: 'Initiated' },
      insurance_verified: { ar: 'التأمين موثق', en: 'Insurance Verified' },
      payment_authorized: { ar: 'الدفع معتمد', en: 'Payment Authorized' },
      pharmacy_assigned: { ar: 'الصيدلية محددة', en: 'Pharmacy Assigned' },
      dispensed: { ar: 'تم الصرف', en: 'Dispensed' },
      completed: { ar: 'مكتمل', en: 'Completed' },
      refill_scheduled: { ar: 'إعادة التعبئة مجدولة', en: 'Refill Scheduled' }
    }
  };

  useEffect(() => {
    if (user) {
      loadContracts();
    }
  }, [user]);

  const loadContracts = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('smart_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setContracts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLifecycle = async (contractId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('prescription_lifecycle')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setLifecycle(data || []);
    } catch (err: any) {
      console.error('Error loading lifecycle:', err);
    }
  };

  const executeContractStep = async (contractId: string, action: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-contract-prescription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'execute-step',
            contract_id: contractId,
            step: action
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to execute step');
      }

      const result = await response.json();
      
      // Reload contracts and lifecycle
      await loadContracts();
      if (selectedContract) {
        await loadLifecycle(contractId);
      }

      alert(language === 'ar' ? 'تم التنفيذ بنجاح' : 'Step executed successfully');
    } catch (err: any) {
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      initiated: 'text-blue-600 bg-blue-50',
      insurance_verified: 'text-green-600 bg-green-50',
      payment_authorized: 'text-purple-600 bg-purple-50',
      pharmacy_assigned: 'text-orange-600 bg-orange-50',
      dispensed: 'text-teal-600 bg-teal-50',
      completed: 'text-green-700 bg-green-100',
      refill_scheduled: 'text-indigo-600 bg-indigo-50'
    };
    return colors[state] || 'text-gray-600 bg-gray-50';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 py-12 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              {texts.title[language]}
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {texts.subtitle[language]}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Contracts Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {loading ? (
            <div className="col-span-2 text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">{texts.loading[language]}</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white rounded-xl shadow-sm">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">{texts.noContracts[language]}</p>
            </div>
          ) : (
            contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
              >
                {/* Contract Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {contract.medication_name}
                    </h3>
                    <p className="text-sm text-gray-500">{contract.patient_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStateColor(contract.current_state)}`}>
                    {texts.status[contract.current_state as keyof typeof texts.status]?.[language] || contract.current_state}
                  </span>
                </div>

                {/* Contract Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{texts.dosage[language]}:</span>
                    <span className="font-semibold">{contract.dosage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{texts.frequency[language]}:</span>
                    <span className="font-semibold">{contract.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{texts.duration[language]}:</span>
                    <span className="font-semibold">{contract.duration_days} {texts.days[language]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{texts.totalCost[language]}:</span>
                    <span className="font-bold text-green-600">${contract.total_cost}</span>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className={`flex flex-col items-center p-2 rounded-lg ${contract.insurance_verified ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <Shield className={`w-5 h-5 mb-1 ${contract.insurance_verified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-xs text-center">{language === 'ar' ? 'تأمين' : 'Insurance'}</span>
                  </div>
                  <div className={`flex flex-col items-center p-2 rounded-lg ${contract.payment_authorized ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <DollarSign className={`w-5 h-5 mb-1 ${contract.payment_authorized ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-xs text-center">{language === 'ar' ? 'دفع' : 'Payment'}</span>
                  </div>
                  <div className={`flex flex-col items-center p-2 rounded-lg ${contract.pharmacy_assigned ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <CheckCircle className={`w-5 h-5 mb-1 ${contract.pharmacy_assigned ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-xs text-center">{language === 'ar' ? 'صيدلية' : 'Pharmacy'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!contract.insurance_verified && (
                    <button
                      onClick={() => executeContractStep(contract.id, 'verify_insurance')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      disabled={loading}
                    >
                      {texts.verifyInsurance[language]}
                    </button>
                  )}
                  {contract.insurance_verified && !contract.payment_authorized && (
                    <button
                      onClick={() => executeContractStep(contract.id, 'authorize_payment')}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      disabled={loading}
                    >
                      {texts.authorizePayment[language]}
                    </button>
                  )}
                  {contract.current_state === 'dispensed' && (
                    <button
                      onClick={() => executeContractStep(contract.id, 'schedule_refill')}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                      disabled={loading}
                    >
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {texts.scheduleRefill[language]}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedContract(contract);
                      loadLifecycle(contract.id);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    {texts.viewLifecycle[language]}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lifecycle Modal */}
        {selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {texts.lifecycle[language]}
                  </h2>
                  <button
                    onClick={() => setSelectedContract(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1">{selectedContract.medication_name}</h3>
                  <p className="text-sm text-gray-600">{selectedContract.patient_name}</p>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  {lifecycle.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        {getStepIcon(step.status)}
                        {index < lifecycle.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900">{step.step}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            step.status === 'completed' ? 'bg-green-100 text-green-700' :
                            step.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                        {step.timestamp && (
                          <p className="text-xs text-gray-500">
                            {new Date(step.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                          </p>
                        )}
                        {step.metadata && Object.keys(step.metadata).length > 0 && (
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                            {JSON.stringify(step.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartContractPrescription;

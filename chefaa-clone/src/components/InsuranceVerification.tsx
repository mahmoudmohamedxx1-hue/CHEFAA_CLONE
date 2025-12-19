import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { 
  Shield, Plus, Edit2, Trash2, CheckCircle, XCircle, 
  AlertCircle, Clock, FileText, Upload, Download, Search,
  Calculator, CreditCard, FileCheck, Zap, RefreshCw
} from 'lucide-react';

interface InsuranceVerificationProps {
  language: 'ar' | 'en';
}

interface InsuranceProvider {
  id: string;
  name: string;
  name_ar: string | null;
  provider_code: string;
  contact_phone: string | null;
  contact_email: string | null;
  coverage_types: string[];
  is_active: boolean;
}

interface UserInsurance {
  id: string;
  provider_id: string;
  policy_number: string;
  member_id: string;
  group_number: string | null;
  coverage_type: string;
  coverage_start_date: string;
  coverage_end_date: string;
  verification_status: string;
  verification_date: string | null;
  copay_percentage: number | null;
  max_coverage_amount: number | null;
  card_image_url: string | null;
  insurance_providers?: InsuranceProvider;
}

interface InsuranceClaim {
  id: string;
  user_insurance_id: string;
  order_id: string | null;
  claim_amount: number;
  approved_amount: number | null;
  claim_status: string;
  submitted_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
  claim_number: string;
}

export default function InsuranceVerification({ language }: InsuranceVerificationProps) {
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [userInsurances, setUserInsurances] = useState<UserInsurance[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showRealTimeVerification, setShowRealTimeVerification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingCard, setUploadingCard] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [copayCalculation, setCopayCalculation] = useState<any>(null);

  const [newInsurance, setNewInsurance] = useState({
    provider_id: '',
    policy_number: '',
    member_id: '',
    group_number: '',
    coverage_type: 'full',
    coverage_start_date: '',
    coverage_end_date: '',
    copay_percentage: 20,
    max_coverage_amount: 0
  });

  const [newClaim, setNewClaim] = useState({
    user_insurance_id: '',
    order_id: '',
    claim_amount: 0,
    supporting_documents: null as File | null
  });

  const [realTimeVerification, setRealTimeVerification] = useState({
    provider_code: '',
    policy_number: '',
    member_id: '',
    group_number: '',
    order_amount: 0,
    medications: [] as Array<{
      name: string;
      dosage: string;
      quantity: number;
      price: number;
    }>
  });

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    fetchProviders();
    fetchUserInsurances();
    fetchClaims();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_providers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setProviders(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUserInsurances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_insurance')
        .select(`
          *,
          insurance_providers (
            id, name, name_ar, provider_code, 
            contact_phone, contact_email, coverage_types
          )
        `)
        .eq('user_id', user.id)
        .order('coverage_start_date', { ascending: false });

      if (error) throw error;
      setUserInsurances(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's insurance IDs first
      const { data: insurances } = await supabase
        .from('user_insurance')
        .select('id')
        .eq('user_id', user.id);

      if (!insurances || insurances.length === 0) return;

      const insuranceIds = insurances.map(i => i.id);

      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .in('user_insurance_id', insuranceIds)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (err: any) {
      console.error('Error fetching claims:', err);
    }
  };

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_insurance')
        .insert({
          user_id: user.id,
          provider_id: newInsurance.provider_id,
          policy_number: newInsurance.policy_number,
          member_id: newInsurance.member_id,
          group_number: newInsurance.group_number || null,
          coverage_type: newInsurance.coverage_type,
          coverage_start_date: newInsurance.coverage_start_date,
          coverage_end_date: newInsurance.coverage_end_date,
          copay_percentage: newInsurance.copay_percentage,
          max_coverage_amount: newInsurance.max_coverage_amount > 0 ? newInsurance.max_coverage_amount : null,
          verification_status: 'pending'
        });

      if (error) throw error;

      setSuccess(t('تمت إضافة التأمين بنجاح', 'Insurance added successfully'));
      setShowAddForm(false);
      setNewInsurance({
        provider_id: '',
        policy_number: '',
        member_id: '',
        group_number: '',
        coverage_type: 'full',
        coverage_start_date: '',
        coverage_end_date: '',
        copay_percentage: 20,
        max_coverage_amount: 0
      });
      fetchUserInsurances();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUploadCard = async (insuranceId: string, file: File) => {
    setUploadingCard(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to Supabase Storage
      const fileName = `${user.id}/${insuranceId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('insurance-cards')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('insurance-cards')
        .getPublicUrl(fileName);

      // Update insurance record
      const { error: updateError } = await supabase
        .from('user_insurance')
        .update({ card_image_url: publicUrl })
        .eq('id', insuranceId);

      if (updateError) throw updateError;

      setSuccess(t('تم رفع صورة البطاقة', 'Card image uploaded'));
      fetchUserInsurances();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingCard(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate claim number
      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const { error } = await supabase
        .from('insurance_claims')
        .insert({
          user_insurance_id: newClaim.user_insurance_id,
          order_id: newClaim.order_id || null,
          claim_amount: newClaim.claim_amount,
          claim_status: 'pending',
          claim_number: claimNumber,
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;

      setSuccess(t('تم تقديم المطالبة', 'Claim submitted successfully'));
      setShowClaimForm(false);
      setNewClaim({
        user_insurance_id: '',
        order_id: '',
        claim_amount: 0,
        supporting_documents: null
      });
      fetchClaims();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRequestVerification = async (insuranceId: string) => {
    try {
      const { error } = await supabase
        .from('user_insurance')
        .update({ 
          verification_status: 'pending',
          verification_date: null
        })
        .eq('id', insuranceId);

      if (error) throw error;

      setSuccess(t('تم إرسال طلب التحقق', 'Verification request sent'));
      fetchUserInsurances();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRealTimeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError('');
    setVerificationResult(null);
    setCopayCalculation(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-insurance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          provider_code: realTimeVerification.provider_code,
          policy_number: realTimeVerification.policy_number,
          member_id: realTimeVerification.member_id,
          group_number: realTimeVerification.group_number || undefined,
          order_amount: realTimeVerification.order_amount,
          medications: realTimeVerification.medications.length > 0 ? realTimeVerification.medications : undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      setVerificationResult(result);

      if (result.copay_calculation) {
        setCopayCalculation(result.copay_calculation);

        // Store calculation in database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('insurance_copay_calculations')
            .insert({
              user_insurance_id: userInsurances.find(ins => 
                ins.insurance_providers?.provider_code === realTimeVerification.provider_code
              )?.id || null,
              total_order_amount: result.copay_calculation.total_order_amount,
              deductible_applied: result.copay_calculation.deductible_applied || 0,
              copay_percentage_applied: result.coverage_details?.copay_percentage || 0,
              insurance_coverage: result.copay_calculation.insurance_coverage,
              patient_responsibility: result.copay_calculation.patient_responsibility,
              medication_breakdown: result.copay_calculation.medication_breakdown,
              calculation_details: result,
              is_final: false,
              calculated_by: 'real_time_api'
            });
        }
      }

      setSuccess(t('تم التحقق من التأمين بنجاح', 'Insurance verification completed successfully'));
    } catch (err: any) {
      setError(err.message || t('فشل في التحقق من التأمين', 'Insurance verification failed'));
    } finally {
      setVerifying(false);
    }
  };

  const handleAddMedication = () => {
    setRealTimeVerification({
      ...realTimeVerification,
      medications: [
        ...realTimeVerification.medications,
        { name: '', dosage: '', quantity: 1, price: 0 }
      ]
    });
  };

  const handleUpdateMedication = (index: number, field: string, value: any) => {
    const updated = [...realTimeVerification.medications];
    updated[index] = { ...updated[index], [field]: value };
    setRealTimeVerification({
      ...realTimeVerification,
      medications: updated
    });
  };

  const handleRemoveMedication = (index: number) => {
    const updated = realTimeVerification.medications.filter((_, i) => i !== index);
    setRealTimeVerification({
      ...realTimeVerification,
      medications: updated
    });
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('التحقق من التأمين', 'Insurance Verification')}
        </h1>
        <p className="text-gray-600">
          {t('إدارة بطاقات التأمين والمطالبات', 'Manage your insurance cards and claims')}
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-brand-600 text-white py-2 px-6 rounded-lg hover:bg-brand-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('إضافة تأمين', 'Add Insurance')}
        </button>
        <button
          onClick={() => setShowClaimForm(!showClaimForm)}
          disabled={userInsurances.length === 0}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <FileText className="w-5 h-5" />
          {t('تقديم مطالبة', 'Submit Claim')}
        </button>
        <button
          onClick={() => setShowRealTimeVerification(!showRealTimeVerification)}
          className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <Zap className="w-5 h-5" />
          {t('التحقق الفوري', 'Real-time Verification')}
        </button>
      </div>

      {/* Add Insurance Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {t('إضافة بطاقة تأمين جديدة', 'Add New Insurance Card')}
          </h3>

          <form onSubmit={handleAddInsurance} className="space-y-4">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('شركة التأمين', 'Insurance Provider')} *
              </label>
              <select
                value={newInsurance.provider_id}
                onChange={(e) => setNewInsurance({ ...newInsurance, provider_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                required
              >
                <option value="">{t('اختر شركة التأمين', 'Select Provider')}</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {language === 'ar' && provider.name_ar ? provider.name_ar : provider.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Policy & Member Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم البوليصة', 'Policy Number')} *
                </label>
                <input
                  type="text"
                  value={newInsurance.policy_number}
                  onChange={(e) => setNewInsurance({ ...newInsurance, policy_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم العضوية', 'Member ID')} *
                </label>
                <input
                  type="text"
                  value={newInsurance.member_id}
                  onChange={(e) => setNewInsurance({ ...newInsurance, member_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم المجموعة', 'Group Number')}
                </label>
                <input
                  type="text"
                  value={newInsurance.group_number}
                  onChange={(e) => setNewInsurance({ ...newInsurance, group_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Coverage Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('نوع التغطية', 'Coverage Type')}
                </label>
                <select
                  value={newInsurance.coverage_type}
                  onChange={(e) => setNewInsurance({ ...newInsurance, coverage_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="full">{t('تغطية كاملة', 'Full Coverage')}</option>
                  <option value="partial">{t('تغطية جزئية', 'Partial Coverage')}</option>
                  <option value="medications_only">{t('الأدوية فقط', 'Medications Only')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('نسبة التحمل (%)', 'Copay Percentage (%)')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newInsurance.copay_percentage}
                  onChange={(e) => setNewInsurance({ ...newInsurance, copay_percentage: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('الحد الأقصى للتغطية', 'Max Coverage Amount')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={newInsurance.max_coverage_amount}
                  onChange={(e) => setNewInsurance({ ...newInsurance, max_coverage_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder={t('اتركه فارغاً إذا كان غير محدود', 'Leave empty if unlimited')}
                />
              </div>
            </div>

            {/* Coverage Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('تاريخ البداية', 'Start Date')} *
                </label>
                <input
                  type="date"
                  value={newInsurance.coverage_start_date}
                  onChange={(e) => setNewInsurance({ ...newInsurance, coverage_start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('تاريخ الانتهاء', 'End Date')} *
                </label>
                <input
                  type="date"
                  value={newInsurance.coverage_end_date}
                  onChange={(e) => setNewInsurance({ ...newInsurance, coverage_end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-brand-600 text-white py-2 px-4 rounded-lg hover:bg-brand-700 transition"
              >
                {t('حفظ', 'Save')}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submit Claim Form */}
      {showClaimForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {t('تقديم مطالبة تأمين', 'Submit Insurance Claim')}
          </h3>

          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('بطاقة التأمين', 'Insurance Card')} *
              </label>
              <select
                value={newClaim.user_insurance_id}
                onChange={(e) => setNewClaim({ ...newClaim, user_insurance_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                required
              >
                <option value="">{t('اختر بطاقة التأمين', 'Select Insurance Card')}</option>
                {userInsurances.filter(ins => ins.verification_status === 'verified').map(insurance => (
                  <option key={insurance.id} value={insurance.id}>
                    {insurance.insurance_providers?.name} - {insurance.policy_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم الطلب (اختياري)', 'Order ID (Optional)')}
                </label>
                <input
                  type="text"
                  value={newClaim.order_id}
                  onChange={(e) => setNewClaim({ ...newClaim, order_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  placeholder={t('رقم الطلب من المنصة', 'Platform order number')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('قيمة المطالبة', 'Claim Amount')} *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newClaim.claim_amount}
                  onChange={(e) => setNewClaim({ ...newClaim, claim_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-brand-600 text-white py-2 px-4 rounded-lg hover:bg-brand-700 transition"
              >
                {t('تقديم المطالبة', 'Submit Claim')}
              </button>
              <button
                type="button"
                onClick={() => setShowClaimForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Real-time Verification Form */}
      {showRealTimeVerification && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 mb-8 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {t('التحقق الفوري من التأمين وحساب التحمل', 'Real-time Insurance Verification & Copay Calculation')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('تحقق فوري من صحة التأمين واحسب المبلغ المطلوب', 'Instantly verify insurance and calculate your copay')}
              </p>
            </div>
          </div>

          <form onSubmit={handleRealTimeVerification} className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('شركة التأمين', 'Insurance Provider')} *
              </label>
              <select
                value={realTimeVerification.provider_code}
                onChange={(e) => setRealTimeVerification({ ...realTimeVerification, provider_code: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">{t('اختر شركة التأمين', 'Select Provider')}</option>
                {providers.filter(p => p.provider_code.startsWith('EG')).map(provider => (
                  <option key={provider.id} value={provider.provider_code}>
                    {language === 'ar' && provider.name_ar ? provider.name_ar : provider.name} ({provider.provider_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Policy Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم البوليصة', 'Policy Number')} *
                </label>
                <input
                  type="text"
                  value={realTimeVerification.policy_number}
                  onChange={(e) => setRealTimeVerification({ ...realTimeVerification, policy_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="MISR12345678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم العضوية', 'Member ID')} *
                </label>
                <input
                  type="text"
                  value={realTimeVerification.member_id}
                  onChange={(e) => setRealTimeVerification({ ...realTimeVerification, member_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="123456789"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم المجموعة (اختياري)', 'Group Number (Optional)')}
                </label>
                <input
                  type="text"
                  value={realTimeVerification.group_number}
                  onChange={(e) => setRealTimeVerification({ ...realTimeVerification, group_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder={t('رقم المجموعة', 'Group number')}
                />
              </div>
            </div>

            {/* Order Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('إجمالي قيمة الطلب', 'Total Order Amount')} (ج.م / EGP)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={realTimeVerification.order_amount}
                onChange={(e) => setRealTimeVerification({ ...realTimeVerification, order_amount: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  {t('الأدوية (اختياري)', 'Medications (Optional)')}
                </label>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t('إضافة دواء', 'Add Medication')}
                </button>
              </div>

              {realTimeVerification.medications.length > 0 && (
                <div className="space-y-3">
                  {realTimeVerification.medications.map((med, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleUpdateMedication(index, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                        placeholder={t('اسم الدواء', 'Medication name')}
                      />
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleUpdateMedication(index, 'dosage', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                        placeholder={t('الجرعة', 'Dosage')}
                      />
                      <input
                        type="number"
                        min="1"
                        value={med.quantity}
                        onChange={(e) => handleUpdateMedication(index, 'quantity', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                        placeholder={t('الكمية', 'Qty')}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={med.price}
                        onChange={(e) => handleUpdateMedication(index, 'price', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                        placeholder={t('السعر', 'Price')}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-500 hover:text-red-700 flex items-center justify-center"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={verifying}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {t('جاري التحقق...', 'Verifying...')}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {t('تحقق فوري', 'Verify Instantly')}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowRealTimeVerification(false)}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                {t('إلغاء', 'Cancel')}
              </button>
            </div>
          </form>

          {/* Verification Results */}
          {verificationResult && (
            <div className="mt-6 p-6 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h4 className="text-lg font-bold text-gray-900">
                  {t('نتائج التحقق', 'Verification Results')}
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coverage Details */}
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-900">{t('تفاصيل التغطية', 'Coverage Details')}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('حالة الأهلية:', 'Eligibility Status:')}</span>
                      <span className={`font-medium ${
                        verificationResult.coverage_details?.eligibility_status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {verificationResult.coverage_details?.eligibility_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('نوع التغطية:', 'Coverage Type:')}</span>
                      <span className="font-medium">{verificationResult.coverage_details?.coverage_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('نسبة التحمل:', 'Copay Percentage:')}</span>
                      <span className="font-medium">{verificationResult.coverage_details?.copay_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('الحد الأقصى:', 'Maximum Coverage:')}</span>
                      <span className="font-medium">
                        {verificationResult.coverage_details?.max_coverage_amount?.toLocaleString()} {t('ج.م', 'EGP')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Copay Calculation */}
                {copayCalculation && (
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      {t('حساب التحمل', 'Copay Calculation')}
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('إجمالي الطلب:', 'Order Total:')}</span>
                        <span className="font-medium">{copayCalculation.total_order_amount?.toFixed(2)} {t('ج.م', 'EGP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('تغطية التأمين:', 'Insurance Coverage:')}</span>
                        <span className="font-medium text-green-600">
                          {copayCalculation.insurance_coverage?.toFixed(2)} {t('ج.م', 'EGP')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('المبلغ المطلوب منك:', 'You Pay:')}</span>
                        <span className="font-bold text-red-600">
                          {copayCalculation.patient_responsibility?.toFixed(2)} {t('ج.م', 'EGP')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Prior Authorization Warning */}
              {verificationResult.prior_auth_required && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-yellow-800">
                        {t('موافقة مسبقة مطلوبة', 'Prior Authorization Required')}
                      </h6>
                      <p className="text-sm text-yellow-700 mt-1">
                        {t('يتطلب هذا الدواء موافقة مسبقة من شركة التأمين', 'This medication requires prior authorization from your insurance provider')}
                      </p>
                      {verificationResult.prior_auth_details && (
                        <div className="mt-2 text-xs text-yellow-600">
                          <p>{t('الوقت المتوقع:', 'Expected time:')} {verificationResult.prior_auth_details.approval_timeframe}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reference Number */}
              {verificationResult.verification_details?.reference_number && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">{t('رقم المرجع:', 'Reference Number:')}</span> {verificationResult.verification_details.reference_number}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Insurance Cards */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {t('بطاقات التأمين الخاصة بك', 'Your Insurance Cards')}
        </h3>

        {userInsurances.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {t('لا توجد بطاقات تأمين', 'No insurance cards yet')}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-brand-600 hover:underline"
            >
              {t('إضافة بطاقة تأمين', 'Add insurance card')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userInsurances.map(insurance => (
              <div
                key={insurance.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {language === 'ar' && insurance.insurance_providers?.name_ar 
                        ? insurance.insurance_providers.name_ar 
                        : insurance.insurance_providers?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t('بوليصة رقم:', 'Policy #')} {insurance.policy_number}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getVerificationStatusColor(insurance.verification_status)}`}>
                    {getVerificationStatusIcon(insurance.verification_status)}
                    <span className="mr-1">
                      {t(
                        insurance.verification_status === 'verified' ? 'موثق' :
                        insurance.verification_status === 'pending' ? 'قيد المراجعة' : 'مرفوض',
                        insurance.verification_status === 'verified' ? 'Verified' :
                        insurance.verification_status === 'pending' ? 'Pending' : 'Rejected'
                      )}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">{t('رقم العضو:', 'Member ID:')}</span>
                    <p className="font-medium">{insurance.member_id}</p>
                  </div>
                  {insurance.group_number && (
                    <div>
                      <span className="text-gray-500">{t('رقم المجموعة:', 'Group:')}</span>
                      <p className="font-medium">{insurance.group_number}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">{t('نوع التغطية:', 'Coverage:')}</span>
                    <p className="font-medium capitalize">{insurance.coverage_type.replace('_', ' ')}</p>
                  </div>
                  {insurance.copay_percentage && (
                    <div>
                      <span className="text-gray-500">{t('التحمل:', 'Copay:')}</span>
                      <p className="font-medium">{insurance.copay_percentage}%</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">{t('صالح حتى:', 'Valid Until:')}</span>
                    <p className="font-medium">
                      {new Date(insurance.coverage_end_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  {insurance.max_coverage_amount && (
                    <div>
                      <span className="text-gray-500">{t('الحد الأقصى:', 'Max:')}</span>
                      <p className="font-medium">{insurance.max_coverage_amount.toLocaleString()} {t('ج.م', 'EGP')}</p>
                    </div>
                  )}
                </div>

                {/* Card Image Upload */}
                <div className="mb-4">
                  {insurance.card_image_url ? (
                    <div className="relative">
                      <img
                        src={insurance.card_image_url}
                        alt="Insurance Card"
                        className="w-full h-32 object-cover rounded border"
                      />
                      <a
                        href={insurance.card_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {t('رفع صورة البطاقة', 'Upload card image')}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCard(insurance.id, file);
                        }}
                        className="hidden"
                        id={`card-upload-${insurance.id}`}
                      />
                      <label
                        htmlFor={`card-upload-${insurance.id}`}
                        className="text-brand-600 text-sm cursor-pointer hover:underline"
                      >
                        {t('اختر ملف', 'Choose file')}
                      </label>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {insurance.verification_status === 'unverified' && (
                    <button
                      onClick={() => handleRequestVerification(insurance.id)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('طلب التحقق', 'Request Verification')}
                    </button>
                  )}
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition">
                    {t('تعديل', 'Edit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Claims */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {t('المطالبات الأخيرة', 'Recent Claims')}
        </h3>

        {claims.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t('لا توجد مطالبات', 'No claims yet')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('رقم المطالبة', 'Claim Number')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('المبلغ', 'Amount')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('المبلغ الموافق', 'Approved')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('الحالة', 'Status')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('تاريخ التقديم', 'Submitted')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {claims.map(claim => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {claim.claim_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {claim.claim_amount.toFixed(2)} {t('ج.م', 'EGP')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {claim.approved_amount ? `${claim.approved_amount.toFixed(2)} ${t('ج.م', 'EGP')}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.claim_status)}`}>
                        {claim.claim_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(claim.submitted_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

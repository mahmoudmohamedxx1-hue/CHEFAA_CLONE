import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, FileText, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ComplianceCenterProps {
  language: 'ar' | 'en';
}

interface Consent {
  id: string;
  consent_type: string;
  consent_version: string;
  consented: boolean;
  consented_at: string | null;
}

export default function ComplianceCenter({ language }: ComplianceCenterProps) {
  const { user } = useAuth();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (user) {
      fetchConsents();
    }
  }, [user]);

  const fetchConsents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setConsents(data);
      }
    } catch (error) {
      console.error('Error fetching consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsent = async (consentType: string, consented: boolean) => {
    if (!user) return;

    try {
      // Check if consent exists
      const existing = consents.find(c => c.consent_type === consentType);

      if (existing) {
        const { error } = await supabase
          .from('user_consents')
          .update({
            consented,
            consented_at: consented ? new Date().toISOString() : null,
            withdrawn_at: !consented ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);

        if (!error) {
          fetchConsents();
        }
      } else {
        const { error } = await supabase
          .from('user_consents')
          .insert({
            user_id: user.id,
            consent_type: consentType,
            consent_version: '1.0',
            consented,
            consented_at: consented ? new Date().toISOString() : null,
          });

        if (!error) {
          fetchConsents();
        }
      }
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setExportLoading(true);
    try {
      // Create data access request
      const { error } = await supabase
        .from('data_access_requests')
        .insert({
          user_id: user.id,
          request_type: 'access',
          status: 'pending',
        });

      if (!error) {
        alert(
          t(
            'تم تقديم طلب تصدير البيانات. سنرسل لك رابط التنزيل عبر البريد الإلكتروني خلال 48 ساعة.',
            'Data export request submitted. We will send you a download link via email within 48 hours.'
          )
        );
      }
    } catch (error) {
      console.error('Error requesting data export:', error);
      alert(t('حدث خطأ في تقديم الطلب', 'Error submitting request'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      t(
        'هل أنت متأكد من حذف حسابك؟ سيتم حذف جميع بياناتك بشكل دائم. هذا الإجراء لا يمكن التراجع عنه.',
        'Are you sure you want to delete your account? All your data will be permanently deleted. This action cannot be undone.'
      )
    );

    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      // Create data erasure request
      const { error } = await supabase
        .from('data_access_requests')
        .insert({
          user_id: user.id,
          request_type: 'erasure',
          status: 'pending',
        });

      if (!error) {
        alert(
          t(
            'تم تقديم طلب حذف الحساب. سيتم مراجعة طلبك ومعالجته خلال 30 يومًا.',
            'Account deletion request submitted. Your request will be reviewed and processed within 30 days.'
          )
        );
      }
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      alert(t('حدث خطأ في تقديم الطلب', 'Error submitting request'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const getConsentStatus = (type: string) => {
    const consent = consents.find(c => c.consent_type === type);
    return consent?.consented || false;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {t('مطلوب تسجيل الدخول', 'Login Required')}
            </h2>
            <p className="text-gray-600">
              {t('يجب تسجيل الدخول للوصول إلى مركز الامتثال', 'Please log in to access the Compliance Center')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-blue-500" />
            {t('مركز الخصوصية والامتثال', 'Privacy & Compliance Center')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t(
              'إدارة بياناتك الشخصية والموافقات وفقًا لمعايير GDPR وHIPAA',
              'Manage your personal data and consents in compliance with GDPR and HIPAA standards'
            )}
          </p>
        </div>

        {/* Data Rights */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-blue-500" />
            {t('حقوق البيانات الخاصة بك', 'Your Data Rights')}
          </h2>

          <div className="space-y-4">
            {/* Export Data */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {t('تصدير بياناتك', 'Export Your Data')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t(
                    'احصل على نسخة من جميع بياناتك الشخصية بتنسيق قابل للقراءة',
                    'Get a copy of all your personal data in a readable format'
                  )}
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue-500 text-white rounded-lg hover:bg-brand-blue-600 disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                {exportLoading ? t('جاري المعالجة...', 'Processing...') : t('تصدير', 'Export')}
              </button>
            </div>

            {/* Delete Account */}
            <div className="flex items-start justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex-1">
                <h3 className="font-semibold mb-1 text-red-900">
                  {t('حذف حسابك', 'Delete Your Account')}
                </h3>
                <p className="text-sm text-red-700">
                  {t(
                    'حذف دائم لحسابك وجميع بياناتك. لا يمكن التراجع عن هذا الإجراء.',
                    'Permanently delete your account and all associated data. This action cannot be undone.'
                  )}
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {deleteLoading ? t('جاري المعالجة...', 'Processing...') : t('حذف', 'Delete')}
              </button>
            </div>
          </div>
        </div>

        {/* Consent Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-brand-blue-500" />
            {t('إدارة الموافقات', 'Consent Management')}
          </h2>

          <div className="space-y-4">
            {/* GDPR Data Processing */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {t('معالجة البيانات الشخصية (GDPR)', 'Personal Data Processing (GDPR)')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t(
                    'الموافقة على معالجة بياناتك الشخصية لتقديم الخدمات',
                    'Consent to process your personal data to provide services'
                  )}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={getConsentStatus('gdpr_data_processing')}
                  onChange={(e) => handleUpdateConsent('gdpr_data_processing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-500"></div>
              </label>
            </div>

            {/* Marketing Communications */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {t('الاتصالات التسويقية', 'Marketing Communications')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t(
                    'تلقي رسائل إخبارية وعروض ترويجية عبر البريد الإلكتروني',
                    'Receive newsletters and promotional offers via email'
                  )}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={getConsentStatus('marketing')}
                  onChange={(e) => handleUpdateConsent('marketing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-500"></div>
              </label>
            </div>

            {/* Cookie Consent */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {t('ملفات تعريف الارتباط (Cookies)', 'Cookies')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t(
                    'السماح باستخدام ملفات تعريف الارتباط لتحسين تجربتك',
                    'Allow use of cookies to improve your experience'
                  )}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={getConsentStatus('cookies')}
                  onChange={(e) => handleUpdateConsent('cookies', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-500"></div>
              </label>
            </div>

            {/* HIPAA Authorization */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {t('تفويض HIPAA', 'HIPAA Authorization')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t(
                    'الموافقة على مشاركة معلوماتك الصحية مع الصيادلة',
                    'Consent to share your health information with pharmacists'
                  )}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={getConsentStatus('hipaa_authorization')}
                  onChange={(e) => handleUpdateConsent('hipaa_authorization', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security & Privacy Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-blue-500" />
            {t('معلومات الأمان والخصوصية', 'Security & Privacy Information')}
          </h2>

          <div className="space-y-4 text-sm text-gray-600">
            <p>
              {t(
                'نحن ملتزمون بحماية بياناتك الشخصية وفقًا للوائح GDPR وHIPAA. جميع البيانات مشفرة أثناء النقل والتخزين.',
                'We are committed to protecting your personal data in accordance with GDPR and HIPAA regulations. All data is encrypted in transit and at rest.'
              )}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                {t(
                  'تشفير SSL 256-بت لجميع الاتصالات',
                  '256-bit SSL encryption for all communications'
                )}
              </li>
              <li>
                {t(
                  'تخزين آمن للبيانات الصحية وفقًا لمعايير HIPAA',
                  'Secure storage of health data according to HIPAA standards'
                )}
              </li>
              <li>
                {t(
                  'حق الوصول والتصحيح والحذف وفقًا لـ GDPR',
                  'Right to access, rectification, and erasure per GDPR'
                )}
              </li>
              <li>
                {t(
                  'سجلات تدقيق شاملة لجميع الوصول إلى البيانات',
                  'Comprehensive audit logs for all data access'
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

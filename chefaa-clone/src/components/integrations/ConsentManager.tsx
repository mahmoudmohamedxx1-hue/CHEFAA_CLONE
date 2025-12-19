import React, { useState, useEffect } from 'react';
import { Shield, Check, X, AlertTriangle, History } from 'lucide-react';
import { IntegrationsAPI } from '../../api/IntegrationsAPI';
import { useToast } from '../../hooks/use-toast';

interface ConsentManagerProps {
  language: 'en' | 'ar';
  userId: string;
}

interface ConsentRecord {
  id: string;
  user_id: string;
  service_id: string;
  service_name?: string;
  consent_type: string;
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  expiration_date?: string;
}

const ConsentManager: React.FC<ConsentManagerProps> = ({ language, userId }) => {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const translations = {
    en: {
      title: 'Patient Consent Management',
      description: 'Manage your healthcare data sharing permissions and consent for each integration.',
      consentType: 'Permission Type',
      service: 'Service',
      status: 'Status',
      grantedDate: 'Granted',
      expirationDate: 'Expires',
      actions: 'Actions',
      granted: 'Granted',
      revoked: 'Revoked',
      expired: 'Expired',
      revoke: 'Revoke',
      grant: 'Grant',
      noConsents: 'No consent records found',
      loading: 'Loading consent records...',
      errorLoading: 'Failed to load consent records',
      revokeSuccess: 'Consent revoked successfully',
      grantSuccess: 'Consent granted successfully',
      confirmRevoke: 'Are you sure you want to revoke this consent? The service will no longer have access to this data.',
      history: 'View History',
      never: 'Never',
    },
    ar: {
      title: 'إدارة موافقة المريض',
      description: 'إدارة أذونات مشاركة بيانات الرعاية الصحية والموافقة لكل تكامل.',
      consentType: 'نوع الإذن',
      service: 'الخدمة',
      status: 'الحالة',
      grantedDate: 'تم المنح',
      expirationDate: 'تنتهي',
      actions: 'الإجراءات',
      granted: 'ممنوح',
      revoked: 'ملغى',
      expired: 'منتهي الصلاحية',
      revoke: 'إلغاء',
      grant: 'منح',
      noConsents: 'لم يتم العثور على سجلات موافقة',
      loading: 'تحميل سجلات الموافقة...',
      errorLoading: 'فشل تحميل سجلات الموافقة',
      revokeSuccess: 'تم إلغاء الموافقة بنجاح',
      grantSuccess: 'تم منح الموافقة بنجاح',
      confirmRevoke: 'هل أنت متأكد أنك تريد إلغاء هذه الموافقة؟ لن يتمكن الخدمة بعد الآن من الوصول إلى هذه البيانات.',
      history: 'عرض السجل',
      never: 'أبداً',
    },
  };

  const t = translations[language];

  const consentTypeLabels: Record<string, { en: string; ar: string }> = {
    read_basic: { en: 'Read Basic Information', ar: 'قراءة المعلومات الأساسية' },
    read_health: { en: 'Read Health Data', ar: 'قراءة البيانات الصحية' },
    read_medications: { en: 'Read Medications', ar: 'قراءة الأدوية' },
    write_prescriptions: { en: 'Write Prescriptions', ar: 'كتابة الوصفات الطبية' },
    read_lab_results: { en: 'Read Lab Results', ar: 'قراءة نتائج المختبر' },
    read_insurance: { en: 'Read Insurance Info', ar: 'قراءة معلومات التأمين' },
    access_ehr: { en: 'Access Electronic Health Records', ar: 'الوصول إلى السجلات الصحية الإلكترونية' },
    share_fhir_data: { en: 'Share FHIR Data', ar: 'مشاركة بيانات FHIR' },
  };

  useEffect(() => {
    loadConsents();
  }, [userId]);

  const loadConsents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await IntegrationsAPI.getConsentRecords();
      setConsents(response.consents || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Error loading consents: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    if (!confirm(t.confirmRevoke)) return;

    try {
      const consent = consents.find(c => c.id === consentId);
      if (consent?.service_id) {
        await IntegrationsAPI.disconnectService(consent.service_id);
        await loadConsents();
        toast.success(t.revokeSuccess);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleGrantConsent = async (consentId: string) => {
    try {
      const consent = consents.find(c => c.id === consentId);
      if (consent?.service_id) {
        await IntegrationsAPI.connectService(consent.service_id, { consent_given: true });
        await loadConsents();
        toast.success(t.grantSuccess);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (consent: ConsentRecord) => {
    if (!consent.granted || consent.revoked_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="w-3 h-3 mr-1" />
          {t.revoked}
        </span>
      );
    }

    if (consent.expiration_date && new Date(consent.expiration_date) < new Date()) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t.expired}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Check className="w-3 h-3 mr-1" />
        {t.granted}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          {t.errorLoading}: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
        </div>
        <p className="text-sm text-gray-600">{t.description}</p>
      </div>

      {/* Consent Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.service}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.consentType}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.status}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.grantedDate}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.expirationDate}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {t.noConsents}
                </td>
              </tr>
            ) : (
              consents.map((consent) => (
                <tr key={consent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{consent.service_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {consentTypeLabels[consent.consent_type]?.[language] || consent.consent_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(consent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consent.granted_at 
                      ? new Date(consent.granted_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
                      : t.never}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consent.expiration_date 
                      ? new Date(consent.expiration_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
                      : t.never}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {consent.granted && !consent.revoked_at ? (
                        <button
                          onClick={() => handleRevokeConsent(consent.id)}
                          className="text-red-600 hover:text-red-900 px-3 py-1 border border-red-300 rounded-md hover:bg-red-50"
                        >
                          {t.revoke}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrantConsent(consent.id)}
                          className="text-green-600 hover:text-green-900 px-3 py-1 border border-green-300 rounded-md hover:bg-green-50"
                        >
                          {t.grant}
                        </button>
                      )}
                      <button
                        className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-md"
                        title={t.history}
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsentManager;

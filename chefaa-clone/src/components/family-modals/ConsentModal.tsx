import { X, Shield, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formData: any;
  setFormData: (data: any) => void;
  selectedMember: any;
  language: 'ar' | 'en';
  t: (ar: string, en: string) => string;
}

export default function ConsentModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedMember,
  language,
  t
}: ConsentModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = selectedMember ? calculateAge(selectedMember.date_of_birth) : 0;

  const consentTypes = [
    {
      key: 'data_collection',
      label: { ar: 'جمع ومعالجة البيانات', en: 'Data Collection & Processing' },
      description: { ar: 'السماح بجمع ومعالجة المعلومات الطبية والصحة', en: 'Allow collection and processing of medical and health information' },
      required: true
    },
    {
      key: 'medication_management',
      label: { ar: 'إدارة الأدوية', en: 'Medication Management' },
      description: { ar: 'السماح بإدارة وتتبع جداول الأدوية', en: 'Allow medication schedule management and tracking' },
      required: age < 16
    },
    {
      key: 'emergency_access',
      label: { ar: 'الوصول في حالات الطوارئ', en: 'Emergency Access' },
      description: { ar: 'السماح بالوصول للمعلومات الطبية في حالات الطوارئ', en: 'Allow access to medical information in emergency situations' },
      required: true
    },
    {
      key: 'order_management',
      label: { ar: 'إدارة الطلبات', en: 'Order Management' },
      description: { ar: 'السماح بطلب وإدارة الأدوية والعلاجات', en: 'Allow ordering and managing medications and treatments' },
      required: false
    },
    {
      key: 'data_sharing',
      label: { ar: 'مشاركة البيانات', en: 'Data Sharing' },
      description: { ar: 'السماح بمشاركة البيانات مع أفراد العائلة', en: 'Allow data sharing with family members' },
      required: false
    }
  ];

  if (!isOpen || !selectedMember) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              {t('إعطاء موافقة ولي الأمر', 'Grant Parental Consent')}
            </h3>
            <p className="text-gray-600 mt-1">
              {t('للعضو:', 'For member:')} {selectedMember.first_name} {selectedMember.last_name}
              <span className="mx-2">•</span>
              {t('العمر:', 'Age:')} {age} {t('سنة', 'years')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* COPPA Compliance Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">
                {t('امتثال قانون حماية خصوصية الأطفال على الإنترنت (COPPA)', 'COPPA Compliance')}
              </h4>
            </div>
            <p className="text-blue-700 text-sm">
              {t('بموجب قانون COPPA، نحتاج موافقتك لإدارة بيانات وخدمات هذا الفرد الذي يقل عمره عن 13 سنة.',
                 'Under COPPA law, we need your consent to manage data and services for this individual under 13 years old.')}
            </p>
          </div>

          {/* Consent Types */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('أنواع الموافقة', 'Consent Types')}</h4>
            <div className="space-y-4">
              {consentTypes.map((consentType) => (
                <div key={consentType.key} className={`p-4 border rounded-lg ${
                  consentType.required ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.consent_details[consentType.key] || consentType.required}
                      onChange={(e) => setFormData({
                        ...formData,
                        consent_details: {
                          ...formData.consent_details,
                          [consentType.key]: e.target.checked
                        }
                      })}
                      disabled={consentType.required}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900">
                          {consentType.label[language]}
                        </h5>
                        {consentType.required && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            {t('مطلوب', 'Required')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {consentType.description[language]}
                      </p>
                    </div>
                    {consentType.required && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consent Duration */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('مدة الموافقة', 'Consent Duration')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('تاريخ انتهاء الموافقة', 'Consent Expiry Date')}
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('اتركه فارغاً للموافقة الدائمة', 'Leave empty for permanent consent')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('نوع الموافقة', 'Consent Type')} *
                </label>
                <select
                  value={formData.consent_type}
                  onChange={(e) => setFormData({ ...formData, consent_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="data_collection">{t('جمع البيانات', 'Data Collection')}</option>
                  <option value="medication_management">{t('إدارة الأدوية', 'Medication Management')}</option>
                  <option value="emergency_access">{t('الوصول الطارئ', 'Emergency Access')}</option>
                  <option value="order_management">{t('إدارة الطلبات', 'Order Management')}</option>
                  <option value="data_sharing">{t('مشاركة البيانات', 'Data Sharing')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Rights Information */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('حقوق الخصوصية', 'Privacy Rights')}
            </h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• {t('يمكنك إلغاء هذه الموافقة في أي وقت', 'You may withdraw this consent at any time')}</p>
              <p>• {t('بياناتك محمية ومشفرة وفقاً لأعلى المعايير', 'Your data is protected and encrypted to highest standards')}</p>
              <p>• {t('لن نشارك معلوماتك مع أطراف ثالثة دون إذنك', 'We will not share your information with third parties without your permission')}</p>
              <p>• {t('لديك الحق في الوصول وتعديل بياناتك', 'You have the right to access and modify your data')}</p>
            </div>
          </div>

          {/* Digital Signature */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('التوقيع الرقمي', 'Digital Signature')}</h4>
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <div className="w-32 h-16 bg-gray-100 rounded border mx-auto mb-2 flex items-center justify-center">
                  <span className="text-sm text-gray-500">
                    {t('التوقيع هنا', 'Sign here')}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {t('انقر واسحب للتوقيع', 'Click and drag to sign')}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="agree-terms" className="rounded" required />
                <label htmlFor="agree-terms" className="text-sm text-gray-700">
                  {t('أوافق على الشروط والأحكام وسياسة الخصوصية', 'I agree to the Terms of Service and Privacy Policy')}
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="digital-consent" className="rounded" required />
                <label htmlFor="digital-consent" className="text-sm text-gray-700">
                  {t('أؤكد أنني ولي أمر هذا الفرد وأوافق رقمياً على هذه الموافقة',
                     'I confirm I am the parent/guardian of this individual and digitally consent to this agreement')}
                </label>
              </div>
            </div>
          </div>

          {/* Consent Summary */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800">
                {t('ملخص الموافقة', 'Consent Summary')}
              </h4>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>{t('العضو:', 'Member:')}</strong> {selectedMember.first_name} {selectedMember.last_name}</p>
              <p><strong>{t('العمر:', 'Age:')}</strong> {age} {t('سنة', 'years')}</p>
              <p><strong>{t('تاريخ الموافقة:', 'Consent Date:')}</strong> {new Date().toLocaleDateString()}</p>
              {formData.expiry_date && (
                <p><strong>{t('تاريخ الانتهاء:', 'Expiry Date:')}</strong> {new Date(formData.expiry_date).toLocaleDateString()}</p>
              )}
              <p><strong>{t('الموافقات المختارة:', 'Selected Consents:')}</strong></p>
              <ul className="list-disc list-inside ml-4">
                {consentTypes.filter(consentType => 
                  formData.consent_details[consentType.key] || consentType.required
                ).map(consentType => (
                  <li key={consentType.key}>{consentType.label[language]}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('إلغاء', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {t('منح الموافقة', 'Grant Consent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
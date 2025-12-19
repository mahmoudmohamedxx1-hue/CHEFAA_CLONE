import { X, Phone, Mail, User, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface AddEmergencyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formData: any;
  setFormData: (data: any) => void;
  selectedMember: any;
  language: 'ar' | 'en';
  t: (ar: string, en: string) => string;
}

export default function AddEmergencyContactModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedMember,
  language,
  t
}: AddEmergencyContactModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const relationshipOptions = [
    { value: 'parent', label: t('والد/والدة', 'Parent') },
    { value: 'guardian', label: t('ولي أمر', 'Guardian') },
    { value: 'spouse', label: t('زوج/زوجة', 'Spouse') },
    { value: 'child', label: t('طفل', 'Child') },
    { value: 'sibling', label: t('أخ/أخت', 'Sibling') },
    { value: 'other', label: t('أخرى', 'Other') }
  ];

  if (!isOpen || !selectedMember) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              {t('إضافة جهة اتصال طوارئ', 'Add Emergency Contact')}
            </h3>
            <p className="text-gray-600 mt-1">
              {t('للعضو:', 'For member:')} {selectedMember.first_name} {selectedMember.last_name}
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
          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('معلومات جهة الاتصال', 'Contact Information')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('الاسم الكامل', 'Full Name')} *
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم الهاتف', 'Phone Number')} *
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+966 XX XXX XXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('البريد الإلكتروني', 'Email')}
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="emergency@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('العلاقة', 'Relationship')} *
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">{t('اختر العلاقة', 'Select relationship')}</option>
                  {relationshipOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Settings */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('إعدادات جهة الاتصال', 'Contact Settings')}</h4>
            
            <div className="space-y-4">
              {/* Primary Contact */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="primary_contact"
                    checked={formData.primary_contact}
                    onChange={(e) => setFormData({ ...formData, primary_contact: e.target.checked })}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('جهة اتصال أساسية', 'Primary Contact')}</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {t('أولوية عالية', 'High Priority')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('هذه ستكون جهة الاتصال الأولى في حالات الطوارئ', 'This will be the first contact in emergency situations')}
                    </p>
                  </div>
                </label>
              </div>

              {/* Medical Information Access */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.can_access_medical_info}
                    onChange={(e) => setFormData({ ...formData, can_access_medical_info: e.target.checked })}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('الوصول للمعلومات الطبية', 'Medical Information Access')}</span>
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('السماح بالوصول للمعلومات الطبية والصحية', 'Allow access to medical and health information')}
                    </p>
                  </div>
                </label>
              </div>

              {/* Order Management */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.can_manage_orders}
                    onChange={(e) => setFormData({ ...formData, can_manage_orders: e.target.checked })}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t('إدارة الطلبات', 'Order Management')}</span>
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('السماح بطلب وإدارة الأدوية والعلاجات', 'Allow ordering and managing medications and treatments')}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Emergency Contact Best Practices */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {t('أفضل الممارسات', 'Best Practices')}
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• {t('تأكد من أن جهة الاتصال متاحة 24/7', 'Ensure the contact is available 24/7')}</p>
              <p>• {t('اختبر معلومات الاتصال بانتظام', 'Test contact information regularly')}</p>
              <p>• {t('أضف جهة اتصال احتياطية', 'Add a backup contact')}</p>
              <p>• {t('تأكد من معرفة جهة الاتصال بجميع المعلومات الطبية', 'Ensure the contact knows all medical information')}</p>
            </div>
          </div>

          {/* Verification Notice */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">
                {t('التحقق من المعلومات', 'Information Verification')}
              </h4>
            </div>
            <p className="text-yellow-700 text-sm">
              {t('سيتم التحقق من معلومات جهة الاتصال من خلال رسالة نصية أو بريد إلكتروني.',
                 'Contact information will be verified through SMS or email.')}
            </p>
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {t('إضافة جهة الاتصال', 'Add Contact')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
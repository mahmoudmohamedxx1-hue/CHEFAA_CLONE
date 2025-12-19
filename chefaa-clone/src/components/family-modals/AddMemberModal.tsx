import { X, User, Calendar, Phone, Mail, AlertTriangle, Users } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formData: any;
  setFormData: (data: any) => void;
  language: 'ar' | 'en';
  t: (ar: string, en: string) => string;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  language,
  t
}: AddMemberModalProps) {
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

  const age = calculateAge(formData.date_of_birth);
  const requiresConsent = age > 0 && age < 13;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            {t('إضافة فرد من الأسرة', 'Add Family Member')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('المعلومات الأساسية', 'Basic Information')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('الاسم الأول', 'First Name')} *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('الاسم الأخير', 'Last Name')}
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('تاريخ الميلاد', 'Date of Birth')} *
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {age > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {t('العمر:', 'Age:')} {age} {t('سنة', 'years')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('الجنس', 'Gender')}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="male">{t('ذكر', 'Male')}</option>
                  <option value="female">{t('أنثى', 'Female')}</option>
                  <option value="other">{t('أخرى', 'Other')}</option>
                </select>
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
                  <option value="spouse">{t('زوج/زوجة', 'Spouse')}</option>
                  <option value="child">{t('طفل', 'Child')}</option>
                  <option value="parent">{t('والد/والدة', 'Parent')}</option>
                  <option value="sibling">{t('أخ/أخت', 'Sibling')}</option>
                  <option value="other">{t('أخرى', 'Other')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('معلومات الاتصال', 'Contact Information')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('رقم الهاتف', 'Phone Number')}
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+966 XX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('البريد الإلكتروني', 'Email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Settings */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('إعدادات الطوارئ', 'Emergency Settings')}</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="font-medium">{t('جهة اتصال طوارئ', 'Emergency Contact')}</span>
                  <p className="text-sm text-gray-600">
                    {t('يمكن استخدام هذا الشخص في حالات الطوارئ', 'This person can be used in emergency situations')}
                  </p>
                </div>
              </label>

              {/* Show warning for individuals requiring emergency contacts */}
              {age < 18 || age >= 65 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {t('يتطلب جهة اتصال طوارئ', 'Requires Emergency Contact')}
                    </span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    {age < 18 
                      ? t('الأطفال والمراهقون يحتاجون جهة اتصال طوارئ', 'Children and adolescents require emergency contacts')
                      : t('كبار السن يحتاجون جهة اتصال طوارئ', 'Seniors require emergency contacts')
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COPPA Compliance Notice */}
          {requiresConsent && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">
                  {t('موافقة ولي الأمر مطلوبة', 'Parental Consent Required')}
                </h4>
              </div>
              <p className="text-blue-700 text-sm">
                {t('بما أن هذا الطفل أقل من 13 سنة، فستحتاج إلى منح موافقة ولي الأمر لإدارة بياناته وأدويته.', 
                   'Since this child is under 13 years old, you will need to grant parental consent to manage their data and medications.')}
              </p>
            </div>
          )}

          {/* Age Category Display */}
          {age > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">
                  {t('فئة العمر:', 'Age Category:')}
                </span>
                <span className="text-sm text-gray-600">
                  {age < 2 ? t('رضيع', 'Infant') :
                   age < 13 ? t('طفل', 'Child') :
                   age < 18 ? t('مراهق', 'Adolescent') :
                   age < 65 ? t('بالغ', 'Adult') :
                   t('كبير السن', 'Senior')}
                </span>
              </div>
              <p className="text-gray-600 text-xs mt-1">
                {age < 16 
                  ? t('يحتاج إشراف في إدارة الأدوية', 'Requires supervision in medication management')
                  : t('يمكنه إدارة أدويته بنفسه', 'Can manage own medications')
                }
              </p>
            </div>
          )}

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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('إضافة العضو', 'Add Member')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
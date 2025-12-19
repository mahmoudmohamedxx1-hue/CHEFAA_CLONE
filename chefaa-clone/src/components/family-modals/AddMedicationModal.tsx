import { X, Pill, Clock, User, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  formData: any;
  setFormData: (data: any) => void;
  selectedMember: any;
  language: 'ar' | 'en';
  t: (ar: string, en: string) => string;
}

export default function AddMedicationModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedMember,
  language,
  t
}: AddMedicationModalProps) {
  const [currentTime, setCurrentTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const addScheduleTime = () => {
    if (currentTime) {
      const newTimes = [...(formData.schedule_times || []), currentTime];
      setFormData({ ...formData, schedule_times: newTimes });
      setCurrentTime('');
    }
  };

  const removeScheduleTime = (index: number) => {
    const newTimes = (formData.schedule_times || []).filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, schedule_times: newTimes });
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
  const needsParentalApproval = age > 0 && age < 18;

  const commonMedications = [
    { name: 'Panadol (Paracetamol)', name_ar: 'بنادول (باراسيتامول)' },
    { name: 'Ibuprofen', name_ar: 'إيبوبروفين' },
    { name: 'Amoxicillin', name_ar: 'أموكسيسيللين' },
    { name: 'Omeprazole', name_ar: 'أوميبرازول' },
    { name: 'Cetirizine', name_ar: 'سيتيريزين' },
    { name: 'Salbutamol', name_ar: 'سالبيوتامول' }
  ];

  if (!isOpen || !selectedMember) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Pill className="w-6 h-6 text-blue-600" />
              {t('إضافة دواء', 'Add Medication')}
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
          {/* Medication Selection */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('تفاصيل الدواء', 'Medication Details')}</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('اسم الدواء', 'Medication Name')} *
                </label>
                <input
                  type="text"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  list="medications"
                />
                <datalist id="medications">
                  {commonMedications.map((med, index) => (
                    <option key={index} value={language === 'ar' ? med.name_ar : med.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('الجرعة', 'Dosage')} *
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="500mg, 1 tablet, 5ml"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('التردد', 'Frequency')} *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">{t('اختر التردد', 'Select frequency')}</option>
                  <option value="Once daily">{t('مرة واحدة يومياً', 'Once daily')}</option>
                  <option value="Twice daily">{t('مرتان يومياً', 'Twice daily')}</option>
                  <option value="Three times daily">{t('ثلاث مرات يومياً', 'Three times daily')}</option>
                  <option value="Four times daily">{t('أربع مرات يومياً', 'Four times daily')}</option>
                  <option value="Every 4 hours">{t('كل 4 ساعات', 'Every 4 hours')}</option>
                  <option value="Every 6 hours">{t('كل 6 ساعات', 'Every 6 hours')}</option>
                  <option value="Every 8 hours">{t('كل 8 ساعات', 'Every 8 hours')}</option>
                  <option value="Every 12 hours">{t('كل 12 ساعة', 'Every 12 hours')}</option>
                  <option value="As needed">{t('عند الحاجة', 'As needed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('وصف من قبل', 'Prescribed By')}
                </label>
                <input
                  type="text"
                  value={formData.prescribed_by}
                  onChange={(e) => setFormData({ ...formData, prescribed_by: e.target.value })}
                  placeholder="Dr. Ahmed Al-Rashid"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('تاريخ بداية العلاج', 'Treatment Start Date')} *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('تاريخ نهاية العلاج', 'Treatment End Date')}
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Schedule Times */}
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('أوقات الجرعات', 'Dosage Times')}
            </h4>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="time"
                  value={currentTime}
                  onChange={(e) => setCurrentTime(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addScheduleTime}
                  disabled={!currentTime}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('إضافة', 'Add')}
                </button>
              </div>

              {(formData.schedule_times || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {t('الأوقات المجدولة:', 'Scheduled Times:')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(formData.schedule_times || []).map((time: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        <span>{time}</span>
                        <button
                          type="button"
                          onClick={() => removeScheduleTime(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions and Notes */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('تعليمات وملاحظات', 'Instructions & Notes')}</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('تعليمات الجرعة', 'Dosage Instructions')}
                </label>
                <textarea
                  value={formData.dosage_instructions}
                  onChange={(e) => setFormData({ ...formData, dosage_instructions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  placeholder={t('مع الطعام، مع كوب ماء كامل، إلخ...', 'With food, with full glass of water, etc...')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('الآثار الجانبية المحتملة', 'Potential Side Effects')}
                </label>
                <textarea
                  value={formData.side_effects}
                  onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder={t('صداع خفيف، غثيان، إلخ...', 'Mild headache, nausea, etc...')}
                />
              </div>
            </div>
          </div>

          {/* Automation Settings */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('إعدادات الأتمتة', 'Automation Settings')}</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.reminder_enabled}
                  onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="font-medium">{t('تفعيل التذكيرات', 'Enable Reminders')}</span>
                  <p className="text-sm text-gray-600">
                    {t('إرسال تذكيرات قبل موعد الدواء', 'Send reminders before medication time')}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.automation_enabled}
                  onChange={(e) => setFormData({ ...formData, automation_enabled: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="font-medium">{t('الأتمتة الذكية', 'Smart Automation')}</span>
                  <p className="text-sm text-gray-600">
                    {t('تتبع الالتزام تلقائياً وتحديد الأنماط', 'Automatic adherence tracking and pattern detection')}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.auto_refill_enabled}
                  onChange={(e) => setFormData({ ...formData, auto_refill_enabled: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="font-medium">{t('إعادة التعبئة التلقائية', 'Auto Refill')}</span>
                  <p className="text-sm text-gray-600">
                    {t('إشعار عند اقتراب نفاد الدواء', 'Alert when medication is running low')}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Age-Based Warnings */}
          {needsParentalApproval && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">
                  {t('موافقة ولي الأمر مطلوبة', 'Parental Consent Required')}
                </h4>
              </div>
              <p className="text-yellow-700 text-sm">
                {t('بما أن هذا الفرد تحت 18 سنة، فستحتاج إلى موافقة ولي الأمر لإدارة هذا الدواء.',
                   'Since this individual is under 18, you will need parental consent to manage this medication.')}
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
              {t('إضافة الدواء', 'Add Medication')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
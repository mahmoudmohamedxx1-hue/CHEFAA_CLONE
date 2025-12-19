import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload } from 'lucide-react';

type PrescriptionPageProps = {
  language: 'ar' | 'en';
};

export default function PrescriptionPage({ language }: PrescriptionPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [address, setAddress] = useState({
    city: '',
    district: '',
    street: '',
    building: '',
  });
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [handlingPreference, setHandlingPreference] = useState<'substitute' | 'ship_without' | 'cancel'>('substitute');

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  if (!user) {
    return (
      <div className="min-h-screen bg-background-secondary py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {t('يرجى تسجيل الدخول لرفع الروشتة', 'Please login to upload prescription')}
          </h1>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600"
          >
            {t('تسجيل الدخول', 'Login')}
          </button>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t('يرجى اختيار صورة الروشتة', 'Please select prescription image'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const fileName = `${Date.now()}-${file.name}`;

          // Upload via edge function
          const { data, error: uploadError } = await supabase.functions.invoke('prescription-upload', {
            body: {
              imageData: base64Data,
              fileName,
            },
          });

          if (uploadError) throw uploadError;

          // Create prescription record
          const { error: dbError } = await supabase
            .from('prescriptions')
            .insert([{
              user_id: user.id,
              prescription_image_url: data.data.publicUrl,
              status: 'pending',
              delivery_address: address,
              phone,
              handling_preference: handlingPreference,
              pharmacy_notes: notes,
            }]);

          if (dbError) throw dbError;

          setSuccess(true);
          setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
          setError(err.message || t('حدث خطأ في رفع الروشتة', 'Error uploading prescription'));
          setLoading(false);
        }
      };
    } catch (err: any) {
      setError(err.message || t('حدث خطأ في رفع الروشتة', 'Error uploading prescription'));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background-secondary py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white rounded-lg p-12 max-w-md mx-auto">
            <div className="w-16 h-16 bg-brand-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('تم رفع الروشتة بنجاح!', 'Prescription Uploaded Successfully!')}</h2>
            <p className="text-text-secondary">
              {t('سيتم التواصل معك قريباً من الصيدلية', 'The pharmacy will contact you soon')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('رفع روشتة طبية', 'Upload Prescription')}</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">{t('صورة الروشتة', 'Prescription Image')}</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {preview ? (
                <div className="space-y-4">
                  <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview('');
                    }}
                    className="text-sm text-brand-blue-500 hover:text-brand-blue-600"
                  >
                    {t('تغيير الصورة', 'Change Image')}
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold mb-2">{t('اختر صورة الروشتة', 'Select Prescription Image')}</p>
                  <p className="text-sm text-text-secondary mb-4">
                    {t('PNG, JPG, PDF حتى 10 ميجابايت', 'PNG, JPG, PDF up to 10MB')}
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="inline-block px-6 py-2 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600">
                    {t('اختيار ملف', 'Choose File')}
                  </span>
                </label>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">{t('معلومات التوصيل', 'Delivery Information')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('المدينة', 'City')}</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('الحي', 'District')}</label>
                  <input
                    type="text"
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('الشارع', 'Street')}</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('رقم المبنى', 'Building')}</label>
                  <input
                    type="text"
                    value={address.building}
                    onChange={(e) => setAddress({ ...address, building: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('رقم الهاتف', 'Phone Number')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-3">{t('في حالة عدم توفر أحد الأدوية', 'If a medicine is unavailable')}</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="substitute"
                    checked={handlingPreference === 'substitute'}
                    onChange={() => setHandlingPreference('substitute')}
                    className="w-4 h-4 text-brand-blue-500"
                  />
                  <span>{t('استبداله ببديل', 'Substitute with alternative')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="ship_without"
                    checked={handlingPreference === 'ship_without'}
                    onChange={() => setHandlingPreference('ship_without')}
                    className="w-4 h-4 text-brand-blue-500"
                  />
                  <span>{t('الشحن بدونه', 'Ship without it')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="cancel"
                    checked={handlingPreference === 'cancel'}
                    onChange={() => setHandlingPreference('cancel')}
                    className="w-4 h-4 text-brand-blue-500"
                  />
                  <span>{t('إلغاء الطلب', 'Cancel order')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t('ملاحظات إضافية', 'Additional Notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                placeholder={t('أي ملاحظات للصيدلي...', 'Any notes for the pharmacist...')}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3 px-6 bg-brand-blue-500 text-white rounded-lg font-bold hover:bg-brand-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('جاري الرفع...', 'Uploading...') : t('إرسال الروشتة', 'Submit Prescription')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

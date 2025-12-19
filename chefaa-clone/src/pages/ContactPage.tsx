import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

type ContactPageProps = {
  language: 'ar' | 'en';
};

export default function ContactPage({ language }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t('تم إرسال رسالتك بنجاح!', 'Your message has been sent successfully!'));
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">{t('اتصل بنا', 'Contact Us')}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">{t('أرسل لنا رسالة', 'Send us a Message')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('الاسم', 'Name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('البريد الإلكتروني', 'Email')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('رقم الهاتف', 'Phone Number')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    {t('الرسالة', 'Message')}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-brand-blue-500 text-white rounded-lg font-bold hover:bg-brand-blue-600 transition-colors"
                >
                  {t('إرسال', 'Send')}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">{t('معلومات الاتصال', 'Contact Information')}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-6 h-6 text-brand-blue-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">{t('البريد الإلكتروني', 'Email')}</p>
                      <a href="mailto:support@chefaa.com" className="text-brand-blue-500 hover:underline">
                        support@chefaa.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-6 h-6 text-brand-blue-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">{t('الهاتف', 'Phone')}</p>
                      <p className="text-text-secondary">16677</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-brand-blue-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">{t('العنوان', 'Address')}</p>
                      <p className="text-text-secondary">
                        {t('القاهرة، مصر', 'Cairo, Egypt')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">{t('ساعات العمل', 'Business Hours')}</h3>
                <p className="text-text-secondary">
                  {t('خدمة العملاء متاحة 24/7', 'Customer service available 24/7')}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">{t('الرقم الضريبي', 'Tax Number')}</h3>
                <p className="text-text-secondary">718-859-672</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

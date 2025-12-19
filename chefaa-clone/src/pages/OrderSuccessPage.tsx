import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

type OrderSuccessPageProps = {
  language: 'ar' | 'en';
};

export default function OrderSuccessPage({ language }: OrderSuccessPageProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="min-h-screen bg-background-secondary py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg p-12 text-center">
          <div className="w-20 h-20 bg-brand-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            {t('تم تأكيد طلبك بنجاح!', 'Order Confirmed Successfully!')}
          </h1>
          
          <p className="text-lg text-text-secondary mb-8">
            {t(
              'شكراً لك! سيتم توصيل طلبك خلال 30-60 دقيقة من أقرب صيدلية.',
              'Thank you! Your order will be delivered within 30-60 minutes from the nearest pharmacy.'
            )}
          </p>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-8">
            <p className="font-semibold text-brand-blue-700 mb-2">
              {t('سيتم التواصل معك قريباً', 'We will contact you soon')}
            </p>
            <p className="text-sm text-text-secondary">
              {t(
                'سيقوم فريقنا بالتواصل معك لتأكيد التفاصيل',
                'Our team will contact you to confirm the details'
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
            >
              {t('العودة للرئيسية', 'Back to Home')}
            </Link>
            <Link
              to="/category/medications"
              className="px-6 py-3 border-2 border-brand-blue-500 text-brand-blue-500 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
            >
              {t('تصفح المنتجات', 'Browse Products')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

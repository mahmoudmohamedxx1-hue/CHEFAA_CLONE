type AboutPageProps = {
  language: 'ar' | 'en';
};

export default function AboutPage({ language }: AboutPageProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg p-8 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">{t('من نحن', 'About Us')}</h1>

          <div className="prose max-w-none space-y-6">
            <p className="text-lg">
              {t(
                'شفاء هي منصة إلكترونية رائدة في مجال الصيدليات في مصر، تربط بين أكثر من 1000 صيدلية شريكة لتوفير خدمة توصيل سريعة ومريحة للمنتجات الصحية والدوائية.',
                'Chefaa is a leading online pharmacy platform in Egypt, connecting over 1,000 partner pharmacies to provide fast and convenient delivery of health and pharmaceutical products.'
              )}
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">{t('مهمتنا', 'Our Mission')}</h2>
            <p>
              {t(
                'نهدف إلى جعل الرعاية الصحية أكثر سهولة وإمكانية الوصول لجميع المصريين من خلال توفير منصة إلكترونية موثوقة وسهلة الاستخدام للحصول على الأدوية والمنتجات الصحية.',
                'We aim to make healthcare more accessible to all Egyptians by providing a reliable and easy-to-use online platform for obtaining medicines and health products.'
              )}
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">{t('خدماتنا', 'Our Services')}</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>{t('توصيل سريع خلال 30-60 دقيقة', 'Fast delivery in 30-60 minutes')}</li>
              <li>{t('خدمة Big Save للتوصيل المجاني خلال 72 ساعة', 'Big Save service for free delivery within 72 hours')}</li>
              <li>{t('رفع الروشتات الطبية', 'Prescription upload service')}</li>
              <li>{t('دعم صيدلي متاح 24/7', '24/7 pharmacist support')}</li>
              <li>{t('أكثر من 41,000 منتج مرخص', 'Over 41,000 licensed products')}</li>
              <li>{t('تغطية 25 مدينة في مصر', 'Coverage in 25 cities across Egypt')}</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">{t('لماذا شفاء؟', 'Why Chefaa?')}</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>{t('شبكة واسعة من الصيدليات المعتمدة', 'Wide network of certified pharmacies')}</li>
              <li>{t('أسعار تنافسية وعروض خاصة', 'Competitive prices and special offers')}</li>
              <li>{t('خدمة عملاء ممتازة', 'Excellent customer service')}</li>
              <li>{t('تطبيق سهل الاستخدام', 'Easy-to-use mobile app')}</li>
              <li>{t('ضمان أصالة المنتجات', 'Guarantee of product authenticity')}</li>
            </ul>

            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mt-8">
              <p className="text-lg font-semibold text-brand-blue-700">
                {t(
                  'انضم إلى آلاف العملاء الذين يثقون في شفاء لتلبية احتياجاتهم الصحية اليومية',
                  'Join thousands of customers who trust Chefaa for their daily healthcare needs'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

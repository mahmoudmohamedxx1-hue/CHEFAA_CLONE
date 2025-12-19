import BulkOrderInterface from '../components/BulkOrderInterface';
import { useNavigate } from 'react-router-dom';

type BulkOrderPageProps = {
  language: 'ar' | 'en';
};

export default function BulkOrderPage({ language }: BulkOrderPageProps) {
  const navigate = useNavigate();
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleOrderCreated = () => {
    // Navigate to orders page or show success message
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {t('طلب بالجملة للشركات', 'Bulk Orders for Businesses')}
          </h1>
          <p className="text-gray-600">
            {t(
              'قم بتقديم طلباتك الكبيرة بسهولة عبر رفع ملف CSV',
              'Submit your bulk orders easily via CSV file upload'
            )}
          </p>
        </div>

        <BulkOrderInterface language={language} onOrderCreated={handleOrderCreated} />
      </div>
    </div>
  );
}

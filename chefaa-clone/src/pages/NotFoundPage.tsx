import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

type NotFoundPageProps = {
  language: 'ar' | 'en';
};

export default function NotFoundPage({ language }: NotFoundPageProps) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <div className="text-8xl lg:text-9xl font-bold text-gray-100 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-brand-blue-500 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t('الصفحة غير موجودة', 'Page Not Found')}
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            {t(
              'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
              'Sorry, the page you are looking for doesn\'t exist or has been moved.'
            )}
          </p>
          <p className="text-sm text-gray-500">
            {t(
              'تأكد من الرابط المدخل أو حاول استخدام البحث للعثور على ما تبحث عنه.',
              'Please check the URL or try using search to find what you\'re looking for.'
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('العودة للخلف', 'Go Back')}
          </button>
          
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-brand-blue-500 text-white rounded-lg hover:bg-brand-blue-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            {t('العودة للرئيسية', 'Go Home')}
          </Link>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-semibold mb-4">
            {t('روابط سريعة', 'Quick Links')}
          </h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/search"
              className="text-brand-blue-500 hover:text-brand-blue-600 underline"
            >
              {t('البحث', 'Search')}
            </Link>
            <Link
              to="/category/medications"
              className="text-brand-blue-500 hover:text-brand-blue-600 underline"
            >
              {t('الأدوية', 'Medications')}
            </Link>
            <Link
              to="/category/skin-care"
              className="text-brand-blue-500 hover:text-brand-blue-600 underline"
            >
              {t('العناية بالبشرة', 'Skin Care')}
            </Link>
            <Link
              to="/category/vitamins"
              className="text-brand-blue-500 hover:text-brand-blue-600 underline"
            >
              {t('الفيتامينات', 'Vitamins')}
            </Link>
            <Link
              to="/cart"
              className="text-brand-blue-500 hover:text-brand-blue-600 underline"
            >
              {t('السلة', 'Cart')}
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          {t(
            'إذا كنت تعتقد أن هذه مشكلة في الموقع، يرجى ',
            'If you think this is a problem with our site, please '
          )}
          <a
            href="/contact"
            className="text-brand-blue-500 hover:text-brand-blue-600 underline"
          >
            {t('التواصل معنا', 'contact us')}
          </a>
          .
        </div>
      </div>
    </div>
  );
}

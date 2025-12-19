import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useFeaturedProducts } from '../hooks/useProducts';
import { Product } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { ChevronRight, Pill, Droplet, Baby, Heart, Stethoscope, Sparkles, Activity, Bone, Bone as Pet, Loader2 } from 'lucide-react';

type HomePageProps = {
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
};

const categoryIcons = {
  'medications': Pill,
  'hair-care': Sparkles,
  'skin-care': Droplet,
  'daily-essentials': Heart,
  'mom-baby': Baby,
  'makeup-accessories': Sparkles,
  'medical-supplies': Stethoscope,
  'vitamins-supplements': Activity,
  'sexual-wellness': Heart,
  'pet-supplies': Pet,
};

export default function HomePage({ language, onAddToCart }: HomePageProps) {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: featuredProducts = [], isLoading: productsLoading } = useFeaturedProducts(20);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const loading = categoriesLoading || productsLoading;

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('صيدليتك الإلكترونية الموثوقة', 'Your Trusted Online Pharmacy')}
            </h1>
            <p className="text-xl mb-6">
              {t('توصيل سريع في 30-60 دقيقة من أقرب صيدلية', 'Fast delivery in 30-60 minutes from nearest pharmacy')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/prescription"
                className="px-6 py-3 bg-white text-brand-blue-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                {t('ارفع روشتتك', 'Upload Prescription')}
              </Link>
              <Link
                to="/category/medications"
                className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                {t('تصفح المنتجات', 'Browse Products')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">{t('الأقسام الرئيسية', 'Main Categories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] || Pill;
            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="bg-white p-6 rounded-lg text-center hover:shadow-hover transition-shadow group"
              >
                <div className="w-16 h-16 mx-auto mb-3 bg-brand-blue-100 rounded-full flex items-center justify-center group-hover:bg-brand-blue-500 transition-colors">
                  <Icon className="w-8 h-8 text-brand-blue-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-sm">
                  {language === 'ar' ? category.name_ar : category.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('منتجات مميزة', 'Featured Products')}</h2>
          <Link to="/category/medications" className="text-brand-blue-500 hover:text-brand-blue-600 flex items-center gap-1">
            {t('عرض الكل', 'View All')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                language={language}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust Signals */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg text-center">
            <p className="text-3xl font-bold text-brand-blue-500 mb-2">1,000+</p>
            <p className="text-text-secondary">{t('صيدلية شريكة', 'Partner Pharmacies')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg text-center">
            <p className="text-3xl font-bold text-brand-blue-500 mb-2">41,000+</p>
            <p className="text-text-secondary">{t('منتج مرخص', 'Licensed Products')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg text-center">
            <p className="text-3xl font-bold text-brand-blue-500 mb-2">25</p>
            <p className="text-text-secondary">{t('مدينة', 'Cities')}</p>
          </div>
          <div className="bg-white p-6 rounded-lg text-center">
            <p className="text-3xl font-bold text-brand-blue-500 mb-2">24/7</p>
            <p className="text-text-secondary">{t('دعم صيدلي', 'Pharmacist Support')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

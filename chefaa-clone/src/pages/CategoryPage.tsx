import { useParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCategory } from '../hooks/useCategories';
import { Product } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { ProductListSkeleton } from '../components/Skeleton';
import { Loader2 } from 'lucide-react';

type CategoryPageProps = {
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
};

export default function CategoryPage({ language, onAddToCart }: CategoryPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const { data: category, isLoading: categoryLoading } = useCategory(slug || '');
  const { data: products = [], isLoading: productsLoading } = useProducts({ 
    categoryId: category?.id 
  });

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const loading = categoryLoading || productsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <ProductListSkeleton count={12} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? category?.name_ar : category?.name}
          </h1>
          <p className="text-gray-600">
            {products.length} {t('منتج', 'products')}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">
              {t('لا توجد منتجات في هذه الفئة', 'No products in this category')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                language={language}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

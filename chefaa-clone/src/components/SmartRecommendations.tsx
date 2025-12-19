import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProductCard from './ProductCard';
import { Product } from '../lib/supabase';

interface SmartRecommendationsProps {
  productId?: string;
  userId?: string;
  type: 'copurchase' | 'similar' | 'trending' | 'personalized';
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
  limit?: number;
}

export default function SmartRecommendations({
  productId,
  userId,
  type,
  language,
  onAddToCart,
  limit = 5,
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    fetchRecommendations();
  }, [productId, userId, type]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let data: Product[] = [];

      switch (type) {
        case 'copurchase':
          if (productId) {
            // Get products frequently bought together
            const { data: recommendations, error } = await supabase.rpc(
              'get_product_recommendations',
              {
                p_product_id: productId,
                p_limit: limit,
              }
            );

            if (!error && recommendations) {
              // Fetch full product details
              const productIds = recommendations.map(
                (r: any) => r.product_id
              );
              const { data: products } = await supabase
                .from('products')
                .select('*')
                .in('id', productIds)
                .limit(limit);

              if (products) data = products;
            }
          }
          break;

        case 'similar':
          if (productId) {
            // Get similar products based on category and brand
            const { data: currentProduct } = await supabase
              .from('products')
              .select('category_id, brand')
              .eq('id', productId)
              .single();

            if (currentProduct) {
              const { data: products } = await supabase
                .from('products')
                .select('*')
                .eq('category_id', currentProduct.category_id)
                .neq('id', productId)
                .gt('stock_quantity', 0)
                .order('rating', { ascending: false })
                .limit(limit);

              if (products) data = products;
            }
          }
          break;

        case 'trending':
          // Get top-rated and most-viewed products
          const { data: products } = await supabase
            .from('products')
            .select('*')
            .gt('stock_quantity', 0)
            .order('rating', { ascending: false })
            .order('review_count', { ascending: false })
            .limit(limit);

          if (products) data = products;
          break;

        case 'personalized':
          if (userId) {
            // Get personalized recommendations based on user preferences
            // For now, return top-rated products
            // TODO: Implement ML-based personalization
            const { data: products } = await supabase
              .from('products')
              .select('*')
              .gt('stock_quantity', 0)
              .order('rating', { ascending: false })
              .limit(limit);

            if (products) data = products;
          }
          break;
      }

      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'copurchase':
        return t('المنتجات المشتراة معا', 'Frequently Bought Together');
      case 'similar':
        return t('منتجات مشابهة', 'Similar Products');
      case 'trending':
        return t('منتجات رائجة', 'Trending Products');
      case 'personalized':
        return t('موصى به لك', 'Recommended for You');
      default:
        return t('منتجات مقترحة', 'Suggested Products');
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6">{getTitle()}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-lg h-80"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">{getTitle()}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {recommendations.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            language={language}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Product } from '../lib/supabase';
import { LazyImage } from './LazyImage';

type ProductCardProps = {
  product: Product;
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
};

export default function ProductCard({ product, language, onAddToCart }: ProductCardProps) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const productName = language === 'ar' ? product.name_ar : product.name;
  const productDesc = language === 'ar' ? product.description_ar : product.description;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-hover transition-shadow duration-base group">
      <Link to={`/product/${product.slug}`}>
        <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
          <LazyImage
            src={product.images && product.images[0] ? product.images[0] : 'https://placehold.co/400x400/2563EB/white?text=Product'}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-base"
          />
        </div>
      </Link>

      <div className="space-y-2">
        {product.brand && (
          <p className="text-xs text-text-secondary">{product.brand}</p>
        )}

        <Link to={`/product/${product.slug}`}>
          <h3 className="text-base font-semibold text-text-primary line-clamp-2 hover:text-brand-blue-500">
            {productName}
          </h3>
        </Link>

        <p className="text-sm text-text-secondary line-clamp-1">{productDesc}</p>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold">{(product.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-text-secondary">({product.review_count || 0})</span>
          </div>
        )}

        {/* Price */}
        {product.price !== undefined && (
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-lg font-bold text-text-primary">
                {(product.price || 0).toFixed(2)} {t('ج.م', 'EGP')}
              </p>
              {product.formulation && (
                <p className="text-xs text-text-secondary">{product.formulation}</p>
              )}
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        {(product.stock_quantity !== undefined) && (
          <>
            <button
              onClick={() => onAddToCart(product)}
              disabled={(product.stock_quantity || 0) === 0}
              className="w-full mt-3 py-2.5 px-4 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast"
            >
              {(product.stock_quantity || 0) === 0
                ? t('نفذت الكمية', 'Out of Stock')
                : t('أضف للسلة', 'Add to Cart')}
            </button>

            {(product.stock_quantity || 0) > 0 && (product.stock_quantity || 0) < 20 && (
              <p className="text-xs text-accent-amber mt-2">
                {t('كمية محدودة', 'Limited Quantity')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

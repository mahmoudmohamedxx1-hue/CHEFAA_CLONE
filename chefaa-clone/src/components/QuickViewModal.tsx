import { useState } from 'react';
import { X, ShoppingCart, Heart, ZoomIn, Star } from 'lucide-react';
import { Product } from '../lib/supabase';
import OptimizedImage from './OptimizedImage';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  language: 'ar' | 'en';
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  language,
}: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  if (!isOpen || !product) return null;

  const productName = language === 'ar' ? product.name_ar : product.name;
  const productDesc = language === 'ar' ? product.description_ar : product.description;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {t('معاينة سريعة', 'Quick View')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
              <OptimizedImage
                src={product.images[selectedImage] || product.images[0]}
                alt={productName}
                className="w-full h-full object-cover"
                priority
              />
              <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-blue-600'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <OptimizedImage
                      src={img}
                      alt={`${productName} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="space-y-4">
            {/* Brand */}
            {product.brand && (
              <p className="text-sm text-gray-600">{product.brand}</p>
            )}

            {/* Product Name */}
            <h3 className="text-2xl font-bold text-gray-900">
              {productName}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                ({product.review_count} {t('تقييم', 'reviews')})
              </span>
            </div>

            {/* Price */}
            <div className="border-t border-b py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {product.price.toFixed(2)} {t('ج.م', 'EGP')}
                </span>
                {product.formulation && (
                  <span className="text-sm text-gray-600">
                    / {product.formulation}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div>
              {product.stock_quantity > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">
                    {t('متوفر في المخزون', 'In Stock')}
                    {product.stock_quantity < 20 && ` (${product.stock_quantity} ${t('متبقي', 'remaining')})`}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-700">
                    {t('نفذت الكمية', 'Out of Stock')}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">
                {t('الوصف', 'Description')}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-3">
                {productDesc}
              </p>
            </div>

            {/* Quantity Selector */}
            {product.stock_quantity > 0 && (
              <div className="flex items-center gap-4">
                <label className="font-semibold">
                  {t('الكمية', 'Quantity')}:
                </label>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(product.stock_quantity, quantity + 1)
                      )
                    }
                    className="px-4 py-2 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {t('أضف للسلة', 'Add to Cart')}
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* View Full Details Link */}
            <a
              href={`/product/${product.slug}`}
              className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('عرض التفاصيل الكاملة', 'View Full Details')} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

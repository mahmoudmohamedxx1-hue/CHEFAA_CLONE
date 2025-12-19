import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Product } from '../lib/supabase';
import { Star, ChevronRight, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';

type ProductDetailPageProps = {
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
};

export default function ProductDetailPage({ language, onAddToCart }: ProductDetailPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  useEffect(() => {
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const loadProduct = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (data) {
      setProduct(data);
    }

    setLoading(false);
  };

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        onAddToCart(product);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background-secondary py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">{t('المنتج غير موجود', 'Product not found')}</h1>
        </div>
      </div>
    );
  }

  const productName = language === 'ar' ? product.name_ar : product.name;
  const productDesc = language === 'ar' ? product.description_ar : product.description;

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <a href="/" className="hover:text-brand-blue-500">{t('الرئيسية', 'Home')}</a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-text-primary font-semibold">{productName}</span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-lg p-6">
          {/* Product Images */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.images[0] || 'https://placehold.co/600x600/2563EB/white?text=Product'}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.brand && (
              <p className="text-brand-blue-500 font-semibold">{product.brand}</p>
            )}

            <h1 className="text-3xl font-bold">{productName}</h1>

            <p className="text-text-secondary">{productDesc}</p>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-text-secondary">({product.review_count} {t('تقييم', 'reviews')})</span>
            </div>

            {/* Price */}
            <div className="border-t border-b py-4">
              <p className="text-4xl font-bold text-brand-blue-500">
                {product.price.toFixed(2)} {t('ج.م', 'EGP')}
              </p>
              {product.formulation && (
                <p className="text-text-secondary mt-1">{product.formulation}</p>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {product.stock_quantity > 0 ? (
                <p className="text-semantic-success font-semibold">
                  {t('متوفر', 'In Stock')} ({product.stock_quantity} {t('قطعة', 'units')})
                </p>
              ) : (
                <p className="text-semantic-error font-semibold">
                  {t('نفذت الكمية', 'Out of Stock')}
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <label className="font-semibold">{t('الكمية:', 'Quantity:')}</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                  disabled={quantity >= product.stock_quantity}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full py-4 px-6 bg-brand-blue-500 text-white rounded-lg font-bold text-lg hover:bg-brand-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-6 h-6" />
              {product.stock_quantity === 0
                ? t('نفذت الكمية', 'Out of Stock')
                : t('أضف للسلة', 'Add to Cart')}
            </button>

            {product.prescription_required && (
              <div className="bg-accent-amber/10 border border-accent-amber rounded-lg p-4">
                <p className="text-accent-amber font-semibold">
                  {t('هذا المنتج يتطلب وصفة طبية', 'This product requires a prescription')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comprehensive Product Information */}
        {(product.overview_description || product.key_ingredients || product.benefits || product.dosage_administration || product.warnings_precautions || product.storage_conditions) && (
          <div className="mt-8 bg-white rounded-lg overflow-hidden">
            {/* Overview Description */}
            {product.overview_description && (
              <div className="border-b">
                <button
                  onClick={() => toggleSection('overview')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold">{t('نظرة عامة', 'Overview')}</h3>
                  {expandedSections.includes('overview') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('overview') && (
                  <div className="px-6 pb-4 text-text-secondary">
                    <p className="leading-relaxed">{product.overview_description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Key Ingredients */}
            {product.key_ingredients && Array.isArray(product.key_ingredients) && product.key_ingredients.length > 0 && (
              <div className="border-b">
                <button
                  onClick={() => toggleSection('ingredients')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold">{t('المكونات الرئيسية', 'Key Ingredients')}</h3>
                  {expandedSections.includes('ingredients') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('ingredients') && (
                  <div className="px-6 pb-4">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {product.key_ingredients.map((ingredient: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-brand-blue-500 rounded-full"></span>
                          <span className="text-text-secondary">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Benefits */}
            {product.benefits && Array.isArray(product.benefits) && product.benefits.length > 0 && (
              <div className="border-b">
                <button
                  onClick={() => toggleSection('benefits')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold">{t('الفوائد', 'Benefits')}</h3>
                  {expandedSections.includes('benefits') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('benefits') && (
                  <div className="px-6 pb-4">
                    <ul className="space-y-2">
                      {product.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-accent-green mt-1">✓</span>
                          <span className="text-text-secondary">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Active Ingredients (for medications) */}
            {product.active_ingredients && Array.isArray(product.active_ingredients) && product.active_ingredients.length > 0 && (
              <div className="border-b">
                <button
                  onClick={() => toggleSection('active')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold">{t('المواد الفعالة', 'Active Ingredients')}</h3>
                  {expandedSections.includes('active') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('active') && (
                  <div className="px-6 pb-4">
                    <ul className="space-y-2">
                      {product.active_ingredients.map((ingredient: any, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="font-semibold text-brand-blue-500">{ingredient.name || ingredient}</span>
                          {ingredient.concentration && (
                            <span className="text-text-secondary">({ingredient.concentration})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Dosage & Administration / Usage Instructions */}
            {product.dosage_administration && (
              <div className="border-b">
                <button
                  onClick={() => toggleSection('dosage')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold">{t('طريقة الاستخدام', 'Usage Instructions')}</h3>
                  {expandedSections.includes('dosage') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('dosage') && (
                  <div className="px-6 pb-4 text-text-secondary">
                    <p className="leading-relaxed">{product.dosage_administration}</p>
                  </div>
                )}
              </div>
            )}

            {/* Warnings & Precautions */}
            {product.warnings_precautions && (
              <div className="border-b">
                <button
                  onClick={() => toggleSection('warnings')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-accent-amber">{t('تحذيرات وإحتياطات', 'Warnings & Precautions')}</h3>
                  {expandedSections.includes('warnings') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('warnings') && (
                  <div className="px-6 pb-4 text-text-secondary bg-accent-amber/5">
                    <p className="leading-relaxed">{product.warnings_precautions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Storage Conditions */}
            {product.storage_conditions && (
              <div>
                <button
                  onClick={() => toggleSection('storage')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold">{t('ظروف التخزين', 'Storage Conditions')}</h3>
                  {expandedSections.includes('storage') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {expandedSections.includes('storage') && (
                  <div className="px-6 pb-4 text-text-secondary">
                    <p className="leading-relaxed">{product.storage_conditions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

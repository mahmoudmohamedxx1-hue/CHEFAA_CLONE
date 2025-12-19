import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useDebounce } from '../hooks/useDebounce';
import { Product } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { Search, Filter, X, Loader2, SlidersHorizontal } from 'lucide-react';

type SearchPageProps = {
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
};

type SortOption = 'name' | 'price-asc' | 'price-desc' | 'rating';

export default function SearchPage({ language, onAddToCart }: SearchPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const [localQuery, setLocalQuery] = useState(queryParam);
  const debouncedQuery = useDebounce(localQuery, 300);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [inStockOnly, setInStockOnly] = useState(false);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  // Fetch data
  const { data: searchResults = [], isLoading } = useSearchProducts(debouncedQuery);
  const { data: categories = [] } = useCategories();

  // Apply filters and sorting
  const filteredProducts = searchResults
    .filter(product => {
      // Category filter
      if (selectedCategory && product.category_id !== selectedCategory) {
        return false;
      }
      // Price range filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false;
      }
      // Stock filter
      if (inStockOnly && (product.stock_quantity || 0) === 0) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
        default:
          return (language === 'ar' ? a.name_ar : a.name).localeCompare(
            language === 'ar' ? b.name_ar : b.name
          );
      }
    });

  const handleSearch = (query: string) => {
    setLocalQuery(query);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 1000]);
    setInStockOnly(false);
    setSortBy('name');
  };

  const activeFiltersCount = 
    (selectedCategory ? 1 : 0) + 
    (inStockOnly ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-[100px] z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('ابحث عن المنتجات...', 'Search for products...')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-brand-blue-500 text-white border-brand-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden md:inline">{t('تصفية', 'Filters')}</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-brand-blue-500 px-2 py-0.5 rounded-full text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Results Summary */}
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <div>
              {debouncedQuery && (
                <span>
                  {t('نتائج البحث عن:', 'Search results for:')} <strong>"{debouncedQuery}"</strong>
                </span>
              )}
              {' '}
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('جارٍ البحث...', 'Searching...')}
                </span>
              ) : (
                <span>
                  ({filteredProducts.length} {t('منتج', 'products')})
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="name">{t('الاسم', 'Name')}</option>
              <option value="price-asc">{t('السعر: الأقل أولاً', 'Price: Low to High')}</option>
              <option value="price-desc">{t('السعر: الأعلى أولاً', 'Price: High to Low')}</option>
              <option value="rating">{t('التقييم', 'Rating')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-[200px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{t('التصفية', 'Filters')}</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-brand-blue-500 hover:underline"
                    >
                      {t('مسح الكل', 'Clear all')}
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">
                    {t('الفئة', 'Category')}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  >
                    <option value="">{t('جميع الفئات', 'All Categories')}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {language === 'ar' ? cat.name_ar : cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">
                    {t('نطاق السعر', 'Price Range')}
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        placeholder={t('من', 'Min')}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                        placeholder={t('إلى', 'Max')}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      {priceRange[0]} - {priceRange[1]} {t('ج.م', 'EGP')}
                    </div>
                  </div>
                </div>

                {/* Stock Filter */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 text-brand-blue-500 border-gray-300 rounded focus:ring-brand-blue-500"
                    />
                    <span className="text-sm">{t('متوفر في المخزون فقط', 'In Stock Only')}</span>
                  </label>
                </div>
              </div>
            </aside>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-brand-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">{t('جارٍ تحميل النتائج...', 'Loading results...')}</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  {t('لا توجد نتائج', 'No results found')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('جرب البحث بكلمات مختلفة أو قم بتعديل التصفية', 'Try different keywords or adjust your filters')}
                </p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-brand-blue-500 text-white rounded-lg hover:bg-brand-blue-600"
                  >
                    {t('مسح التصفية', 'Clear Filters')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
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
      </div>
    </div>
  );
}

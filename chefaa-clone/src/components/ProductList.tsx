import { useState, useEffect } from 'react';
import { Product } from '../lib/supabase';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DataSource {
  type: 'category' | 'search' | 'featured' | 'custom';
  params?: Record<string, any>;
  query?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export interface ProductListProps {
  // Core props
  language: 'ar' | 'en';
  onAddToCart: (product: Product) => void;
  
  // Data source configuration
  dataSource: DataSource;
  
  // Optional configuration
  title?: {
    ar: string;
    en: string;
  };
  subtitle?: {
    ar: string;
    en: string;
  };
  showPagination?: boolean;
  initialPageSize?: number;
  className?: string;
  
  // Optional callbacks
  onDataLoad?: (products: Product[], pagination?: PaginationInfo) => void;
  onError?: (error: Error) => void;
}

export default function ProductList({
  language,
  onAddToCart,
  dataSource,
  title,
  subtitle,
  showPagination = true,
  initialPageSize = 20,
  className = '',
  onDataLoad,
  onError
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: initialPageSize
  });

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    loadProducts();
  }, [dataSource, pagination.currentPage, pagination.pageSize]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { supabase } = await import('../lib/supabase');
      let query = supabase.from('products').select('*', { count: 'exact' });
      let data: Product[] = [];
      let count = 0;

      // Apply data source filters
      switch (dataSource.type) {
        case 'category':
          if (dataSource.params?.categoryId) {
            query = query.eq('category_id', dataSource.params.categoryId);
          }
          if (dataSource.params?.slug) {
            // First get category ID from slug
            const { data: categoryData } = await supabase
              .from('categories')
              .select('id')
              .eq('slug', dataSource.params.slug)
              .single();
            
            if (categoryData) {
              query = query.eq('category_id', categoryData.id);
            }
          }
          break;

        case 'search':
          if (dataSource.query) {
            query = query.or(
              `name.ilike.%${dataSource.query}%,name_ar.ilike.%${dataSource.query}%,description.ilike.%${dataSource.query}%,brand.ilike.%${dataSource.query}%`
            );
          }
          break;

        case 'featured':
          query = query.eq('is_featured', true);
          break;

        case 'custom':
          if (dataSource.params?.filters) {
            Object.entries(dataSource.params.filters).forEach(([key, value]) => {
              if (key === 'or' && Array.isArray(value)) {
                query = query.or(value.join(','));
              } else {
                query = query.eq(key, value);
              }
            });
          }
          break;
      }

      // Apply pagination
      const from = (pagination.currentPage - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      // Apply ordering
      if (dataSource.params?.orderBy) {
        query = query.order(dataSource.params.orderBy.field, {
          ascending: dataSource.params.orderBy.ascending ?? true
        });
      } else {
        query = query.order('name');
      }

      // Execute query with pagination
      const { data: productData, error: queryError, count: totalCount } = await query
        .range(from, to);

      if (queryError) {
        throw new Error(queryError.message);
      }

      data = productData || [];
      count = totalCount || 0;

      setProducts(data);
      setPagination(prev => ({
        ...prev,
        totalCount: count,
        totalPages: Math.ceil(count / prev.pageSize)
      }));

      onDataLoad?.(data, {
        currentPage: pagination.currentPage,
        totalPages: Math.ceil(count / pagination.pageSize),
        totalCount: count,
        pageSize: pagination.pageSize
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
  };

  // Loading state
  if (loading && products.length === 0) {
    return (
      <div className={`min-h-screen bg-background-secondary py-8 ${className}`}>
        <div className="container mx-auto px-4">
          {/* Header Skeleton */}
          {(title || subtitle) && (
            <div className="bg-white rounded-lg p-6 mb-8 animate-pulse">
              {title && (
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              )}
              {subtitle && (
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              )}
            </div>
          )}
          
          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen bg-background-secondary py-8 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {t('حدث خطأ', 'An Error Occurred')}
            </h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              onClick={loadProducts}
              className="px-6 py-3 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors duration-fast"
            >
              {t('إعادة المحاولة', 'Try Again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background-secondary py-8 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="bg-white rounded-lg p-6 mb-8">
            {title && (
              <h1 className="text-3xl font-bold mb-2">{t(title.ar, title.en)}</h1>
            )}
            {subtitle && (
              <p className="text-text-secondary">
                {t(subtitle.ar, subtitle.en)}
              </p>
            )}
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m0 0v10a2 2 0 01-2 2H8a2 2 0 01-2-2V5" />
              </svg>
            </div>
            <p className="text-xl text-text-secondary mb-4">
              {t('لا توجد منتجات', 'No Products Found')}
            </p>
            <p className="text-text-secondary">
              {t('لا توجد منتجات مطابقة للمعايير المحددة حالياً', 'No products match the current criteria')}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>

            {/* Pagination */}
            {showPagination && pagination.totalPages > 1 && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Results info */}
                  <div className="text-sm text-text-secondary">
                    {t(
                      `عرض ${((pagination.currentPage - 1) * pagination.pageSize) + 1}-${Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} من ${pagination.totalCount} منتج`,
                      `Showing ${((pagination.currentPage - 1) * pagination.pageSize) + 1}-${Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of ${pagination.totalCount} products`
                    )}
                  </div>

                  {/* Page size selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">
                      {t('عرض', 'Show')}
                    </span>
                    <select
                      value={pagination.pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-text-secondary">
                      {t('منتج', 'per page')}
                    </span>
                  </div>

                  {/* Pagination buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-text-primary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast"
                    >
                      {language === 'ar' ? (
                        <>
                          <ChevronRight className="w-4 h-4 inline ml-1" />
                          السابق
                        </>
                      ) : (
                        <>
                          <ChevronLeft className="w-4 h-4 inline mr-1" />
                          Previous
                        </>
                      )}
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-fast ${
                              pageNum === pagination.currentPage
                                ? 'bg-brand-blue-500 text-white'
                                : 'text-text-primary hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-text-primary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast"
                    >
                      {language === 'ar' ? (
                        <>
                          التالي
                          <ChevronLeft className="w-4 h-4 inline mr-1" />
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4 inline ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

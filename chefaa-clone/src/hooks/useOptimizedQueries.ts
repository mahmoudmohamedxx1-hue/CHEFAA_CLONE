import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ProductQueryOptions {
  categorySlug?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'price' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export function useOptimizedProducts(options: ProductQueryOptions = {}) {
  const {
    categorySlug = null,
    limit = 20,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  return useQuery({
    queryKey: ['products', categorySlug, limit, offset, sortBy, sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_products_optimized', {
        category_slug: categorySlug,
        limit_count: limit,
        offset_count: offset,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSearchProducts(searchQuery: string, limit = 20) {
  return useQuery({
    queryKey: ['search', searchQuery, limit],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase.rpc('search_products', {
        search_query: searchQuery,
        limit_count: limit,
        offset_count: 0,
      });

      if (error) throw error;
      return data;
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, name_ar, slug)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
  });
}

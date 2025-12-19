import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Product } from '../lib/supabase';

// Query Keys
export const QUERY_KEYS = {
  products: (filters?: any) => ['products', filters],
  product: (slug: string) => ['product', slug],
  categories: ['categories'],
  category: (slug: string) => ['category', slug],
  featuredProducts: ['featured-products'],
  searchProducts: (query: string) => ['search-products', query],
};

// Fetch all products with optional filters
export function useProducts(filters?: {
  categoryId?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.products(filters),
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.featured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single product by slug
export function useProduct(slug: string) {
  return useQuery({
    queryKey: QUERY_KEYS.product(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!slug && slug !== 'undefined',
    retry: 1,
  });
}

// Fetch featured products
export function useFeaturedProducts(limit: number = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.featuredProducts,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Search products
export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.searchProducts(query),
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,name_ar.ilike.%${query}%,description.ilike.%${query}%,description_ar.ilike.%${query}%`)
        .limit(50);

      if (error) throw error;
      return data as Product[];
    },
    enabled: query.trim().length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Update product (admin only)
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
    },
  });
}

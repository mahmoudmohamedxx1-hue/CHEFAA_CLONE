import { useQuery } from '@tanstack/react-query';
import { supabase, Category } from '../lib/supabase';

// Query Keys
const CATEGORY_KEYS = {
  all: ['categories'],
  bySlug: (slug: string) => ['category', slug],
};

// Fetch all categories
export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - categories don't change often
  });
}

// Fetch single category by slug
export function useCategory(slug: string) {
  return useQuery({
    queryKey: CATEGORY_KEYS.bySlug(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as Category;
    },
    enabled: !!slug,
    staleTime: 15 * 60 * 1000,
  });
}

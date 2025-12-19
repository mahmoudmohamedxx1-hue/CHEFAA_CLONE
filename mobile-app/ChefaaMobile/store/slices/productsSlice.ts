import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category_id: string;
  category_name: string;
  image_url: string;
  images: string[];
  brand?: string;
  dosage_form?: string;
  strength?: string;
  prescription_required: boolean;
  pharmacy_id?: string;
  pharmacy_name?: string;
  in_stock: boolean;
  stock_quantity?: number;
  rating: number;
  review_count: number;
  tags: string[];
  active_ingredients?: string[];
  warnings?: string[];
  contraindications?: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  color?: string;
  product_count: number;
}

interface ProductsState {
  products: Product[];
  categories: Category[];
  featuredProducts: Product[];
  recommendedProducts: Product[];
  searchResults: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  searchLoading: boolean;
  error: string | null;
  hasNextPage: boolean;
  currentPage: number;
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    prescriptionRequired?: boolean;
    inStock?: boolean;
    sortBy?: 'price_low' | 'price_high' | 'rating' | 'newest';
  };
  searchQuery: string;
}

const initialState: ProductsState = {
  products: [],
  categories: [],
  featuredProducts: [],
  recommendedProducts: [],
  searchResults: [],
  currentProduct: null,
  isLoading: false,
  searchLoading: false,
  error: null,
  hasNextPage: true,
  currentPage: 1,
  filters: {},
  searchQuery: '',
};

// Async thunks
export const fetchCategories = createAsyncThunk('products/fetchCategories', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
});

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, limit = 20, category, searchQuery }: {
    page?: number;
    limit?: number;
    category?: string;
    searchQuery?: string;
  }) => {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category_id', category);
    }
    
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
    }
    
    const { data, error } = await query
      .range((page - 1) * limit, page * limit - 1);
    
    if (error) throw error;
    return { products: data, page, hasNextPage: data.length === limit };
  }
);

export const fetchProductById = createAsyncThunk('products/fetchProductById', async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
});

export const fetchFeaturedProducts = createAsyncThunk('products/fetchFeaturedProducts', async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('featured', true)
    .limit(10);
  
  if (error) throw error;
  return data;
});

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async ({ query, filters }: { query: string; filters?: any }) => {
    let searchQuery = supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`);
    
    if (filters?.category) {
      searchQuery = searchQuery.eq('category_id', filters.category);
    }
    
    if (filters?.prescriptionRequired !== undefined) {
      searchQuery = searchQuery.eq('prescription_required', filters.prescriptionRequired);
    }
    
    if (filters?.inStock !== undefined) {
      searchQuery = searchQuery.eq('in_stock', filters.inStock);
    }
    
    const { data, error } = await searchQuery
      .order('rating', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return { results: data, query };
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
    },
    
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
      state.currentPage = 1;
      state.hasNextPage = true;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setCategory: (state, action: PayloadAction<string | undefined>) => {
      state.filters.category = action.payload;
      state.currentPage = 1;
      state.hasNextPage = true;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      })
      
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        const { products, page, hasNextPage } = action.payload;
        
        if (page === 1) {
          state.products = products;
        } else {
          state.products = [...state.products, ...products];
        }
        
        state.currentPage = page;
        state.hasNextPage = hasNextPage;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      
      // Fetch Product by ID
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
      })
      
      // Fetch Featured Products
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      })
      
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchLoading = false;
        const { results, query } = action.payload;
        state.searchResults = results;
        state.searchQuery = query;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.error.message || 'Search failed';
      });
  },
});

export const {
  setCurrentProduct,
  setFilters,
  clearSearchResults,
  clearError,
  setSearchQuery,
  setCategory,
} = productsSlice.actions;

export default productsSlice.reducer;
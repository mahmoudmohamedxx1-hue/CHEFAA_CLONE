import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hdcpruwkvarfbdtztzgq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY3BydXdrdmFyZmJkdHp0emdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzEyMzIsImV4cCI6MjA3NzUwNzIzMn0.lq3E94nj3GrQtkJ-LfQtOBvTptFgOjPJDiMZ7csXnOQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  description_ar: string;
  price: number;
  category_id: string;
  brand: string;
  images: string[];
  rating: number;
  review_count: number;
  prescription_required: boolean;
  stock_quantity: number;
  formulation?: string;
  is_featured: boolean;
  // Overview fields
  overview_description?: string;
  key_ingredients?: string[];
  benefits?: string[];
  active_ingredients?: any[];
  therapeutic_indications?: any[];
  dosage_administration?: string;
  product_specifications?: any;
  suitability_info?: string;
  warnings_precautions?: string;
  storage_conditions?: string;
};

export type Category = {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  icon_url?: string;
  display_order: number;
};

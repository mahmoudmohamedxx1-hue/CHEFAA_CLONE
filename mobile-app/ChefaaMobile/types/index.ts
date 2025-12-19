// Authentication Types
export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  biometricEnabled: boolean;
}

// Product Types
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

// Cart Types
export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  max_quantity?: number;
  prescription_required?: boolean;
  category: string;
  pharmacy_id?: string;
  pharmacy_name?: string;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  pharmacyDiscount: number;
  deliveryFee: number;
  isLoading: boolean;
  error: string | null;
}

// Order Types
export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: {
    id: string;
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    pharmacy_id: string;
    pharmacy_name: string;
  }[];
  total_amount: number;
  pharmacy_discount: number;
  delivery_fee: number;
  coupon_discount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  delivery_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  estimated_delivery: string;
  actual_delivery?: string;
  tracking_info?: {
    tracking_number: string;
    carrier: string;
    current_location?: string;
    estimated_delivery?: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Medical Records Types
export interface MedicalRecord {
  id: string;
  user_id: string;
  member_id?: string;
  record_type: 'prescription' | 'lab_result' | 'medical_image' | 'visit_summary' | 'vaccination' | 'allergy' | 'condition';
  title: string;
  description: string;
  record_date: string;
  provider_name?: string;
  provider_contact?: string;
  file_url?: string;
  thumbnail_url?: string;
  tags: string[];
  is_confidential: boolean;
  shared_with: string[];
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  user_id: string;
  member_id?: string;
  doctor_name: string;
  doctor_contact: string;
  prescription_date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  diagnosis: string;
  validity_period: string;
  refills_allowed: number;
  refills_used: number;
  pharmacy_id?: string;
  file_url?: string;
  status: 'active' | 'expired' | 'filled' | 'cancelled';
  created_at: string;
}

// User Profile Types
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  insurance?: {
    provider: string;
    policy_number: string;
    group_number?: string;
  };
  preferences: {
    notifications: boolean;
    sms_updates: boolean;
    email_updates: boolean;
    default_pharmacy?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string;
  gender: string;
  avatar_url?: string;
  medical_conditions?: string[];
  allergies?: string[];
  emergency_contact: boolean;
  created_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'promotion' | 'reminder' | 'security';
  isRead: boolean;
  timestamp: string;
  actionUrl?: string;
  data?: any;
}

// Location Types
export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface PharmacyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  hours: {
    [key: string]: string;
  };
  distance?: number;
  delivery_available: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export interface CheckoutForm {
  paymentMethod: 'card' | 'cash' | 'wallet';
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  specialInstructions?: string;
}

// Search and Filter Types
export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  prescriptionRequired?: boolean;
  inStock?: boolean;
  sortBy?: 'price_low' | 'price_high' | 'rating' | 'newest';
}

export interface SearchResult {
  products: Product[];
  total: number;
  query: string;
  filters: SearchFilters;
}
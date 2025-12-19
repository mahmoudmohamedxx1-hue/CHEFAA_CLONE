import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  pharmacyDiscount: number;
  deliveryFee: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  pharmacyDiscount: 0,
  deliveryFee: 0,
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'id'> & { tempId?: string }>) => {
      const existingItem = state.items.find(item => item.product_id === action.payload.product_id);
      
      if (existingItem) {
        // Update quantity if item already exists
        existingItem.quantity += action.payload.quantity;
      } else {
        // Add new item
        const newItem: CartItem = {
          ...action.payload,
          id: action.payload.tempId || `temp-${Date.now()}`,
        };
        state.items.push(newItem);
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = Math.max(0, action.payload.quantity);
        if (item.quantity === 0) {
          state.items = state.items.filter(item => item.id !== action.payload.id);
        }
      }
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
      state.pharmacyDiscount = 0;
      state.deliveryFee = 0;
    },
    
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Calculate pharmacy discount (e.g., 10% for orders over $50)
      state.pharmacyDiscount = state.totalPrice > 50 ? state.totalPrice * 0.1 : 0;
      
      // Calculate delivery fee (free delivery for orders over $25)
      state.deliveryFee = state.totalPrice > 25 ? 0 : 4.99;
    },
    
    applyCoupon: (state, action: PayloadAction<{ code: string; discount: number }>) => {
      const { discount } = action.payload;
      state.totalPrice = Math.max(0, state.totalPrice - discount);
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCartItems,
  calculateTotals,
  applyCoupon,
  setLoading,
  setError,
} = cartSlice.actions;

export default cartSlice.reducer;
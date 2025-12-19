import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

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

export interface OrderTracking {
  order_id: string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  trackingInfo: OrderTracking[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  trackingInfo: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk('orders/fetchOrders', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, image_url),
        pharmacies (name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
});

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: {
    items: Order['items'];
    delivery_address: Order['delivery_address'];
    payment_method: string;
    coupon_code?: string;
  }) => {
    const { data, error } = await supabase
      .functions
      .invoke('create-order', {
        body: orderData
      });
    
    if (error) throw error;
    return data;
  }
);

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, image_url),
        pharmacies (name)
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (error) throw error;
  return data;
});

export const trackOrder = createAsyncThunk('orders/trackOrder', async (orderId: string) => {
  const { data, error } = await supabase
    .functions
    .invoke('delivery-tracking', {
      body: { order_id: orderId }
    });
  
  if (error) throw error;
  return data;
});

export const cancelOrder = createAsyncThunk('orders/cancelOrder', async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
});

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = action.payload;
      }
    },
    
    setTrackingInfo: (state, action: PayloadAction<OrderTracking[]>) => {
      state.trackingInfo = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create order';
      })
      
      // Fetch Order by ID
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch order';
      })
      
      // Track Order
      .addCase(trackOrder.fulfilled, (state, action) => {
        state.trackingInfo = action.payload.tracking_info;
        if (state.currentOrder) {
          state.currentOrder.tracking_info = action.payload.tracking;
        }
      })
      .addCase(trackOrder.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to track order';
      })
      
      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        const index = state.orders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to cancel order';
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        const index = state.orders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        if (state.currentOrder?.id === updatedOrder.id) {
          state.currentOrder = updatedOrder;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update order status';
      });
  },
});

export const {
  setCurrentOrder,
  updateOrder,
  setTrackingInfo,
  clearError,
} = ordersSlice.actions;

export default ordersSlice.reducer;
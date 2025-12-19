import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import cartSlice from './slices/cartSlice';
import productsSlice from './slices/productsSlice';
import notificationSlice from './slices/notificationSlice';
import userSlice from './slices/userSlice';
import medicalRecordsSlice from './slices/medicalRecordsSlice';
import ordersSlice from './slices/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cart: cartSlice,
    products: productsSlice,
    notifications: notificationSlice,
    user: userSlice,
    medicalRecords: medicalRecordsSlice,
    orders: ordersSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  biometricEnabled: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  biometricEnabled: false,
};

// Async thunks
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.session) {
      await SecureStore.setItemAsync('session', data.session.access_token);
    }
    
    return data.user;
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) throw error;
    return data.user;
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  
  await SecureStore.deleteItemAsync('session');
});

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
});

export const verifyBiometric = createAsyncThunk(
  'auth/verifyBiometric',
  async () => {
    return await SecureStore.getItemAsync('biometric_data');
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    updateUserMetadata: (state, action: PayloadAction<{ full_name?: string; avatar_url?: string }>) => {
      if (state.user) {
        state.user.user_metadata = { ...state.user.user_metadata, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload as User;
        state.isAuthenticated = true;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Sign in failed';
        state.isAuthenticated = false;
      })
      // Sign Up
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload as User;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Sign up failed';
      })
      // Sign Out
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.biometricEnabled = false;
      })
      // Get Current User
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload as User;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(verifyBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = !!action.payload;
      });
  },
});

export const {
  setUser,
  setError,
  clearError,
  setBiometricEnabled,
  updateUserMetadata,
} = authSlice.actions;

export default authSlice.reducer;
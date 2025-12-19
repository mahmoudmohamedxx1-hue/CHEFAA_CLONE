import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, signIn, signOut, signUp } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store/store';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading, isAuthenticated, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Get current user on app start
    dispatch(getCurrentUser());
  }, [dispatch]);

  const handleSignIn = async (email: string, password: string) => {
    await dispatch(signIn({ email, password }));
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    await dispatch(signUp({ email, password, fullName }));
  };

  const handleSignOut = async () => {
    await dispatch(signOut());
  };

  const handleClearError = () => {
    // This would need to be added to the auth slice
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    clearError: handleClearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
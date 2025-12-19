import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

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

interface UserState {
  profile: UserProfile | null;
  familyMembers: FamilyMember[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  familyMembers: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk('user/fetchProfile', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error) throw error;
  return data;
});

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<UserProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

export const fetchFamilyMembers = createAsyncThunk('user/fetchFamilyMembers', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
});

export const addFamilyMember = createAsyncThunk(
  'user/addFamilyMember',
  async (memberData: Omit<FamilyMember, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');
    
    const { data, error } = await supabase
      .from('family_members')
      .insert([{ ...memberData, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

export const updateFamilyMember = createAsyncThunk(
  'user/updateFamilyMember',
  async ({ id, updates }: { id: string; updates: Partial<FamilyMember> }) => {
    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

export const deleteFamilyMember = createAsyncThunk('user/deleteFamilyMember', async (id: string) => {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return id;
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
    },
    
    updatePreferences: (state, action: PayloadAction<Partial<UserProfile['preferences']>>) => {
      if (state.profile) {
        state.profile.preferences = { ...state.profile.preferences, ...action.payload };
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      
      // Update User Profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update profile';
      })
      
      // Fetch Family Members
      .addCase(fetchFamilyMembers.fulfilled, (state, action) => {
        state.familyMembers = action.payload;
      })
      .addCase(fetchFamilyMembers.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch family members';
      })
      
      // Add Family Member
      .addCase(addFamilyMember.fulfilled, (state, action) => {
        state.familyMembers.unshift(action.payload);
      })
      .addCase(addFamilyMember.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add family member';
      })
      
      // Update Family Member
      .addCase(updateFamilyMember.fulfilled, (state, action) => {
        const index = state.familyMembers.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.familyMembers[index] = action.payload;
        }
      })
      .addCase(updateFamilyMember.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update family member';
      })
      
      // Delete Family Member
      .addCase(deleteFamilyMember.fulfilled, (state, action) => {
        state.familyMembers = state.familyMembers.filter(m => m.id !== action.payload);
      })
      .addCase(deleteFamilyMember.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete family member';
      });
  },
});

export const {
  setProfile,
  updatePreferences,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;
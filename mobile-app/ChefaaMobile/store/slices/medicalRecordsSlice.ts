import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';

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

interface MedicalRecordsState {
  records: MedicalRecord[];
  prescriptions: Prescription[];
  currentRecord: MedicalRecord | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MedicalRecordsState = {
  records: [],
  prescriptions: [],
  currentRecord: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMedicalRecords = createAsyncThunk('medicalRecords/fetchRecords', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', user.id)
    .order('record_date', { ascending: false });
  
  if (error) throw error;
  return data;
});

export const fetchPrescriptions = createAsyncThunk('medicalRecords/fetchPrescriptions', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('prescription_date', { ascending: false });
  
  if (error) throw error;
  return data;
});

export const uploadMedicalRecord = createAsyncThunk(
  'medicalRecords/uploadRecord',
  async (recordData: Omit<MedicalRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');
    
    const { data, error } = await supabase
      .from('medical_records')
      .insert([{ ...recordData, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

export const uploadPrescription = createAsyncThunk(
  'medicalRecords/uploadPrescription',
  async (prescriptionData: Omit<Prescription, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');
    
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([{ ...prescriptionData, user_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

export const verifyPrescription = createAsyncThunk(
  'medicalRecords/verifyPrescription',
  async (prescriptionId: string) => {
    const { data, error } = await supabase
      .functions
      .invoke('verify-prescription', {
        body: { prescription_id: prescriptionId }
      });
    
    if (error) throw error;
    return data;
  }
);

export const shareRecord = createAsyncThunk(
  'medicalRecords/shareRecord',
  async ({ recordId, sharedWith }: { recordId: string; sharedWith: string[] }) => {
    const { data, error } = await supabase
      .from('medical_records')
      .update({ shared_with: sharedWith })
      .eq('id', recordId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
);

export const deleteMedicalRecord = createAsyncThunk('medicalRecords/deleteRecord', async (id: string) => {
  const { error } = await supabase
    .from('medical_records')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return id;
});

const medicalRecordsSlice = createSlice({
  name: 'medicalRecords',
  initialState,
  reducers: {
    setCurrentRecord: (state, action: PayloadAction<MedicalRecord | null>) => {
      state.currentRecord = action.payload;
    },
    
    updateRecord: (state, action: PayloadAction<MedicalRecord>) => {
      const index = state.records.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Medical Records
      .addCase(fetchMedicalRecords.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMedicalRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload;
      })
      .addCase(fetchMedicalRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch medical records';
      })
      
      // Fetch Prescriptions
      .addCase(fetchPrescriptions.fulfilled, (state, action) => {
        state.prescriptions = action.payload;
      })
      .addCase(fetchPrescriptions.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch prescriptions';
      })
      
      // Upload Medical Record
      .addCase(uploadMedicalRecord.fulfilled, (state, action) => {
        state.records.unshift(action.payload);
      })
      .addCase(uploadMedicalRecord.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to upload medical record';
      })
      
      // Upload Prescription
      .addCase(uploadPrescription.fulfilled, (state, action) => {
        state.prescriptions.unshift(action.payload);
      })
      .addCase(uploadPrescription.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to upload prescription';
      })
      
      // Verify Prescription
      .addCase(verifyPrescription.fulfilled, (state, action) => {
        const prescriptionId = action.payload.prescription_id;
        const prescription = state.prescriptions.find(p => p.id === prescriptionId);
        if (prescription) {
          prescription.status = action.payload.status;
        }
      })
      
      // Share Record
      .addCase(shareRecord.fulfilled, (state, action) => {
        const updatedRecord = action.payload;
        const index = state.records.findIndex(r => r.id === updatedRecord.id);
        if (index !== -1) {
          state.records[index] = updatedRecord;
        }
      })
      .addCase(shareRecord.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to share record';
      })
      
      // Delete Medical Record
      .addCase(deleteMedicalRecord.fulfilled, (state, action) => {
        state.records = state.records.filter(r => r.id !== action.payload);
      })
      .addCase(deleteMedicalRecord.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete record';
      });
  },
});

export const {
  setCurrentRecord,
  updateRecord,
  clearError,
} = medicalRecordsSlice.actions;

export default medicalRecordsSlice.reducer;
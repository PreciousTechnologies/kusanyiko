import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Member } from '../../types';
import { membersAPI } from '../../services/api';

interface MembersState {
  members: Member[];
  currentMember: Member | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  filters: {
    search: string;
    country: string;
    region: string;
    center_area: string;
    gender: string;
    saved: boolean | null;
  };
}

const initialState: MembersState = {
  members: [],
  currentMember: null,
  loading: false,
  error: null,
  totalCount: 0,
  filters: {
    search: '',
    country: '',
    region: '',
    center_area: '',
    gender: '',
    saved: null,
  },
};

// Async thunks
export const fetchMembers = createAsyncThunk(
  'members/fetchMembers',
  async (params: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const response = await membersAPI.getMembers(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch members'
      );
    }
  }
);

export const fetchMember = createAsyncThunk(
  'members/fetchMember',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await membersAPI.getMember(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch member'
      );
    }
  }
);

export const createMember = createAsyncThunk(
  'members/createMember',
  async (data: FormData | Member, { rejectWithValue }) => {
    try {
      const response = await membersAPI.createMember(data);
      return response.data;
    } catch (error: any) {
      // Extract detailed error information
      let errorMessage = 'Failed to create member';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle Django validation errors
        if (errorData.errors) {
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          errorMessage = `Validation errors: ${fieldErrors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateMember = createAsyncThunk(
  'members/updateMember',
  async ({ id, data }: { id: number; data: FormData | Partial<Member> }, { rejectWithValue }) => {
    try {
      const response = await membersAPI.updateMember(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update member'
      );
    }
  }
);

export const deleteMember = createAsyncThunk(
  'members/deleteMember',
  async (id: number, { rejectWithValue }) => {
    try {
      await membersAPI.deleteMember(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete member'
      );
    }
  }
);

// Export members to CSV/Excel
export const exportMembers = createAsyncThunk(
  'members/export',
  async (_, { rejectWithValue }) => {
    try {
      const response = await membersAPI.exportMembers();
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return 'Export successful';
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to export members'
      );
    }
  }
);

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentMember: (state) => {
      state.currentMember = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Members
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both old format (array) and new format (object with results and total_count)
        if (Array.isArray(action.payload)) {
          state.members = action.payload;
          state.totalCount = action.payload.length;
        } else if (action.payload.results) {
          state.members = action.payload.results || [];
          state.totalCount = action.payload.total_count || 0;
        } else {
          state.members = [];
          state.totalCount = 0;
        }
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Member
      .addCase(fetchMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMember.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMember = action.payload;
      })
      .addCase(fetchMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create Member
      .addCase(createMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMember.fulfilled, (state, action) => {
        state.loading = false;
        state.members.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update Member
      .addCase(updateMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMember.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.members.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
        if (state.currentMember?.id === action.payload.id) {
          state.currentMember = action.payload;
        }
      })
      .addCase(updateMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete Member
      .addCase(deleteMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        state.loading = false;
        state.members = state.members.filter(m => m.id !== action.payload);
        state.totalCount -= 1;
        if (state.currentMember?.id === action.payload) {
          state.currentMember = null;
        }
      })
      .addCase(deleteMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Selectors
export const selectFilteredMembers = (
  state: { members: MembersState },
  filters: { search?: string; region?: string; origin?: string }
) => {
  const { members } = state.members;
  
  return members.filter(member => {
    const matchesSearch = !filters.search || 
      `${member.first_name} ${member.middle_name || ''} ${member.last_name}`
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      member.mobile_no.includes(filters.search) ||
      (member.email && member.email.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchesRegion = !filters.region || member.region === filters.region;
    const matchesOrigin = !filters.origin || member.origin === filters.origin;
    
    return matchesSearch && matchesRegion && matchesOrigin;
  });
};

export const { clearError, setFilters, clearCurrentMember } = membersSlice.actions;
export default membersSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AdminStats, RegistrantStats } from '../../types';
import { statsAPI } from '../../services/api';

interface StatsState {
  adminStats: AdminStats | null;
  registrantStats: RegistrantStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: StatsState = {
  adminStats: null,
  registrantStats: null,
  loading: false,
  error: null,
};

// Async thunks
// Pass { silent: true } for background auto-refreshes so the UI doesn't
// flash loading spinners every cycle. Initial loads and manual refreshes
// stay loud (no flag) to give visible feedback.
export const fetchAdminStats = createAsyncThunk(
  'stats/fetchAdminStats',
  async (options: { silent?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await statsAPI.getAdminStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch admin stats'
      );
    }
  }
);

export const fetchRegistrantStats = createAsyncThunk(
  'stats/fetchRegistrantStats',
  async (options: { silent?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await statsAPI.getRegistrantStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch registrant stats'
      );
    }
  }
);

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Admin Stats
      .addCase(fetchAdminStats.pending, (state, action) => {
        // Silent background refreshes must not flash spinners/charts
        if (!action.meta.arg?.silent) {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.adminStats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Registrant Stats
      .addCase(fetchRegistrantStats.pending, (state, action) => {
        // Silent background refreshes must not flash spinners/charts
        if (!action.meta.arg?.silent) {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(fetchRegistrantStats.fulfilled, (state, action) => {
        state.loading = false;
        state.registrantStats = action.payload;
      })
      .addCase(fetchRegistrantStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = statsSlice.actions;
export default statsSlice.reducer;
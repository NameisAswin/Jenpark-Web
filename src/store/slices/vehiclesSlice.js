import { createSlice } from '@reduxjs/toolkit';
import { vehiclesService } from '../../services/vehicles.service';

const initialState = {
  items:   [],
  history: [],
  status:  'idle',   // 'idle' | 'loading' | 'succeeded' | 'failed'
  error:   null,
};

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setItems(state, { payload }) {
      // Normalize: handle { data: [...] } or direct array
      state.items  = Array.isArray(payload) ? payload : payload?.data || [];
      state.status = 'succeeded';
      state.error  = null;
    },
    setHistory(state, { payload }) {
      state.history = Array.isArray(payload) ? payload : payload?.data || [];
    },
    setStatus(state, { payload }) { state.status = payload; },
    setError(state, { payload }) {
      state.error  = payload;
      state.status = 'failed';
    },
    updateItem(state, { payload }) {
      const idx = state.items.findIndex(
        (v) => v._id === payload._id || v.id === payload._id
      );
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload };
    },
    removeItem(state, { payload: id }) {
      state.items = state.items.filter((v) => (v._id || v.id) !== id);
    },
    addItem(state, { payload }) {
      state.items.unshift(payload);
    },
  },
});

export const {
  setItems,
  setHistory,
  setStatus,
  setError,
  updateItem,
  removeItem,
  addItem,
} = vehiclesSlice.actions;

export const selectVehicles = (s) => s.vehicles;

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchVehiclesThunk = () => async (dispatch, getState) => {
  dispatch(setStatus('loading'));
  try {
    const data = await vehiclesService.list();
    const { user } = getState().auth;
    
    // Normalize to array
    const vehiclesArray = Array.isArray(data) ? data : data?.data || [];
    
    // Filter if not admin
    let filtered = vehiclesArray;
    if (user && user.role !== 'admin') {
      filtered = vehiclesArray.filter(v => {
        if (!v.addedBy) return false;
        return v.addedBy._id === user._id || v.addedBy === user._id;
      });
    }
    
    dispatch(setItems(filtered));
  } catch (err) {
    dispatch(setError(err?.response?.data?.message || 'Failed to load vehicles.'));
  }
};

export const checkinVehicleThunk = (payload) => async (dispatch) => {
  try {
    const data = await vehiclesService.checkin(payload);
    const vehicle = data.vehicle || data.data || data;
    dispatch(addItem(vehicle));
    return { success: true, vehicle };
  } catch (err) {
    const msg = err?.response?.data?.details?.[0] || err?.response?.data?.message || 'Check-in failed.';
    return { success: false, error: msg };
  }
};

export const checkoutVehicleThunk = (id) => async (dispatch) => {
  try {
    const data = await vehiclesService.checkout(id);
    const vehicle = data.vehicle || data.data || data;
    dispatch(updateItem({ ...vehicle, _id: id }));
    return { success: true };
  } catch (err) {
    const msg = err?.response?.data?.message || 'Check-out failed.';
    return { success: false, error: msg };
  }
};

export const fetchHistoryThunk = (plate) => async (dispatch) => {
  try {
    const data = await vehiclesService.history(plate);
    dispatch(setHistory(data));
    return { success: true };
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to load history.';
    return { success: false, error: msg };
  }
};

export const updateVehicleThunk = (id, payload) => async (dispatch) => {
  try {
    const data = await vehiclesService.update(id, payload);
    dispatch(updateItem(data.vehicle || data));
    return { success: true, data };
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to update vehicle.';
    return { success: false, error: msg };
  }
};

export const deleteVehicleThunk = (id) => async (dispatch) => {
  try {
    await vehiclesService.remove(id);
    dispatch(removeItem(id));
    return { success: true };
  } catch (err) {
    const msg = err?.response?.data?.message || 'Failed to delete vehicle.';
    return { success: false, error: msg };
  }
};

export default vehiclesSlice.reducer;

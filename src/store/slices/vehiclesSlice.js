import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
};

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setItems(state, { payload }) {
      state.items = payload;
      state.status = 'succeeded';
    },
    setStatus(state, { payload }) {
      state.status = payload;
    },
    setError(state, { payload }) {
      state.error = payload;
      state.status = 'failed';
    },
  },
});

export const { setItems, setStatus, setError } = vehiclesSlice.actions;
export const selectVehicles = (s) => s.vehicles;
export default vehiclesSlice.reducer;

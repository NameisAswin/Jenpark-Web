import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://jenpark-backend-5smq.onrender.com/api/v1';

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from Redux store on every request
api.interceptors.request.use((config) => {
  const { token } = store.getState().auth;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) store.dispatch(logout());
    return Promise.reject(error);
  }
);

export default api;

import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

export const authService = {
  login: (payload) => api.post(ENDPOINTS.auth.login, payload).then((r) => r.data),
  me: () => api.get(ENDPOINTS.auth.me).then((r) => r.data),
};

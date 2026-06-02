import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

export const vehiclesService = {
  list: (params) => api.get(ENDPOINTS.vehicles.list, { params }).then((r) => r.data),
  get: (id) => api.get(ENDPOINTS.vehicles.detail(id)).then((r) => r.data),
};

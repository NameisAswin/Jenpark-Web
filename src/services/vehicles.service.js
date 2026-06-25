import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

export const vehiclesService = {
  list:     ()              => api.get(ENDPOINTS.vehicles.list).then((r) => r.data),
  checkin:  (payload)       => api.post(ENDPOINTS.vehicles.checkin, payload).then((r) => r.data),
  history:  (plate)         => api.get(ENDPOINTS.vehicles.history(plate)).then((r) => r.data),
  checkout: (id)            => api.patch(ENDPOINTS.vehicles.checkout(id)).then((r) => r.data),
  remove:   (id)            => api.delete(ENDPOINTS.vehicles.delete(id)).then((r) => r.data),
  update:   (id, payload)   => api.put(ENDPOINTS.vehicles.update(id), payload).then((r) => r.data),
};

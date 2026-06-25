import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

export const usersService = {
  getAll:  ()              => api.get(ENDPOINTS.users.list).then((r) => r.data),
  create:  (payload)       => api.post(ENDPOINTS.users.create, payload).then((r) => r.data),
  remove:  (id)            => api.delete(ENDPOINTS.users.delete(id)).then((r) => r.data),
  update:  (id, payload)   => api.put(ENDPOINTS.users.update(id), payload).then((r) => r.data),
};

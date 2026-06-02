export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    me: '/auth/me',
  },
  vehicles: {
    list: '/vehicles',
    detail: (id) => `/vehicles/${id}`,
  },
};

export const ENDPOINTS = {
  auth: {
    login:    '/auth/login',
    register: '/auth/register',
    logout:   '/auth/logout',
    profile:  '/auth/profile',
  },
  users: {
    list:      '/users',
    create:    '/users',
    delete:    (id) => `/users/${id}`,
    update:    (id) => `/users/${id}`,
  },
  vehicles: {
    list:     '/vehicles',
    checkin:  '/vehicles',
    history:  (plate) => `/vehicles/history/${plate}`,
    checkout: (id)    => `/vehicles/${id}/checkout`,
    delete:   (id)    => `/vehicles/${id}`,
    update:   (id)    => `/vehicles/${id}`,
  },
};

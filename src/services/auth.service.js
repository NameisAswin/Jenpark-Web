import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

export const authService = {
  login:         (payload) => api.post(ENDPOINTS.auth.login,    payload).then((r) => r.data),
  register:      (payload) => api.post(ENDPOINTS.auth.register, payload).then((r) => r.data),
  logout:        ()        => api.post(ENDPOINTS.auth.logout).then((r) => r.data),
  profile:       ()        => api.get(ENDPOINTS.auth.profile).then((r) => r.data),
  updateProfile: (payload) => {
    const formData = new FormData();
    if (payload.name) formData.append('name', payload.name);
    
    if (payload.profilePicture) {
      if (payload.profilePicture.startsWith('data:image')) {
        const dataURI = payload.profilePicture;
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const dw = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          dw[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const ext = mimeString.split('/')[1] || 'jpeg';
        formData.append('profilePicture', blob, `profile.${ext}`);
      } else {
        formData.append('profilePicture', payload.profilePicture);
      }
    }
    
    return api.put(ENDPOINTS.auth.profile, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((r) => r.data);
  },
};

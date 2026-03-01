import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authApi = {
  login: (credentials: any) => api.post('auth/login', credentials),
  register: (data: any) => api.post('auth/register', data),
  me: () => api.get('auth/me'),
};

export const ridesApi = {
  request: (data: any) => api.post('rides', data),
  get: (id: number) => api.get(`rides/${id}`),
  updateStatus: (id: number, status: string) => api.patch(`rides/${id}/status`, { status }),
  getHistory: () => api.get('rides/history'),
  getNearbyDrivers: (lat: number, lng: number) => api.get(`rides/nearby-drivers?lat=${lat}&lng=${lng}`),
};

export const driversApi = {
  updateStatus: (status: string) => api.patch('drivers/status', { status }),
  getStats: () => api.get('drivers/stats'),
  uploadDocument: (data: FormData) => api.post('drivers/documents', data),
};

export const adminApi = {
  getStats: () => api.get('admin/stats'),
  getUsers: () => api.get('admin/users'),
  getDrivers: () => api.get('admin/drivers'),
  verifyDriver: (id: number, status: string) => api.patch(`admin/drivers/${id}/verify`, { status }),
};

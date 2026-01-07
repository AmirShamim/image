import axios from 'axios';

// In development, Vite proxy handles forwarding to backend
// In production, requests go to same origin
const API_URL = '';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const register = async (email, username, password) => {
  const response = await api.post('/api/auth/register', { email, username, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post('/api/auth/refresh');
  return response.data;
};

// User API calls
export const getProfile = async () => {
  const response = await api.get('/api/users/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/api/users/profile', data);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/api/users/password', { currentPassword, newPassword });
  return response.data;
};

export const deleteAccount = async (password) => {
  const response = await api.delete('/api/users/account', { data: { password } });
  return response.data;
};

export const getImageHistory = async (page = 1, limit = 20) => {
  const response = await api.get(`/api/users/images?page=${page}&limit=${limit}`);
  return response.data;
};

// Profile picture API calls
export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  const response = await api.post('/api/users/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteProfilePicture = async () => {
  const response = await api.delete('/api/users/profile/picture');
  return response.data;
};

// Export the api instance for use in other components
export { api };

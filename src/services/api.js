import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.data?.detail?.includes('Token has expired')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login-json', credentials),
};

export const adminAPI = {
  createFranchise: (franchiseData) => api.post('/admin/franchises', franchiseData),
  getFranchises: () => api.get('/admin/franchises'),
  getFranchisesStatistics: () => api.get('/admin/franchises/statistics'),
  getAllStudents: (params) => api.get('/admin/students', { params }),
  updateStudentStatus: (studentId, status) => api.patch(`/admin/students/${studentId}/status`, { status }),
  getStatistics: () => api.get('/admin/statistics'),
  exportStudentsCSV: (params) => api.get('/admin/students/csv', {
    params,
    responseType: 'blob'
  }),
};

export const franchiseAPI = {
  createStudent: (studentData) => api.post('/franchise/students', studentData),
  getMyStudents: (params) => api.get('/franchise/students', { params }),
  getStatistics: () => api.get('/franchise/statistics'),
  exportStudentsCSV: (params) => api.get('/franchise/students/csv', {
    params,
    responseType: 'blob'
  }),
};

export default api;

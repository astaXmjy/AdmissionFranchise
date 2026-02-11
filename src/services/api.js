import axios from 'axios';

const API_BASE_URL = 'https://admission-franchise-back.vercel.app';

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
  updateFranchise: (id, data) => api.patch(`/admin/franchises/${id}`, data),
  deleteFranchise: (id) => api.delete(`/admin/franchises/${id}`),
  getFranchisesStatistics: () => api.get('/admin/franchises/statistics'),
  getAllStudents: (params) => api.get('/admin/students', { params }),
  updateStudentStatus: (studentId, data) => api.patch(`/admin/students/${studentId}/status`, data),
  updateStudentCommission: (studentId, data) => api.patch(`/admin/students/${studentId}/commission`, data),
  getStatistics: () => api.get('/admin/statistics'),
  exportStudentsCSV: (params) => api.get('/admin/students/csv', {
    params,
    responseType: 'blob'
  }),
  // University management
  getUniversities: () => api.get('/admin/universities'),
  createUniversity: (data) => api.post('/admin/universities', data),
  updateUniversity: (id, data) => api.patch(`/admin/universities/${id}`, data),
  deleteUniversity: (id) => api.delete(`/admin/universities/${id}`),
  // Course management
  getCourses: (params) => api.get('/admin/courses', { params }),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.patch(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  // Fee management
  getFees: (params) => api.get('/admin/fees', { params }),
  createFee: (data) => api.post('/admin/fees', data),
  updateFee: (id, data) => api.patch(`/admin/fees/${id}`, data),
  deleteFee: (id) => api.delete(`/admin/fees/${id}`),
  // Select endpoints for dropdowns
  getUniversitiesSelect: () => api.get('/admin/universities/select'),
  getCoursesSelect: (universityId, degreeType) => api.get(`/admin/courses/select/${universityId}`, { params: degreeType ? { degree_type: degreeType } : {} }),
};

export const franchiseAPI = {
  createStudent: (studentData) => api.post('/franchise/students', studentData),
  getMyStudents: (params) => api.get('/franchise/students', { params }),
  getStatistics: () => api.get('/franchise/statistics'),
  exportStudentsCSV: (params) => api.get('/franchise/students/csv', {
    params,
    responseType: 'blob'
  }),
  getUniversities: () => api.get('/franchise/universities/select'),
  getCoursesByUniversity: (universityId, degreeType) => api.get(`/franchise/courses/select/${universityId}`, { params: degreeType ? { degree_type: degreeType } : {} }),
};

export default api;

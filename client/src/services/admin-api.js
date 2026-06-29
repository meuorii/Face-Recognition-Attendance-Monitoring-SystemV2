import axios from 'axios';

const adminApi = axios.create({
  baseURL: 'http://127.0.0.1:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use(
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

export const adminOverviewService = {
  getOverviewStats: async (program = '') => {
    const response = await adminApi.get('/admin/overview/stats', {
      params: program ? { program } : {},
    });
    return response.data;
  },

  getProgramAttendance: async () => {
    const response = await adminApi.get('/admin/program-attendance');
    return response.data;
  },

  getAttendanceDistribution: async (program = '') => {
    const response = await adminApi.get('/admin/attendance-distribution', {
      params: program ? { program } : {},
    });
    return response.data;
  },

  getTopStudents: async (program = '') => {
    const response = await adminApi.get('/admin/top-students', {
      params: program ? { program } : {},
    });
    return response.data;
  },

  getAttendanceHeatmap: async (program = '') => {
    const response = await adminApi.get('/admin/attendance-heatmap', {
      params: program ? { program } : {},
    });
    return response.data;
  },

  getAtRiskStudents: async (program = '') => {
    const response = await adminApi.get('/admin/at-risk-students', {
      params: program ? { program } : {},
    });
    return response.data;
  },

  getMonthlyComparison: async (program = '') => {
    const response = await adminApi.get('/admin/monthly-comparison', {
      params: program ? { program } : {},
    });
    return response.data;
  },

  getInstructorActivity: async (program = '') => {
    const response = await adminApi.get('/admin/instructor-activity', {
      params: program ? { program } : {},
    });
    return response.data;
  },
};

export default adminOverviewService;
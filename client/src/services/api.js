import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sbkt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sbkt_token');
      localStorage.removeItem('sbkt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// ─── Suppliers ───────────────────────────────────────────────────────────────
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getList: () => api.get('/suppliers/list'),
  getOne: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// ─── Purchases ───────────────────────────────────────────────────────────────
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getOne: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
  uploadBill: (id, formData) => api.post(`/purchases/${id}/bill`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getOne: (id) => api.get(`/inventory/${id}`),
  getTransactions: (id, params) => api.get(`/inventory/${id}/transactions`, { params }),
  createOutward: (data) => api.post('/inventory/outward', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
};

// ─── Employees ───────────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getList: () => api.get('/employees/list'),
  getOne: (id) => api.get(`/employees/${id}`),
  create: (formData) => api.post('/employees', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/employees/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/employees/${id}`),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getDaily: (date) => api.get('/attendance/daily', { params: { date } }),
  getMonthlySummary: (params) => api.get('/attendance/monthly-summary', { params }),
  mark: (records) => api.post('/attendance', { records }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
};

// ─── Salary ───────────────────────────────────────────────────────────────────
export const salaryAPI = {
  getAll: (params) => api.get('/salary', { params }),
  getOne: (id) => api.get(`/salary/${id}`),
  generate: (data) => api.post('/salary/generate', data),
  approve: (id) => api.put(`/salary/${id}/approve`),
  markPaid: (id) => api.put(`/salary/${id}/pay`),
};

// ─── Advances ────────────────────────────────────────────────────────────────
export const advanceAPI = {
  getAll: (params) => api.get('/advances', { params }),
  create: (data) => api.post('/advances', data),
  update: (id, data) => api.put(`/advances/${id}`, data),
  delete: (id) => api.delete(`/advances/${id}`),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsAPI = {
  purchases: (params) => api.get('/reports/purchases', { params }),
  attendance: (params) => api.get('/reports/attendance', { params }),
  salary: (params) => api.get('/reports/salary', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
  downloadExcel: (type, params) => api.get(`/reports/${type}`, {
    params: { ...params, format: 'xlsx' },
    responseType: 'blob',
  }),
};

// ─── Uploads ───────────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadPurchaseBill: (formData) => api.post('/uploads/purchase-bill', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadEmployeeDocument: (formData) => api.post('/uploads/employee-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteFile: (fileId) => api.delete(`/uploads/${fileId}`),
  // File viewing uses the token, so we can fetch it as a blob
  viewFile: (fileId) => api.get(`/uploads/view/${fileId}`, { responseType: 'blob' }),
};

export default api;

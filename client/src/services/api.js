import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SERVER_HOST_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SERVER_HOST_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config.url.includes('/auth/login');
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// API SERVICES
// ==========================================

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const userService = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUserStatus: (id, data) => api.put(`/users/${id}/status`, data),
  getPendingStudents: (params) => api.get('/users/pending-students', { params }),
  approveStudent: (id) => api.put(`/users/${id}/approve`),
  rejectStudent: (id, data) => api.put(`/users/${id}/reject`, data),
  suspendUser: (id, data) => api.put(`/users/${id}/suspend`, data),
};

export const locationService = {
  getAllLocations: (params) => api.get('/locations', { params }),
  getLocationById: (id) => api.get(`/locations/${id}`),
  getLocationByQr: (code) => api.get(`/locations/qr/${code}`),
  createLocation: (data) => api.post('/locations', data),
  updateLocation: (id, data) => api.put(`/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/locations/${id}`),
};

export const complaintService = {
  getAllComplaints: (params) => api.get('/complaints', { params }),
  getMyComplaints: () => api.get('/complaints/my'),
  getComplaintById: (id) => api.get(`/complaints/${id}`),
  createComplaint: (formData) =>
    api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  assignStaff: (id, data) => api.put(`/complaints/${id}/assign`, data),
};

export const eventService = {
  getAllEvents: (params) => api.get('/events', { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  registerForEvent: (id) => api.post(`/events/${id}/register`),
  cancelRegistration: (id) => api.delete(`/events/${id}/register`),
  getMyRegistrations: () => api.get('/events/my-registrations'),
  getEventAttendees: (id) => api.get(`/events/${id}/attendees`),
};

export const bookingService = {
  getAllBookings: (params) => api.get('/bookings', { params }),
  getMyBookings: () => api.get('/bookings/my'),
  getSectionBookingSummary: () => api.get('/bookings/section-summary'),
  createBooking: (data) => api.post('/bookings', data),
  updateBookingStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  cancelBooking: (id) => api.put(`/bookings/${id}/cancel`),
};

export const lostFoundService = {
  getAllItems: (params) => api.get('/lost-found', { params }),
  getMyItems: () => api.get('/lost-found/my'),
  getItemById: (id) => api.get(`/lost-found/${id}`),
  createItem: (data) => api.post('/lost-found', data),
  claimItem: (id, data) => api.put(`/lost-found/${id}/claim`, data),
  updateItemStatus: (id, data) => api.put(`/lost-found/${id}/status`, data),
  deleteItem: (id) => api.delete(`/lost-found/${id}`),
};

export const announcementService = {
  getAllAnnouncements: (params) => api.get('/announcements', { params }),
  getAnnouncementById: (id) => api.get(`/announcements/${id}`),
  createAnnouncement: (data) => api.post('/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
};

export const notificationService = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export const analyticsService = {
  getAdminStats: () => api.get('/analytics/admin-stats'),
  getComplaintMetrics: () => api.get('/analytics/complaint-metrics'),
  getFacultySummary: () => api.get('/analytics/faculty-summary'),
};

export default api;


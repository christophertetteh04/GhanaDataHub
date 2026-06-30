import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({ baseURL: API_BASE });

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          err.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(err.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  register: (d) => api.post("/auth/register", d),
  login: (d) => api.post("/auth/login", d),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: (d) => api.post("/auth/refresh", d),
};

// Datasets
export const datasetsApi = {
  list: (params) => api.get("/datasets/", { params }),
  get: (id) => api.get(`/datasets/${id}`),
  create: (formData) => api.post("/datasets/", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/datasets/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id) => api.delete(`/datasets/${id}`),
  versions: (id) => api.get(`/datasets/${id}/versions`),
};

// Search
export const searchApi = {
  search: (params) => api.get("/search/", { params }),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get("/dashboard/"),
};

// Organizations
export const orgsApi = {
  list: () => api.get("/organizations/"),
  create: (d) => api.post("/organizations/", d),
  get: (id) => api.get(`/organizations/${id}`),
  members: (id) => api.get(`/organizations/${id}/members`),
  invite: (id, d) => api.post(`/organizations/${id}/invite`, d),
  removeMember: (orgId, userId) => api.delete(`/organizations/${orgId}/members/${userId}`),
};

// Users
export const usersApi = {
  list: (params) => api.get("/users/", { params }),
  get: (id) => api.get(`/users/${id}`),
  updateMe: (d) => api.put("/users/me", d),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  suspend: (id) => api.patch(`/users/${id}/suspend`),
  reactivate: (id) => api.patch(`/users/${id}/reactivate`),
};

// Categories
export const categoriesApi = {
  list: () => api.get("/categories/"),
  create: (d) => api.post("/categories/", d),
};

// Notifications
export const notifApi = {
  list: () => api.get("/notifications/"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

// Share
export const shareApi = {
  create: (d) => api.post("/share/", d),
  access: (token) => api.get(`/share/access/${token}`),
  revoke: (id) => api.delete(`/share/${id}`),
};

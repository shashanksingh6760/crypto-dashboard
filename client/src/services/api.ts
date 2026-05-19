import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ─── Market ──────────────────────────────────────────────────
export const marketApi = {
  getMarketData: (params?: { vs_currency?: string; per_page?: number; page?: number }) =>
    api.get('/market', { params }),
  getCoinDetails: (coinId: string) =>
    api.get(`/market/${coinId}`),
  getPriceHistory: (coinId: string, days: number = 30) =>
    api.get(`/market/${coinId}/history`, { params: { days } }),
  getGlobalData: () =>
    api.get('/market/global'),
  getTrendingCoins: () =>
    api.get('/market/trending'),
};

// ─── Portfolio ───────────────────────────────────────────────
export const portfolioApi = {
  getAll: () => api.get('/portfolios'),
  getById: (id: string) => api.get(`/portfolios/${id}`),
  create: (data: { name: string }) => api.post('/portfolios', data),
  delete: (id: string) => api.delete(`/portfolios/${id}`),
  addHolding: (portfolioId: string, data: {
    coinId: string; symbol: string; name: string; quantity: number; avgBuyPrice: number;
  }) => api.post(`/portfolios/${portfolioId}/holdings`, data),
  removeHolding: (portfolioId: string, holdingId: string) =>
    api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`),
};

// ─── Alerts ──────────────────────────────────────────────────
export const alertApi = {
  getAll: () => api.get('/alerts'),
  create: (data: { coinId: string; symbol: string; targetPrice: number; condition: 'ABOVE' | 'BELOW' }) =>
    api.post('/alerts', data),
  delete: (id: string) => api.delete(`/alerts/${id}`),
  toggle: (id: string) => api.patch(`/alerts/${id}/toggle`),
};

export default api;

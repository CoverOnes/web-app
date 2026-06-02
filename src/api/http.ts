import axios, { type AxiosInstance, AxiosError } from 'axios';
import { generateRequestId } from '../utils/requestId';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://chat-gateway-1.onrender.com/api/v1';

/**
 * 創建 HTTP 客戶端實例
 */
const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 請求攔截器：自動添加認證 token (未來整合 User 服務時使用)
  client.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['X-Request-ID'] = generateRequestId();
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 回應攔截器：統一錯誤處理
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // 未授權：清除 token 並導向登入頁
        sessionStorage.removeItem('auth_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (error.response?.status === 429) {
        // Rate Limiting
        console.warn('請求過於頻繁，請稍後再試');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const http = createHttpClient();
export default http;


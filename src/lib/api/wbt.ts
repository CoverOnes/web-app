import axios from 'axios';

const WBT_API_BASE_URL = import.meta.env.VITE_WBT_API_URL || 'http://localhost:8080/api';

export const wbtHttp = axios.create({
  baseURL: WBT_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default wbtHttp;

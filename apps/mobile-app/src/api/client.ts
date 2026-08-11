// ============================================================
// API Configuration
//
// Central Axios instance that connects to our NGINX gateway.
// All API calls flow through this single configured instance.
// ============================================================
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// For a real device replace with your machine's local IP
// e.g. 'http://192.168.1.10'
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
    }
    return Promise.reject(error);
  }
);

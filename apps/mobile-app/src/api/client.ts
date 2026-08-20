// ============================================================
// API Configuration
//
// Central Axios instance that connects to our NGINX gateway.
// All API calls flow through this single configured instance.
// ============================================================
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// For a real device replace with your machine's local IP
// e.g. 'http://192.168.1.10'
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}`,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh request itself fails with 401
    if (error.response?.status === 401 && originalRequest.url === "/auth/refresh") {
      await SecureStore.deleteItemAsync("accessToken");
      try {
        const { useAuthStore } = require("../store/authStore");
        useAuthStore.setState({ token: null, user: null });
      } catch (e) {
        // dynamic require fallback
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        apiClient
          .post("/auth/refresh", {})
          .then(async (res) => {
            const newAccessToken = res.data?.data?.accessToken;
            if (!newAccessToken) {
              throw new Error("No access token returned from refresh");
            }
            await SecureStore.setItemAsync("accessToken", newAccessToken);
            
            try {
              const { useAuthStore } = require("../store/authStore");
              useAuthStore.setState({ token: newAccessToken });
            } catch (e) {
              // dynamic require fallback
            }

            apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            
            processQueue(null, newAccessToken);
            resolve(apiClient(originalRequest));
          })
          .catch(async (err) => {
            processQueue(err, null);
            await SecureStore.deleteItemAsync("accessToken");
            try {
              const { useAuthStore } = require("../store/authStore");
              useAuthStore.setState({ token: null, user: null });
            } catch (e) {
              // dynamic require fallback
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  },
);

// ============================================================
// Auth API
//
// All authentication-related API calls routed via NGINX to
// the auth-service. Clean, typed request/response boundaries.
// ============================================================
import { apiClient } from './client';

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  sub: string;
  email: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  userId: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

const AUTH_BASE = '/auth';

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient
      .post<{ success: boolean; data: RegisterResponse }>(`${AUTH_BASE}/register`, payload)
      .then((r) => r.data.data),

  login: (payload: LoginPayload) =>
    apiClient
      .post<{ success: boolean; data: AuthTokens }>(`${AUTH_BASE}/login`, payload)
      .then((r) => r.data.data),

  me: () =>
    apiClient
      .get<{ success: boolean; data: UserProfile }>(`${AUTH_BASE}/me`)
      .then((r) => r.data.data),

  logout: () =>
    apiClient.post(`${AUTH_BASE}/logout`),

  refresh: (refreshToken: string) =>
    apiClient
      .post<{ success: boolean; data: AuthTokens }>(
        `${AUTH_BASE}/refresh`,
        {},
        { headers: { Cookie: `refreshToken=${refreshToken}` } }
      )
      .then((r) => r.data.data),
};

// ============================================================
// Auth Store (Zustand)
//
// Single source of truth for authentication state.
// Persists access token via expo-secure-store.
// Follows SOLID - SRP: only handles auth-related state.
// ============================================================
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authApi, UserProfile } from "@/api/authApi";

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // --- State ---
  token: null,
  user: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  // --- Actions ---
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (token) {
        set({ token });
        await get().fetchProfile();
      }
    } catch {
      // token may be expired, that's fine
    } finally {
      set({ isHydrated: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login({ email, password });
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      set({ token: data.accessToken });
      await get().fetchProfile();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      const message =
        error.response?.data?.error?.message ??
        "Login failed. Please try again.";
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register({ email, username, password });
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      const message =
        error.response?.data?.error?.message ??
        "Registration failed. Please try again.";
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
      // Even if server logout fails, clear local state
    } finally {
      await SecureStore.deleteItemAsync("accessToken");
      set({ token: null, user: null, isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const user = await authApi.me();
      set({ user });
    } catch {
      set({ user: null });
    }
  },

  clearError: () => set({ error: null }),
}));

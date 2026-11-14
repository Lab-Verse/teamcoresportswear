import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});
let refreshing: Promise<string> | null = null;
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && "data" in body)
      response.data = body.data;
    return response;
  },
  async (error) => {
    const request = error.config;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      request.url?.startsWith("/auth/")
    )
      return Promise.reject(error);
    request._retry = true;
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }
    if (!refreshing) {
      const identity = useAuthStore.getState().user?.id;
      refreshing = axios
        .post(`${BASE_URL}/auth/refresh`, { refreshToken })
        .then(({ data }) => {
          const value = data?.data ?? data;
          if (
            useAuthStore.getState().user?.id !== identity ||
            useAuthStore.getState().refreshToken !== refreshToken
          )
            throw new Error("Session changed");
          useAuthStore
            .getState()
            .setTokens(value.accessToken, value.refreshToken);
          return value.accessToken as string;
        })
        .finally(() => {
          refreshing = null;
        });
    }
    try {
      const token = await refreshing;
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch {
      if (useAuthStore.getState().refreshToken === refreshToken)
        useAuthStore.getState().logout();
      return Promise.reject(error);
    }
  },
);
export default api;

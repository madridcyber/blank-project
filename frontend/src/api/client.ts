import axios from 'axios';
import { useAuth } from '../state/AuthContext';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const api = axios.create({
  baseURL
});

export function attachInterceptors(getToken: () => string | null, getTenant: () => string | null) {
  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenant = getTenant();
    if (tenant) {
      config.headers = config.headers ?? {};
      (config.headers as any)['X-Tenant-Id'] = tenant;
    }
    return config;
  });
}

// Helper hook to ensure interceptors wired once
let interceptorsAttached = false;
export function useConfiguredApi() {
  const { token, tenantId } = useAuth();
  if (!interceptorsAttached) {
    attachInterceptors(() => token, () => tenantId);
    interceptorsAttached = true;
  }
  return api;
}
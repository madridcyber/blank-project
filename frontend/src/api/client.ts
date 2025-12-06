import axios from 'axios';

const apiBase =
  typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL
    ? (import.meta as any).env.VITE_API_BASE_URL
    : 'http://localhost:8080';

export const api = axios.create({
  baseURL: apiBase
});

let currentToken: string | null = null;
let currentTenantId: string | null = null;

/**
 * Called by the AuthProvider whenever authentication state changes so that
 * outgoing requests always carry the latest JWT and tenant id.
 */
export function setAuthContext(token: string | null, tenantId: string | null) {
  currentToken = token;
  currentTenantId = tenantId;
}

// Attach a single interceptor that always reads the latest auth context.
api.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = {};
  }
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  if (currentTenantId) {
    (config.headers as any)['X-Tenant-Id'] = currentTenantId;
  }
  return config;
});

export function useConfiguredApi() {
  return api;
}
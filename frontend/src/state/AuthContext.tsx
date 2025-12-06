import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextValue = {
  token: string | null;
  role: string | null;
  tenantId: string | null;
  userId: string | null;
  login: (token: string, tenantId: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValuetextValue | undefined&gt;(undefined);

function decodeJwt(token: string): any | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sup_token');
    const storedTenant = localStorage.getItem('sup_tenant');
    if (stored) {
      setToken(stored);
      const payload = decodeJwt(stored);
      setRole(payload?.role ?? null);
      setUserId(payload?.sub ?? null);
      setTenantId(storedTenant ?? payload?.tenant ?? null);
    }
  }, []);

  const login = (newToken: string, explicitTenant: string | null) => {
    setToken(newToken);
    localStorage.setItem('sup_token', newToken);
    const payload = decodeJwt(newToken);
    const resolvedTenant = explicitTenant ?? payload?.tenant ?? null;
    if (resolvedTenant) {
      localStorage.setItem('sup_tenant', resolvedTenant);
    }
    setTenantId(resolvedTenant);
    setRole(payload?.role ?? null);
    setUserId(payload?.sub ?? null);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setTenantId(null);
    setUserId(null);
    localStorage.removeItem('sup_token');
    localStorage.removeItem('sup_tenant');
  };

  const value: AuthContextValue = {
    token,
    role,
    tenantId,
    userId,
    login,
    logout
  };

  return &lt;AuthContext.Provider value={value}&gt;{children}&lt;/AuthContext.Provider&gt;;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
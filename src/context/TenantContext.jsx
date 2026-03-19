import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(localStorage.getItem('tenantId') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const selectTenant = (newTenantId) => {
    setTenantId(newTenantId);
    localStorage.setItem('tenantId', newTenantId);
    // Clearing token when changing tenant
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // We optionally keep tenantId selected
    setUser(null);
  };

  const clearTenant = () => {
    localStorage.removeItem('tenantId');
    setTenantId(null);
    logout();
  };

  useEffect(() => {
    // If we have a user but no tenantId somehow, clear login
    if (user && !tenantId) {
      logout();
    }
  }, [user, tenantId]);

  return (
    <TenantContext.Provider value={{ tenantId, selectTenant, clearTenant, user, login, logout }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);

import React, { createContext, useContext, useState } from 'react';
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
  };

  const login = async (identifier, password, roleType = 'user') => {
    try {
      if (roleType === 'admin') {
        const res = await api.adminLogin(identifier, password);
        if (res.success && res.token) {
          // Normalize the response to match the user API format
          const adminData = { email: identifier, role: 'admin', name: 'Master Admin', token: res.token };
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(adminData));
          setUser(adminData);
          return { success: true, data: adminData };
        }
        throw new Error(res.message || 'Admin login failed');
      } else {
        const res = await api.login(identifier, password);
        if (res.success && res.data) {
          const userData = res.data;
          localStorage.setItem('token', userData.token);
          localStorage.setItem('user', JSON.stringify(userData));
          // ✅ CRITICAL FIX: Save university code as tenantId for all subsequent API calls
          if (userData.university) {
            localStorage.setItem('tenantId', userData.university);
            setTenantId(userData.university);
            console.log('[TENANT] tenantId set from login:', userData.university);
          }
          setUser(userData);
          return res;
        }
        throw new Error(res.message || 'User login failed');
      }
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setTenantId(null);
    window.location.href = '/login';
  };

  const clearTenant = () => {
    localStorage.removeItem('tenantId');
    setTenantId(null);
  };

  return (
    <TenantContext.Provider value={{ 
      tenantId, 
      selectTenant, 
      clearTenant, 
      user, 
      login, 
      logout 
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);

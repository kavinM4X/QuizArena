import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem('qa_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('qa_admin_token') || null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', { email, password });
      if (data.success) {
        localStorage.setItem('qa_admin_token', data.token);
        localStorage.setItem('qa_admin_user', JSON.stringify(data.admin));
        setToken(data.token);
        setAdmin(data.admin);
        toast.success(`Welcome back, ${data.admin.name}!`);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/admin/register', { name, email, password });
      if (data.success) {
        localStorage.setItem('qa_admin_token', data.token);
        localStorage.setItem('qa_admin_user', JSON.stringify(data.admin));
        setToken(data.token);
        setAdmin(data.admin);
        toast.success('Account created successfully!');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('qa_admin_token');
    localStorage.removeItem('qa_admin_user');
    setToken(null);
    setAdmin(null);
    toast.success('Logged out.');
  };

  const isAuthenticated = !!token && !!admin;

  return (
    <AuthContext.Provider value={{ admin, token, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

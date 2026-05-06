import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    const token = localStorage.getItem('admin_token');
    if (stored && token) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  async function login(username, password) {
    const data = await api.login(username, password);
    if (data.user.role !== 'admin') throw new Error('Admin access required');
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  }

  return { user, loading, login, logout };
}

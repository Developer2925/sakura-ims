import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { storage } from './storage';
import { API_URL } from './config';
import { setSessionExpiredHandler } from './sessionStore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([
          storage.get('auth_token'),
          storage.get('auth_user'),
        ]);
        setToken(t);
        setUser(u);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(username, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid credentials');
    await Promise.all([storage.set('auth_token', data.token), storage.set('auth_user', data.user)]);
    setToken(data.token);
    setUser(data.user);
  }

  async function logout() {
    await Promise.all([storage.remove('auth_token'), storage.remove('auth_user')]);
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    setSessionExpiredHandler(async () => {
      await Promise.all([storage.remove('auth_token'), storage.remove('auth_user')]);
      setToken(null);
      setUser(null);
      router.replace('/(auth)/login');
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { storage } from './storage';
import { API_URL } from './config';
import { setSessionExpiredHandler } from './sessionStore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([storage.get('auth_token'), storage.get('auth_user')]);
        setToken(t);
        setUser(u);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function _persist(data) {
    await Promise.all([storage.set('auth_token', data.token), storage.set('auth_user', data.user)]);
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid credentials');
    await _persist(data);
  }

  async function requestOTP(firstName, lastName, email, password, confirmPassword, position, organizationName) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email: email.trim().toLowerCase(), password, confirmPassword, position, organizationName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
  }

  async function verifyOTP(email, otp) {
    const res = await fetch(`${API_URL}/auth/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    await _persist(data);
  }

  async function requestEmailChange(newEmail) {
    const t = await storage.get('auth_token');
    const res = await fetch(`${API_URL}/auth/profile/request-email-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ newEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
  }

  async function verifyEmailChange(otp) {
    const t = await storage.get('auth_token');
    const res = await fetch(`${API_URL}/auth/profile/verify-email-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    await _persist(data);
  }

  async function updatePassword(currentPassword, newPassword) {
    const t = await storage.get('auth_token');
    const res = await fetch(`${API_URL}/auth/profile/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update password');
  }

  async function googleLogin(idToken) {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google sign-in failed');
    if (data.newUser) return data; // caller handles onboarding
    await _persist(data);
    return data;
  }

  async function googleComplete(payload) {
    const res = await fetch(`${API_URL}/auth/google/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to complete registration');
    await _persist(data);
  }

  async function logout() {
    await Promise.all([storage.remove('auth_token'), storage.remove('auth_user')]);
    setToken(null);
    setUser(null);
    try { await GoogleSignin.signOut(); } catch (_) {}
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
    <AuthContext.Provider value={{
      user, token, loading,
      login, googleLogin, googleComplete,
      requestOTP, verifyOTP,
      requestEmailChange, verifyEmailChange,
      updatePassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

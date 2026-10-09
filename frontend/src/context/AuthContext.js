'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const d = await api.post('/auth/login', { username, password });
    setUser(d.user);
    router.push('/dashboard');
  };
  const register = async (nama, username, password) => {
    const d = await api.post('/auth/register', { nama, username, password });
    setUser(d.user);
    router.push('/dashboard');
  };
  const logout = async () => {
    await api.post('/auth/logout', {}).catch(() => {});
    setUser(null);
    router.push('/login');
  };
  return <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}

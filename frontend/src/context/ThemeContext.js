'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

const KEY = 'kassave_theme_v1';

function getInitial() {
  if (typeof window === 'undefined') return 'light';
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark') return v;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {}
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(getInitial());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0C2038' : '#EFF3ED');
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
}

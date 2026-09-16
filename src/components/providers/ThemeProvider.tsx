'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('kura-theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored);
      const resolved = resolveTheme(stored);
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    } else {
      const resolved = resolveTheme('system');
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange() {
      if (theme === 'system') {
        const isDark = mediaQuery.matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', isDark);
      }
    }
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [theme, mounted]);

  function handleSetTheme(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem('kura-theme', newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: handleSetTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

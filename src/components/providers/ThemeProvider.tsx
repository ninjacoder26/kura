'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('kura-theme') as Theme | null;
  if (stored && ['light', 'dark', 'system'].includes(stored)) return stored;
  return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = localStorage.getItem('kura-theme') as Theme | null;
    const effective = stored || 'system';
    const isDark = effective === 'dark' || (effective === 'system' && mediaQuery.matches);
    return isDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function resolve() {
      const isDark =
        theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      setResolvedTheme(isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    }

    resolve();
    mediaQuery.addEventListener('change', resolve);
    return () => mediaQuery.removeEventListener('change', resolve);
  }, [theme]);

  function handleSetTheme(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem('kura-theme', newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

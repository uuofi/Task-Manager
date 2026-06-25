import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'taskcontrol-theme';

const ThemeContext = createContext(undefined);

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

/**
 * Provides theme state ('light' | 'dark' | 'system') with persistence and
 * applies the resolved theme as a class on <html>.
 */
export function ThemeProvider({ children, defaultTheme = 'system' }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || defaultTheme,
  );

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // React to OS theme changes when in "system" mode.
  useEffect(() => {
    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(getSystemTheme());
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const value = useMemo(() => {
    const setTheme = (next) => {
      localStorage.setItem(STORAGE_KEY, next);
      setThemeState(next);
    };
    const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    return { theme, resolvedTheme, setTheme, toggleTheme };
  }, [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

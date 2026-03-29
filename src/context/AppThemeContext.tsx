import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type Mode = 'dark' | 'light';

interface AppThemeContextType {
  mode: Mode;
  toggleMode: () => void;
  isLanding: boolean;
  isAdmin: boolean;
}

const AppThemeContext = createContext<AppThemeContextType>({
  mode: 'dark',
  toggleMode: () => {},
  isLanding: false,
  isAdmin: false,
});

export const useAppTheme = () => useContext(AppThemeContext);

const STORAGE_KEY = 'takhayal-theme';

function applyTheme(mode: Mode) {
  document.documentElement.setAttribute('data-theme', mode);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');

  const [userMode, setUserMode] = useState<Mode>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Mode) || 'dark';
  });

  // Determine effective mode
  const effectiveMode: Mode = isLanding ? 'light' : isAdmin ? 'dark' : userMode;

  // Apply on route change or mode change
  useEffect(() => {
    applyTheme(effectiveMode);
  }, [effectiveMode]);

  const toggleMode = useCallback(() => {
    setUserMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <AppThemeContext.Provider value={{ mode: effectiveMode, toggleMode, isLanding, isAdmin }}>
      {children}
    </AppThemeContext.Provider>
  );
}

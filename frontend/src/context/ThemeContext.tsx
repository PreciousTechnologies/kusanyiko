import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'mint' | 'brown' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
}

const THEME_STORAGE_KEY = 'efatha.theme';

export function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('theme-mint', 'theme-brown', 'theme-dark', 'dark');

  if (theme === 'mint') {
    root.classList.add('theme-mint');
  } else if (theme === 'brown') {
    root.classList.add('theme-brown', 'dark');
  } else if (theme === 'dark') {
    root.classList.add('theme-dark', 'dark');
  }
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    return saved === 'brown' || saved === 'dark' || saved === 'mint' ? saved : 'mint';
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
    applyThemeClass(t);
  };

  const cycleTheme = () => {
    if (theme === 'mint') setTheme('brown');
    else if (theme === 'brown') setTheme('dark');
    else setTheme('mint');
  };

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

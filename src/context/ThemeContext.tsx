import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode =
  | 'light'
  | 'dark'
  | 'night-blue'
  | 'cream'
  | 'charcoal'
  | 'forest';

export interface ThemeModeOption {
  id: ThemeMode;
  label: string;
  shortLabel: string;
  swatchBg: string;
  swatchAccent: string;
  isDarkSurface: boolean;
}

export const THEME_MODE_OPTIONS: ThemeModeOption[] = [
  {
    id: 'light',
    label: 'Light Mode',
    shortLabel: 'Light',
    swatchBg: '#F8FAFC',
    swatchAccent: '#F97316',
    isDarkSurface: false
  },
  {
    id: 'dark',
    label: 'Black Mode',
    shortLabel: 'Black',
    swatchBg: '#000000',
    swatchAccent: '#F97316',
    isDarkSurface: true
  },
  {
    id: 'night-blue',
    label: 'Night Blue',
    shortLabel: 'Night Blue',
    swatchBg: '#0A1628',
    swatchAccent: '#38BDF8',
    isDarkSurface: true
  },
  {
    id: 'cream',
    label: 'Cream Mode',
    shortLabel: 'Cream',
    swatchBg: '#F7F1E3',
    swatchAccent: '#D97706',
    isDarkSurface: false
  },
  {
    id: 'charcoal',
    label: 'Charcoal Mode',
    shortLabel: 'Charcoal',
    swatchBg: '#161920',
    swatchAccent: '#F97316',
    isDarkSurface: true
  },
  {
    id: 'forest',
    label: 'Emerald Night',
    shortLabel: 'Forest',
    swatchBg: '#071712',
    swatchAccent: '#10B981',
    isDarkSurface: true
  }
];

interface ThemeContextType {
  theme: ThemeMode;
  currentThemeOption: ThemeModeOption;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'innovista_system_theme_v1';

const VALID_THEMES: ThemeMode[] = [
  'light',
  'dark',
  'night-blue',
  'cream',
  'charcoal',
  'forest'
];

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  currentThemeOption: THEME_MODE_OPTIONS[0],
  isDarkMode: false,
  toggleDarkMode: () => {},
  setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved && VALID_THEMES.includes(saved)) return saved;
    } catch {}
    return 'light';
  });

  const currentThemeOption =
    THEME_MODE_OPTIONS.find(o => o.id === theme) || THEME_MODE_OPTIONS[0];

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes first
    const allThemeClasses = [
      'dark',
      'theme-light',
      'theme-dark',
      'theme-night-blue',
      'theme-cream',
      'theme-charcoal',
      'theme-forest'
    ];
    root.classList.remove(...allThemeClasses);
    body.classList.remove(...allThemeClasses);

    // Apply current theme class
    const activeClass = `theme-${theme}`;
    root.classList.add(activeClass);
    body.classList.add(activeClass);

    // Also add .dark class for dark-surface themes so Tailwind dark: variants & dark logos activate
    if (currentThemeOption.isDarkSurface) {
      root.classList.add('dark');
      body.classList.add('dark');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme, currentThemeOption.isDarkSurface]);

  const toggleDarkMode = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentThemeOption,
        isDarkMode: currentThemeOption.isDarkSurface,
        toggleDarkMode,
        setTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

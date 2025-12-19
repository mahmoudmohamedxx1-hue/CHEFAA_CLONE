import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system' | 'highContrast';
type FontSize = 'small' | 'medium' | 'large' | 'x-large';
type ContrastMode = 'normal' | 'high';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  fontSize: FontSize;
  contrastMode: ContrastMode;
  reduceMotion: boolean;
  enhanceContrast: boolean;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setContrastMode: (mode: ContrastMode) => void;
  setReduceMotion: (reduce: boolean) => void;
  setEnhanceContrast: (enhance: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'system';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const stored = localStorage.getItem('fontSize') as FontSize;
    return stored || 'medium';
  });

  const [contrastMode, setContrastModeState] = useState<ContrastMode>(() => {
    const stored = localStorage.getItem('contrastMode') as ContrastMode;
    return stored || 'normal';
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    const stored = localStorage.getItem('reduceMotion');
    return stored ? JSON.parse(stored) : false;
  });

  const [enhanceContrast, setEnhanceContrastState] = useState<boolean>(() => {
    const stored = localStorage.getItem('enhanceContrast');
    return stored ? JSON.parse(stored) : false;
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Determine actual theme based on system preference
  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'system' || theme === 'highContrast') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(theme === 'highContrast' ? 'dark' : (systemPrefersDark ? 'dark' : 'light'));
      } else {
        setActualTheme(theme as 'light' | 'dark');
      }
    };

    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Theme
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(theme === 'highContrast' ? 'high-contrast' : actualTheme);
    
    // Font size
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-x-large');
    root.classList.add(`text-${fontSize}`);
    
    // Contrast mode
    root.classList.remove('contrast-normal', 'contrast-high');
    root.classList.add(`contrast-${contrastMode}`);
    
    // Reduce motion
    if (reduceMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.classList.add('reduce-motion');
    } else {
      root.style.removeProperty('--animation-duration');
      root.classList.remove('reduce-motion');
    }
    
    // Enhance contrast
    if (enhanceContrast) {
      root.classList.add('enhanced-contrast');
    } else {
      root.classList.remove('enhanced-contrast');
    }
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const themeColor = theme === 'highContrast' ? '#000000' : (actualTheme === 'dark' ? '#1f2937' : '#ffffff');
      metaThemeColor.setAttribute('content', themeColor);
    }
  }, [actualTheme, fontSize, contrastMode, reduceMotion, enhanceContrast, theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size);
  };

  const setContrastMode = (mode: ContrastMode) => {
    setContrastModeState(mode);
    localStorage.setItem('contrastMode', mode);
  };

  const setReduceMotion = (reduce: boolean) => {
    setReduceMotionState(reduce);
    localStorage.setItem('reduceMotion', JSON.stringify(reduce));
  };

  const setEnhanceContrast = (enhance: boolean) => {
    setEnhanceContrastState(enhance);
    localStorage.setItem('enhanceContrast', JSON.stringify(enhance));
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else if (theme === 'system') {
      setTheme('highContrast');
    } else {
      setTheme('light');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        actualTheme,
        fontSize,
        contrastMode,
        reduceMotion,
        enhanceContrast,
        setTheme,
        setFontSize,
        setContrastMode,
        setReduceMotion,
        setEnhanceContrast,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

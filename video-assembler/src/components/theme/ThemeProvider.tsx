import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeContextType, createTheme, createCSSCustomProperties } from '../../theme';
import { useUI } from '../../context/AppContext';

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ui = useUI();
  const [isDark, setIsDark] = useState(() => {
    if (ui.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return ui.theme === 'dark';
  });

  const [theme, setTheme] = useState<Theme>(() => createTheme(isDark));

  // Handle system theme changes
  useEffect(() => {
    if (ui.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      setTheme(createTheme(e.matches));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [ui.theme]);

  // Update theme when dark mode changes
  useEffect(() => {
    setTheme(createTheme(isDark));
  }, [isDark]);

  // Apply theme CSS custom properties
  useEffect(() => {
    const properties = createCSSCustomProperties(theme);
    const root = document.documentElement;

    Object.entries(properties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Set data-theme attribute for Tailwind
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Add/remove dark mode class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isDark]);

  const toggleTheme = () => {
    if (ui.theme === 'system') {
      // If system theme, switch to explicit light/dark
      const newTheme = isDark ? 'light' : 'dark';
      ui.setTheme(newTheme);
      setIsDark(newTheme === 'dark');
    } else {
      // If explicit theme, toggle between light/dark
      const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
      ui.setTheme(newTheme);
      setIsDark(newTheme === 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-aware component wrapper
export function withTheme<P extends object>(
  WrappedComponent: React.ComponentType<P & { theme: Theme; isDark: boolean }>
) {
  return (props: P) => {
    const { theme, isDark } = useTheme();
    return <WrappedComponent {...props} theme={theme} isDark={isDark} />;
  };
}

// CSS-in-JS helper hooks
export const useThemeColor = (
  colorPath: string,
  fallback?: string
): string => {
  const { theme } = useTheme();
  const color = colorPath.split('.').reduce((obj: any, key) => obj?.[key], theme.colors);
  return color || fallback || '';
};

export const useResponsiveValue = <T,>(
  values: { base: T; sm?: T; md?: T; lg?: T; xl?: T }
): T => {
  const [value, setValue] = useState(values.base);

  useEffect(() => {
    const breakpoints = {
      sm: '(min-width: 640px)',
      md: '(min-width: 768px)',
      lg: '(min-width: 1024px)',
      xl: '(min-width: 1280px)'
    };

    const mediaQueries = Object.entries(breakpoints).map(([key, query]) => ({
      key,
      mq: window.matchMedia(query)
    }));

    const updateValue = () => {
      let newValue = values.base;
      for (const { key, mq } of mediaQueries) {
        if (mq.matches) {
          newValue = values[key as keyof typeof values] ?? newValue;
        }
      }
      setValue(newValue);
    };

    mediaQueries.forEach(({ mq }) => {
      mq.addEventListener('change', updateValue);
    });

    updateValue();

    return () => {
      mediaQueries.forEach(({ mq }) => {
        mq.removeEventListener('change', updateValue);
      });
    };
  }, [values]);

  return value;
};

// Theme transition component
export const ThemeTransition: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div
      className="transition-colors duration-200"
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </div>
  );
};

// Theme-aware style generator
export const createThemedStyles = (
  stylesFn: (theme: Theme, isDark: boolean) => React.CSSProperties
) => {
  return () => {
    const { theme, isDark } = useTheme();
    return stylesFn(theme, isDark);
  };
};

// Export all theme components and utilities
export const ThemeComponents = {
  ThemeProvider,
  ThemeTransition,
  withTheme
};

export const ThemeHooks = {
  useTheme,
  useThemeColor,
  useResponsiveValue,
  createThemedStyles
};
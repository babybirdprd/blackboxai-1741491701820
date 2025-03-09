import { THEME } from './constants';

export const lightTheme = {
  colors: {
    primary: {
      DEFAULT: THEME.COLORS.primary,
      light: '#60A5FA',
      dark: '#2563EB',
      contrast: '#FFFFFF'
    },
    secondary: {
      DEFAULT: THEME.COLORS.secondary,
      light: '#9CA3AF',
      dark: '#4B5563',
      contrast: '#FFFFFF'
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F3F4F6',
      tertiary: '#E5E7EB',
      contrast: '#111827'
    },
    surface: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6'
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      disabled: '#9CA3AF',
      inverse: '#FFFFFF'
    },
    border: {
      DEFAULT: '#E5E7EB',
      light: '#F3F4F6',
      dark: '#D1D5DB'
    },
    status: {
      success: THEME.COLORS.success,
      warning: THEME.COLORS.warning,
      error: THEME.COLORS.error,
      info: THEME.COLORS.primary
    },
    timeline: {
      background: '#F9FAFB',
      ruler: '#D1D5DB',
      segment: '#60A5FA',
      selectedSegment: '#2563EB',
      playhead: '#EF4444'
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  typography: {
    fonts: {
      sans: THEME.FONTS.sans,
      mono: THEME.FONTS.mono
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem'
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    primary: lightTheme.colors.primary,
    secondary: lightTheme.colors.secondary,
    background: {
      primary: THEME.COLORS.background.primary,
      secondary: THEME.COLORS.background.secondary,
      tertiary: THEME.COLORS.background.tertiary,
      contrast: '#FFFFFF'
    },
    surface: {
      primary: '#1F2937',
      secondary: '#374151',
      tertiary: '#4B5563'
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      disabled: '#6B7280',
      inverse: '#111827'
    },
    border: {
      DEFAULT: '#374151',
      light: '#4B5563',
      dark: '#1F2937'
    },
    status: lightTheme.colors.status,
    timeline: {
      background: '#1F2937',
      ruler: '#4B5563',
      segment: '#3B82F6',
      selectedSegment: '#60A5FA',
      playhead: '#EF4444'
    }
  }
};

export const createTheme = (isDark: boolean) => {
  return isDark ? darkTheme : lightTheme;
};

// CSS-in-JS helper functions
export const alpha = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const darken = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - Math.round(amount * 255));
  const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(amount * 255));
  const b = Math.max(0, (num & 0x0000FF) - Math.round(amount * 255));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

export const lighten = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, (num >> 16) + Math.round(amount * 255));
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(amount * 255));
  const b = Math.min(255, (num & 0x0000FF) + Math.round(amount * 255));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

// Theme utility types
export type Theme = typeof lightTheme;
export type ThemeColors = typeof lightTheme.colors;
export type ColorScheme = keyof typeof lightTheme.colors;

// Theme context types
export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

// CSS custom properties generator
export const createCSSCustomProperties = (theme: Theme): Record<string, string> => {
  const properties: Record<string, string> = {};

  const processObject = (obj: any, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const propertyName = prefix ? `${prefix}-${key}` : key;
      if (typeof value === 'object' && value !== null) {
        processObject(value, propertyName);
      } else {
        properties[`--${propertyName.toLowerCase()}`] = value as string;
      }
    });
  };

  processObject(theme);
  return properties;
};

// Export theme utilities
export const themeUtils = {
  alpha,
  darken,
  lighten,
  createTheme,
  createCSSCustomProperties
};
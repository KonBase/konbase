import { createContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type TextSize = 'default' | 'large' | 'larger';
export type Contrast = 'default' | 'increased' | 'high';
export type Density = 'compact' | 'comfortable' | 'spacious';

export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  contrast: Contrast;
  setContrast: (contrast: Contrast) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  animations: boolean;
  setAnimations: (enabled: boolean) => void;
  density: Density;
  setDensity: (density: Density) => void;
  screenReader: boolean;
  setScreenReader: (enabled: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
  dateFormat: string;
  setDateFormat: (format: string) => void;
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
}

export const ThemeProviderContext = createContext<
  ThemeProviderState | undefined
>(undefined);

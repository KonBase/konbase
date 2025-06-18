export type Theme = 'dark' | 'light' | 'system';
export type TextSize = 'default' | 'large' | 'larger';
export type ColorContrast = 'default' | 'increased' | 'high';
export type AnimationPreference = 'full' | 'reduced' | 'none';
export type UIDensity = 'compact' | 'comfortable' | 'spacious';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12' | '24';

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  contrast: ColorContrast;
  setContrast: (contrast: ColorContrast) => void;
  animations: AnimationPreference;
  setAnimations: (preference: AnimationPreference) => void;
  density: UIDensity;
  setDensity: (density: UIDensity) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  screenReader: boolean;
  setScreenReader: (enabled: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;
};

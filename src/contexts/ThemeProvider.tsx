'use client';

import * as React from 'react';
import {
  ThemeProviderContext,
  type Theme,
  type TextSize,
  type Contrast,
  type Density,
  type ThemeProviderState,
} from './ThemeContextDefinition';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'konbase-ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    // Initialize theme state without accessing localStorage or window during SSR
    return defaultTheme;
  });
  const [textSize, setTextSize] = React.useState<TextSize>('default');
  const [contrast, setContrast] = React.useState<Contrast>('default');
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [animations, setAnimations] = React.useState(true);
  const [density, setDensity] = React.useState<Density>('comfortable');
  const [screenReader, setScreenReader] = React.useState(false);
  const [language, setLanguage] = React.useState('en');
  const [dateFormat, setDateFormat] = React.useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = React.useState<'12h' | '24h'>('12h');
  const [mounted, setMounted] = React.useState(false);

  // Effect to set mounted state and load theme from localStorage
  React.useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // If no saved theme, set to defaultTheme (which might be 'system')
      // This ensures consistency if defaultTheme is 'system' and needs media query
      setTheme(defaultTheme);
    }

    // Load accessibility settings from localStorage
    const savedAccessibilitySettings = localStorage.getItem('konbase-accessibility-settings');
    if (savedAccessibilitySettings) {
      try {
        const settings = JSON.parse(savedAccessibilitySettings);
        if (settings.textSize) setTextSize(settings.textSize);
        if (settings.contrast) setContrast(settings.contrast);
        if (settings.density) setDensity(settings.density);
        if (typeof settings.reducedMotion === 'boolean') setReducedMotion(settings.reducedMotion);
        if (typeof settings.animations === 'boolean') setAnimations(settings.animations);
        if (typeof settings.screenReader === 'boolean') setScreenReader(settings.screenReader);
      } catch (error) {
        console.warn('Failed to parse accessibility settings from localStorage:', error);
      }
    }

    // Respect system preferences for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !savedAccessibilitySettings) {
      setReducedMotion(true);
      setAnimations(false);
    }

    // Respect system preferences for high contrast
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast && !savedAccessibilitySettings) {
      setContrast('high');
    }
  }, [storageKey, defaultTheme]);

  // Effect to apply theme to DOM, runs only after mounted and when theme changes
  React.useEffect(() => {
    if (!mounted) return; // Only run on client after hydration

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let currentTheme = theme;
    if (theme === 'system') {
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    root.classList.add(currentTheme);
  }, [theme, mounted]);

  // Effect to apply accessibility settings to DOM
  React.useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    const body = window.document.body;

    // Remove existing accessibility classes
    root.classList.remove(
      'text-size-default', 'text-size-large', 'text-size-larger',
      'contrast-default', 'contrast-increased', 'contrast-high',
      'density-compact', 'density-comfortable', 'density-spacious',
      'reduced-motion', 'animations-none', 'animations-reduced', 'animations-full',
      'screen-reader-optimized', 'accessibility-enhanced'
    );

    // Apply text size classes
    root.classList.add(`text-size-${textSize}`);

    // Apply contrast classes
    root.classList.add(`contrast-${contrast}`);

    // Apply density classes
    root.classList.add(`density-${density}`);

    // Apply motion preferences
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    }

    // Apply animation preferences
    if (!animations) {
      root.classList.add('animations-none');
    } else if (reducedMotion) {
      root.classList.add('animations-reduced');
    } else {
      root.classList.add('animations-full');
    }

    // Apply screen reader optimizations
    if (screenReader) {
      root.classList.add('screen-reader-optimized');
    }

    // Always add base accessibility enhancements
    root.classList.add('accessibility-enhanced');

    // Store accessibility preferences in localStorage
    const accessibilitySettings = {
      textSize,
      contrast,
      density,
      reducedMotion,
      animations,
      screenReader
    };
    localStorage.setItem('konbase-accessibility-settings', JSON.stringify(accessibilitySettings));
  }, [mounted, textSize, contrast, density, reducedMotion, animations, screenReader]);

  const value: ThemeProviderState = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (mounted) {
        // Ensure localStorage is only accessed on client
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    },
    textSize,
    setTextSize,
    contrast,
    setContrast,
    reducedMotion,
    setReducedMotion,
    animations,
    setAnimations,
    density,
    setDensity,
    screenReader,
    setScreenReader,
    language,
    setLanguage,
    dateFormat,
    setDateFormat,
    timeFormat,
    setTimeFormat,
  };

  // To prevent flash of unstyled content or incorrect theme before hydration,
  // we can render children only after mounted, or use a placeholder.
  // However, for theme, it's often preferred to let the default render and then switch.
  // The `suppressHydrationWarning` on <html> in layout.tsx helps with minor attribute mismatches.
  // The key is that the *structure* of the DOM should match.
  // If we delay rendering children, it could cause a layout shift.

  // The initial render will use the defaultTheme (or 'system' evaluated on server if possible, though less common for theme).
  // The client will then hydrate with this, and useEffect will update if localStorage/system pref differs.

  if (!mounted) {
    // Optional: Render a loader or null to avoid applying client-side theme logic before hydration
    // This can prevent hydration errors if the server and client render different initial themes.
    // However, this might cause a flash of unstyled content or a layout shift.
    // For now, we'll rely on `suppressHydrationWarning` and careful effect management.
    // return null; // Or a loading spinner
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

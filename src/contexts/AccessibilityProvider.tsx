'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAnnouncer } from '@/hooks/useFocusManagement';

interface AccessibilityContextType {
  // Announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Focus management
  focusManagement: {
    trapFocus: boolean;
    setTrapFocus: (trap: boolean) => void;
    restoreFocus: boolean;
    setRestoreFocus: (restore: boolean) => void;
  };
  
  // Keyboard navigation
  keyboardNavigation: {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    skipLinks: boolean;
    setSkipLinks: (show: boolean) => void;
  };
  
  // ARIA live regions
  liveRegions: {
    status: string;
    setStatus: (status: string) => void;
    alert: string;
    setAlert: (alert: string) => void;
  };
  
  // Accessibility preferences
  preferences: {
    respectSystemPreferences: boolean;
    setRespectSystemPreferences: (respect: boolean) => void;
    highContrastMode: boolean;
    setHighContrastMode: (enabled: boolean) => void;
    reducedMotion: boolean;
    setReducedMotion: (enabled: boolean) => void;
  };
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const announce = useAnnouncer();
  
  // Focus management state
  const [trapFocus, setTrapFocus] = useState(false);
  const [restoreFocus, setRestoreFocus] = useState(true);
  
  // Keyboard navigation state
  const [keyboardNavigationEnabled, setKeyboardNavigationEnabled] = useState(true);
  const [skipLinks, setSkipLinks] = useState(true);
  
  // Live regions state
  const [status, setStatus] = useState('');
  const [alert, setAlert] = useState('');
  
  // Accessibility preferences
  const [respectSystemPreferences, setRespectSystemPreferences] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // System preference detection
  useEffect(() => {
    if (!respectSystemPreferences) return;
    
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };
    
    const updatePreferences = () => {
      setReducedMotion(mediaQueries.reducedMotion.matches);
      setHighContrastMode(mediaQueries.highContrast.matches);
    };
    
    // Initial check
    updatePreferences();
    
    // Listen for changes
    mediaQueries.reducedMotion.addEventListener('change', updatePreferences);
    mediaQueries.highContrast.addEventListener('change', updatePreferences);
    
    return () => {
      mediaQueries.reducedMotion.removeEventListener('change', updatePreferences);
      mediaQueries.highContrast.removeEventListener('change', updatePreferences);
    };
  }, [respectSystemPreferences]);
  
  // Apply accessibility classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (highContrastMode) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }
    
    // Reduced motion
    if (reducedMotion) {
      root.classList.add('accessibility-reduced-motion');
    } else {
      root.classList.remove('accessibility-reduced-motion');
    }
    
    // Keyboard navigation
    if (keyboardNavigationEnabled) {
      root.classList.add('accessibility-keyboard-navigation');
    } else {
      root.classList.remove('accessibility-keyboard-navigation');
    }
  }, [highContrastMode, reducedMotion, keyboardNavigationEnabled]);
  
  // Global keyboard event handling
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Tab key detection for keyboard navigation
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation-active');
      }
      
      // Escape key for closing modals/dialogs
      if (e.key === 'Escape') {
        const event = new CustomEvent('global:escape', {
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(event);
      }
    };
    
    const handleGlobalMouseDown = () => {
      document.body.classList.remove('keyboard-navigation-active');
    };
    
    if (keyboardNavigationEnabled) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      document.addEventListener('mousedown', handleGlobalMouseDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      document.removeEventListener('mousedown', handleGlobalMouseDown);
    };
  }, [keyboardNavigationEnabled]);
  
  // Live region announcements
  useEffect(() => {
    if (status) {
      announce(status, 'polite');
    }
  }, [status, announce]);
  
  useEffect(() => {
    if (alert) {
      announce(alert, 'assertive');
    }
  }, [alert, announce]);
  
  const value: AccessibilityContextType = {
    announce,
    focusManagement: {
      trapFocus,
      setTrapFocus,
      restoreFocus,
      setRestoreFocus,
    },
    keyboardNavigation: {
      enabled: keyboardNavigationEnabled,
      setEnabled: setKeyboardNavigationEnabled,
      skipLinks,
      setSkipLinks,
    },
    liveRegions: {
      status,
      setStatus,
      alert,
      setAlert,
    },
    preferences: {
      respectSystemPreferences,
      setRespectSystemPreferences,
      highContrastMode,
      setHighContrastMode,
      reducedMotion,
      setReducedMotion,
    },
  };
  
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Live regions for screen reader announcements */}
      <div
        id="accessibility-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {status}
      </div>
      <div
        id="accessibility-alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {alert}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Convenience hooks for specific functionality
export function useAnnounce() {
  const { announce } = useAccessibility();
  return announce;
}

export function useLiveRegions() {
  const { liveRegions } = useAccessibility();
  return liveRegions;
}

export function useKeyboardNavigation() {
  const { keyboardNavigation } = useAccessibility();
  return keyboardNavigation;
}

export function useFocusManagement() {
  const { focusManagement } = useAccessibility();
  return focusManagement;
}

export function useAccessibilityPreferences() {
  const { preferences } = useAccessibility();
  return preferences;
}
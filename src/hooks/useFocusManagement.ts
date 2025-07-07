'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing focus within a container (focus trapping)
 * Useful for modals, dialogs, and other interactive components
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Allow parent components to handle escape
        const escapeEvent = new CustomEvent('focustrap:escape', {
          bubbles: true,
          cancelable: true
        });
        container.dispatchEvent(escapeEvent);
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Focus the first element when trap becomes active
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing focus restoration
 * Saves the currently focused element and restores it later
 */
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Hook for announcing content to screen readers
 */
export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.id = 'accessibility-announcer';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
      
      // Clear the message after a short delay to allow for re-announcements
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return announce;
}

/**
 * Hook for managing keyboard navigation within a list or grid
 */
export function useKeyboardNavigation({
  orientation = 'vertical',
  loop = true,
  onActivate
}: {
  orientation?: 'vertical' | 'horizontal' | 'both';
  loop?: boolean;
  onActivate?: (index: number) => void;
} = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const currentIndexRef = useRef(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll('[role="option"], [role="menuitem"], [role="tab"], button, a')
    ) as HTMLElement[];

    if (items.length === 0) return;

    let newIndex = currentIndexRef.current;
    let handled = false;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = loop ? (newIndex + 1) % items.length : Math.min(newIndex + 1, items.length - 1);
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = loop ? (newIndex - 1 + items.length) % items.length : Math.max(newIndex - 1, 0);
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = loop ? (newIndex + 1) % items.length : Math.min(newIndex + 1, items.length - 1);
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = loop ? (newIndex - 1 + items.length) % items.length : Math.max(newIndex - 1, 0);
          handled = true;
        }
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = items.length - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        if (onActivate) {
          onActivate(currentIndexRef.current);
          handled = true;
        }
        break;
    }

    if (handled) {
      e.preventDefault();
      currentIndexRef.current = newIndex;
      items[newIndex]?.focus();
    }
  }, [orientation, loop, onActivate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return containerRef;
}
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'skip-link',
        'sr-only focus:not-sr-only',
        'fixed top-4 left-4 z-50',
        'bg-primary text-primary-foreground',
        'px-4 py-2 rounded-md',
        'font-medium text-sm',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Focus the target element if it's focusable
            if (target instanceof HTMLElement) {
              target.focus();
            }
          }
        }
      }}
    >
      {children}
    </a>
  );
}

export function SkipToMain() {
  return (
    <SkipLink href="#main-content">
      Skip to main content
    </SkipLink>
  );
}

export function SkipToNavigation() {
  return (
    <SkipLink href="#navigation">
      Skip to navigation
    </SkipLink>
  );
}
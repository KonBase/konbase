'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth';
import { Header } from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Pages that should not show the header even when authenticated
  const noHeaderPages = [
    '/',
    '/login',
    '/register',
    '/auth/callback',
    '/auth/reset-password',
    '/auth/verify-email'
  ];

  // Don't show header while loading or on specific pages
  const shouldShowHeader = !loading && user && !noHeaderPages.includes(pathname);

  return (
    <>
      {shouldShowHeader && <Header />}
      <main className={shouldShowHeader ? 'pt-0' : ''}>
        {children}
      </main>
    </>
  );
}
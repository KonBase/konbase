'use client';

import { ReactNode } from 'react';
import { Toaster } from './ui/toaster';

interface ContextWrapperProps {
  children: ReactNode;
}

export function ContextWrapper({ children }: ContextWrapperProps) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

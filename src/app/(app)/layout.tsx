'use client';
import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin');
  }, [status, router]);
  if (status === 'loading') return null;
  return <AppLayout>{children}</AppLayout>;
}

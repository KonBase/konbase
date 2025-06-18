'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth/useAuth';
import { Spinner } from '@/components/ui/spinner';

interface GuestGuardProps {
  children: ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}

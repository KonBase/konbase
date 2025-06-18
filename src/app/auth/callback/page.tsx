'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { Spinner } from '@/components/ui/spinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle various callback scenarios
        const error = searchParams?.get('error');
        const code = searchParams?.get('code');
        const type = searchParams?.get('type');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        if (type === 'recovery') {
          setStatus('success');
          setMessage(
            'Password reset successful. You can now log in with your new password.',
          );
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        if (code || user) {
          setStatus('success');
          setMessage('Authentication successful. Redirecting...');
          const redirectTo = searchParams?.get('redirectTo') || '/dashboard';
          setTimeout(() => router.push(redirectTo), 1500);
          return;
        }

        // If no specific parameters, wait for auth state
        if (!authLoading) {
          if (user) {
            setStatus('success');
            setMessage('Login successful. Redirecting...');
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            setStatus('error');
            setMessage('Authentication failed. Redirecting to login...');
            setTimeout(() => router.push('/login'), 3000);
          }
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred during authentication.');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [user, authLoading, router, searchParams]);

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Spinner size="lg" />;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'success'
              ? 'Success!'
              : status === 'error'
                ? 'Error'
                : 'Please wait...'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Completing authentication...'}
            {status === 'success' && 'Authentication completed successfully'}
            {status === 'error' && 'There was a problem with authentication'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center space-y-4">
            {getIcon()}
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

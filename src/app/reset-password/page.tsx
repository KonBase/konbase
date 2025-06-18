'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/lib/supabase/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { GuestGuard } from '@/components/guards/GuestGuard';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
    }
  }, [token]);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both password fields are identical.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: 'Password reset successful',
        description: 'Your password has been updated.',
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: unknown) {
      toast({
        title: 'Password reset failed',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred while resetting your password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            {isSuccess ? (
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            ) : (
              <CardTitle className="text-2xl font-bold">
                Reset Password
              </CardTitle>
            )}
            <CardDescription>
              {isSuccess
                ? 'Your password has been reset successfully'
                : 'Create a new password for your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isTokenValid ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid or missing token</AlertTitle>
                <AlertDescription>
                  This password reset link is invalid or has expired. Please
                  request a new password reset link.
                </AlertDescription>
              </Alert>
            ) : isSuccess ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  You will be redirected to the login page shortly.
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">Login Now</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Enter new password"
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Reset Password
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="text-sm text-center block">
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </GuestGuard>
  );
}

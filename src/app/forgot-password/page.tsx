'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
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
import { GuestGuard } from '@/components/guards/GuestGuard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSuccess(true);
      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send reset email',
        description:
          error.message || 'Please check your email address and try again.',
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
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              {isSuccess
                ? "We've sent you a password reset link"
                : 'Enter your email to receive a password reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Send Reset Link
                </Button>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Please check your email inbox and follow the instructions to
                  reset your password.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-center block">
            Remember your password?{' '}
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

'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { supabase } from '@/lib/supabase';
import { Gift, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RedeemCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [code, setCode] = useState(searchParams?.get('code') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [redeemResult, setRedeemResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);

    try {
      // Call the redeem function/API
      const { data, error } = await supabase.rpc('redeem_invitation_code', {
        invitation_code: code,
      });

      if (error) throw error;

      setRedeemResult(data);
      setIsSuccess(true);

      toast({
        title: 'Code redeemed successfully',
        description: 'Your invitation has been processed.',
      });

      // Redirect after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error: any) {
      console.error('Error redeeming code:', error);
      toast({
        title: 'Failed to redeem code',
        description: error.message || 'The code may be invalid or expired.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 max-w-md">
        <Card>
          <CardHeader className="text-center">
            {isSuccess ? (
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            ) : (
              <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
            )}
            <CardTitle className="text-2xl">
              {isSuccess ? 'Code Redeemed!' : 'Redeem Invitation Code'}
            </CardTitle>
            <CardDescription>
              {isSuccess
                ? 'Your invitation has been successfully processed'
                : 'Enter your invitation code to join an association or event'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Invitation Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter your code"
                    required
                    disabled={isLoading}
                    className="text-center font-mono text-lg"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Codes are not case-sensitive
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !code.trim()}
                >
                  {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Redeem Code
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                {redeemResult && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Welcome to:</p>
                    <p className="text-lg">
                      {redeemResult.association_name || 'New Association'}
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Redirecting to dashboard in a few seconds...
                </p>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have a code?{' '}
                <Link
                  href="/dashboard"
                  className="text-primary hover:underline"
                >
                  Continue to Dashboard
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

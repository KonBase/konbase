'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { RecoveryKeyManager } from '@/components/auth/RecoveryKeyManager';
import { useToast } from '@/hooks/use-toast';

export function SecuritySettings() {
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');

  const handleTwoFactorVerified = () => {
    toast({
      title: 'Two-factor authentication enabled',
      description: 'Your account is now protected with 2FA.',
    });

    // Save the secret for recovery keys
    setTwoFactorSecret('your_generated_secret');
  };

  const handleTwoFactorCancel = () => {
    setErrorMessage('');
  };

  const handleRecoveryComplete = () => {
    toast({
      title: 'Recovery keys saved',
      description: 'Your recovery keys have been generated successfully.',
    });
  };

  return (
    <>
      <TwoFactorSetup
        onVerified={handleTwoFactorVerified}
        onCancel={handleTwoFactorCancel}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      <RecoveryKeyManager
        secret={twoFactorSecret}
        onComplete={handleRecoveryComplete}
        onCancel={handleTwoFactorCancel}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </>
  );
}

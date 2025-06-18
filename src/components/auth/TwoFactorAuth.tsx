'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { TwoFactorSetup } from './TwoFactorSetup';
import { RecoveryKeyManager } from './RecoveryKeyManager';
import TwoFactorStatus from './TwoFactorStatus';

export function TwoFactorAuth() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { profile, refreshProfile } = useUserProfile();

  useEffect(() => {
    if (profile) {
      setIsEnabled(profile.two_factor_enabled || false);
    }
  }, [profile]);

  const handleSetupStart = () => {
    setIsSettingUp(true);
    setErrorMessage(null);
  };

  const handleSetupCancel = () => {
    setIsSettingUp(false);
    setIsConfirmed(false);
    setSecret(null);
    setErrorMessage(null);
  };

  const handleVerificationSuccess = (verifiedSecret: string) => {
    setIsConfirmed(true);
    setSecret(verifiedSecret);
  };

  const handleSetupComplete = async () => {
    await refreshProfile();
    setIsEnabled(true);
    setIsSettingUp(false);
    setIsConfirmed(false);
    setSecret(null);
  };

  // Show proper component based on state
  if (isEnabled && !isSettingUp) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Your account is protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorStatus
            isEnabled={isEnabled}
            onSetupStart={handleSetupStart}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        </CardContent>
      </Card>
    );
  }

  if (isSettingUp && !isConfirmed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
          <CardDescription>
            Secure your account with an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup
            onVerified={handleVerificationSuccess}
            onCancel={handleSetupCancel}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        </CardContent>
      </Card>
    );
  }

  if (isConfirmed && secret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save Your Recovery Keys</CardTitle>
          <CardDescription>
            Store these recovery keys in a safe place. You'll need them if you
            lose access to your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecoveryKeyManager
            secret={secret}
            onComplete={handleSetupComplete}
            onCancel={handleSetupCancel}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TwoFactorStatus
          isEnabled={isEnabled}
          onSetupStart={handleSetupStart}
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
        />
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { RecoveryKeyManager } from '@/components/auth/RecoveryKeyManager';
import { LanguageRegionSettings } from '@/components/settings/LanguageRegionSettings';
import { AccessibilitySettings } from '@/components/settings/AccessibilitySettings';
import { useAuth } from '@/contexts/auth';

export function SettingsContent() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Add save logic here
      console.log('Saving changes...');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorVerified = () => {
    console.log('Two-factor verified');
  };

  const handleTwoFactorCancel = () => {
    console.log('Two-factor cancelled');
  };

  const handleRecoveryComplete = () => {
    console.log('Recovery complete');
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <Button onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <TwoFactorSetup
            onVerified={handleTwoFactorVerified}
            onCancel={handleTwoFactorCancel}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
          <RecoveryKeyManager
            secret={twoFactorSecret}
            onComplete={handleRecoveryComplete}
            onCancel={handleTwoFactorCancel}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <LanguageRegionSettings />
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-4">
          <AccessibilitySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

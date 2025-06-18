'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { PreferenceSettings } from '@/components/settings/PreferenceSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AccessibilitySettings } from '@/components/settings/AccessibilitySettings';

// export const metadata = { // Example of metadata
//   title: 'Settings - KonBase',
// };

export default function SettingsPage() {
  const pathname = usePathname();
  const defaultTab = pathname?.includes('/security')
    ? 'security'
    : pathname?.includes('/preferences')
      ? 'preferences'
      : pathname?.includes('/accessibility')
        ? 'accessibility'
        : pathname?.includes('/notifications')
          ? 'notifications'
          : 'account';

  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <PreferenceSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-4">
            <AccessibilitySettings />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

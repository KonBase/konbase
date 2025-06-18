'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

export function NotificationSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newConventions: true,
    conventionUpdates: true,
    inventoryChanges: false,
    systemAnnouncements: true,
  });

  const handleToggle = (setting: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Notification settings saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Failed to save settings',
        description:
          'An error occurred while saving your notification settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Control how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Delivery Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(value) =>
                  handleToggle('emailNotifications', value)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in your browser
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(value) =>
                  handleToggle('pushNotifications', value)
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="new-conventions" className="font-medium">
                  New Conventions
                </Label>
                <p className="text-sm text-muted-foreground">
                  When new conventions are created
                </p>
              </div>
              <Switch
                id="new-conventions"
                checked={settings.newConventions}
                onCheckedChange={(value) =>
                  handleToggle('newConventions', value)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="convention-updates" className="font-medium">
                  Convention Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  When changes are made to conventions
                </p>
              </div>
              <Switch
                id="convention-updates"
                checked={settings.conventionUpdates}
                onCheckedChange={(value) =>
                  handleToggle('conventionUpdates', value)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inventory-changes" className="font-medium">
                  Inventory Changes
                </Label>
                <p className="text-sm text-muted-foreground">
                  When items are added or updated
                </p>
              </div>
              <Switch
                id="inventory-changes"
                checked={settings.inventoryChanges}
                onCheckedChange={(value) =>
                  handleToggle('inventoryChanges', value)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-announcements" className="font-medium">
                  System Announcements
                </Label>
                <p className="text-sm text-muted-foreground">
                  Important system-wide announcements
                </p>
              </div>
              <Switch
                id="system-announcements"
                checked={settings.systemAnnouncements}
                onCheckedChange={(value) =>
                  handleToggle('systemAnnouncements', value)
                }
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
          Save Notification Settings
        </Button>
      </CardContent>
    </Card>
  );
}

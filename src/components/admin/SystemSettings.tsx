'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Save, Loader2 } from 'lucide-react';

interface SystemSetting {
  key: string;
  value: string | boolean;
  description: string;
  category: string;
}

export function SystemSettings() {
  const { profile } = useUserProfile();
  const [settings, setSettings] = useState<Record<string, any>>({
    allowRegistration: true,
    requireEmailVerification: true,
    enforce2FA: false,
    sessionTimeout: 60,
    maxFileSize: 10,
    defaultUserRole: 'guest',
    systemEmailAddress: 'noreply@eventnexus.com',
    backupEnabled: true,
    backupFrequency: 7,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = profile?.role === 'super_admin';

  const handleSwitchChange = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    // Convert to number if the input is numeric
    const processedValue = type === 'number' ? parseInt(value) : value;

    setSettings((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const saveSettings = async () => {
    if (!isSuperAdmin) {
      toast({
        title: 'Permission Denied',
        description: 'Only super admins can modify system settings',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // In a real implementation, we would save these to the database
      // For now, we'll just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Log the change in audit logs
      await supabase.from('audit_logs').insert({
        action: 'update_settings',
        entity: 'system_settings',
        entity_id: 'global',
        user_id: profile?.id || '',
        changes: settings,
      });

      toast({
        title: 'Settings Saved',
        description: 'System settings have been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save system settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="backup">Backup</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure general system settings and defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowRegistration">
                    Allow new user registrations
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this to allow new users to register for accounts
                  </p>
                </div>
                <Switch
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onCheckedChange={() =>
                    handleSwitchChange('allowRegistration')
                  }
                  disabled={!isSuperAdmin}
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="defaultUserRole">Default User Role</Label>
                <Input
                  id="defaultUserRole"
                  name="defaultUserRole"
                  value={settings.defaultUserRole}
                  onChange={handleInputChange}
                  disabled={!isSuperAdmin}
                />
                <p className="text-sm text-muted-foreground">
                  Role assigned to new users upon registration
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings} disabled={saving || !isSuperAdmin}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Configure security-related options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireEmailVerification">
                  Require email verification
                </Label>
                <p className="text-sm text-muted-foreground">
                  Require users to verify their email address before accessing
                  the system
                </p>
              </div>
              <Switch
                id="requireEmailVerification"
                checked={settings.requireEmailVerification}
                onCheckedChange={() =>
                  handleSwitchChange('requireEmailVerification')
                }
                disabled={!isSuperAdmin}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enforce2FA">Enforce 2FA for admin users</Label>
                <p className="text-sm text-muted-foreground">
                  Require two-factor authentication for admin and super_admin
                  users
                </p>
              </div>
              <Switch
                id="enforce2FA"
                checked={settings.enforce2FA}
                onCheckedChange={() => handleSwitchChange('enforce2FA')}
                disabled={!isSuperAdmin}
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="sessionTimeout">Session timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                name="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={handleInputChange}
                disabled={!isSuperAdmin}
              />
              <p className="text-sm text-muted-foreground">
                Automatically log users out after this period of inactivity
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings} disabled={saving || !isSuperAdmin}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="email">
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure system email settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="systemEmailAddress">System Email Address</Label>
              <Input
                id="systemEmailAddress"
                name="systemEmailAddress"
                type="email"
                value={settings.systemEmailAddress}
                onChange={handleInputChange}
                disabled={!isSuperAdmin}
              />
              <p className="text-sm text-muted-foreground">
                The email address used for system notifications
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings} disabled={saving || !isSuperAdmin}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="backup">
        <Card>
          <CardHeader>
            <CardTitle>Backup Settings</CardTitle>
            <CardDescription>
              Configure automatic backup settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="backupEnabled">Enable automatic backups</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup system data on a schedule
                </p>
              </div>
              <Switch
                id="backupEnabled"
                checked={settings.backupEnabled}
                onCheckedChange={() => handleSwitchChange('backupEnabled')}
                disabled={!isSuperAdmin}
              />
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="backupFrequency">Backup frequency (days)</Label>
              <Input
                id="backupFrequency"
                name="backupFrequency"
                type="number"
                min="1"
                max="30"
                value={settings.backupFrequency}
                onChange={handleInputChange}
                disabled={!isSuperAdmin || !settings.backupEnabled}
              />
              <p className="text-sm text-muted-foreground">
                How often to perform automatic backups
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings} disabled={saving || !isSuperAdmin}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}


import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth';
import { Save, Loader2, Settings, Clock, Users, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { getSessionSettings, updateSessionSettings, SessionSettings } from '@/utils/session-management';

interface SystemSetting {
  key: string;
  value: string | boolean;
  description: string;
  category: string;
}

export function SystemSettings() {
  const { user } = useAuth();
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
  
  // Session settings state
  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    session_duration_hours: 168,
    max_concurrent_sessions: 5,
    require_mfa_for_new_sessions: true,
    auto_logout_inactive_minutes: 30,
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState(false);
  
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Load session settings on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      loadSessionSettings();
    } else {
      setSessionLoading(false);
    }
  }, [isSuperAdmin]);
  
  const loadSessionSettings = async () => {
    try {
      setSessionLoading(true);
      setSessionError(null);
      const settingsData = await getSessionSettings();
      setSessionSettings(settingsData);
    } catch (error: unknown) {
      console.error('Error loading session settings:', error);
      setSessionError(error instanceof Error ? error.message : 'Failed to load session settings');
    } finally {
      setSessionLoading(false);
    }
  };
  
  const handleSessionSave = async () => {
    try {
      setSessionSaving(true);
      setSessionError(null);
      setSessionSuccess(false);
      
      await updateSessionSettings(sessionSettings);
      
      setSessionSuccess(true);
      toast({
        title: "Session Settings Updated",
        description: "Session settings have been successfully updated.",
      });
      
      // Reset success state after 3 seconds
      setTimeout(() => setSessionSuccess(false), 3000);
    } catch (error: unknown) {
      console.error('Error saving session settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      setSessionError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: errorMessage,
      });
    } finally {
      setSessionSaving(false);
    }
  };
  
  const handleSessionSettingChange = (key: keyof SessionSettings, value: number | boolean) => {
    setSessionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSwitchChange = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Convert to number if the input is numeric
    const processedValue = type === 'number' ? parseInt(value) : value;
    
    setSettings(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };
  
  const saveSettings = async () => {
    if (!isSuperAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only super admins can modify system settings",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    
    try {
      // In a real implementation, we would save these to the database
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the change in audit logs
      await supabase.from('audit_logs').insert({
        action: 'update_settings',
        entity: 'system_settings',
        entity_id: 'global',
        user_id: user?.id || '',
        changes: settings
      });
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive"
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
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
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
                  <Label htmlFor="allowRegistration">Allow new user registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this to allow new users to register for accounts
                  </p>
                </div>
                <Switch
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onCheckedChange={() => handleSwitchChange('allowRegistration')}
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
                <Label htmlFor="requireEmailVerification">Require email verification</Label>
                <p className="text-sm text-muted-foreground">
                  Require users to verify their email address before accessing the system
                </p>
              </div>
              <Switch
                id="requireEmailVerification"
                checked={settings.requireEmailVerification}
                onCheckedChange={() => handleSwitchChange('requireEmailVerification')}
                disabled={!isSuperAdmin}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enforce2FA">Enforce 2FA for admin users</Label>
                <p className="text-sm text-muted-foreground">
                  Require two-factor authentication for admin and super_admin users
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
      
      <TabsContent value="sessions">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Session Settings
            </CardTitle>
            <CardDescription>
              Configure global session management settings for all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sessionError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{sessionError}</AlertDescription>
              </Alert>
            )}

            {sessionSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Session settings have been updated successfully.</AlertDescription>
              </Alert>
            )}

            {sessionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading session settings...</span>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-duration" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Session Duration (Hours)
                    </Label>
                    <Input
                      id="session-duration"
                      type="number"
                      min="1"
                      max="8760"
                      value={sessionSettings.session_duration_hours}
                      onChange={(e) => handleSessionSettingChange('session_duration_hours', parseInt(e.target.value) || 168)}
                      disabled={sessionSaving || !isSuperAdmin}
                    />
                    <p className="text-xs text-muted-foreground">
                      How long user sessions remain active (1-8760 hours, default: 168 hours = 7 days)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-sessions" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Maximum Concurrent Sessions
                    </Label>
                    <Input
                      id="max-sessions"
                      type="number"
                      min="1"
                      max="20"
                      value={sessionSettings.max_concurrent_sessions}
                      onChange={(e) => handleSessionSettingChange('max_concurrent_sessions', parseInt(e.target.value) || 5)}
                      disabled={sessionSaving || !isSuperAdmin}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of active sessions per user (1-20, default: 5)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto-logout" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Auto Logout Inactive (Minutes)
                    </Label>
                    <Input
                      id="auto-logout"
                      type="number"
                      min="5"
                      max="1440"
                      value={sessionSettings.auto_logout_inactive_minutes}
                      onChange={(e) => handleSessionSettingChange('auto_logout_inactive_minutes', parseInt(e.target.value) || 30)}
                      disabled={sessionSaving || !isSuperAdmin}
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically log out users after inactivity (5-1440 minutes, default: 30 minutes)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="require-mfa" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Require MFA for New Sessions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Force users to complete MFA verification when signing in from new devices
                      </p>
                    </div>
                    <Switch
                      id="require-mfa"
                      checked={sessionSettings.require_mfa_for_new_sessions}
                      onCheckedChange={(checked) => handleSessionSettingChange('require_mfa_for_new_sessions', checked)}
                      disabled={sessionSaving || !isSuperAdmin}
                    />
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Session Management Notes</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Changes take effect for new sessions only</li>
                        <li>• Existing sessions will continue until they expire naturally</li>
                        <li>• MFA requirement applies to all new login attempts</li>
                        <li>• Auto-logout helps prevent unauthorized access on shared devices</li>
                        <li>• Session limits help prevent account abuse</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSessionSave} 
              className="w-full" 
              disabled={sessionSaving || !isSuperAdmin}
            >
              {sessionSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Session Settings
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
            <CardDescription>
              Configure system email settings
            </CardDescription>
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

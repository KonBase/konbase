import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Settings, 
  Clock, 
  Users, 
  Shield, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSessionSettings, updateSessionSettings, SessionSettings } from '@/utils/session-management';
import { useAuth } from '@/contexts/auth';

const AdminSessionSettings: React.FC = () => {
  const [settings, setSettings] = useState<SessionSettings>({
    session_duration_hours: 168,
    max_concurrent_sessions: 5,
    require_mfa_for_new_sessions: true,
    auto_logout_inactive_minutes: 30,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { hasRole } = useAuth();
  const { toast } = useToast();

  // Check if user has admin permissions
  const isAdmin = hasRole('system_admin') || hasRole('super_admin');

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const settingsData = await getSessionSettings();
      setSettings(settingsData);
    } catch (error: unknown) {
      console.error('Error loading session settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load session settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);
      
      await updateSessionSettings(settings);
      
      setSuccess(true);
      toast({
        title: "Settings Updated",
        description: "Session settings have been successfully updated.",
      });
      
      // Reset success state after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: unknown) {
      console.error('Error saving session settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: keyof SessionSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              You don't have permission to access admin session settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Settings have been updated successfully.</AlertDescription>
          </Alert>
        )}

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
              value={settings.session_duration_hours}
              onChange={(e) => handleSettingChange('session_duration_hours', parseInt(e.target.value) || 168)}
              disabled={isSaving}
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
              value={settings.max_concurrent_sessions}
              onChange={(e) => handleSettingChange('max_concurrent_sessions', parseInt(e.target.value) || 5)}
              disabled={isSaving}
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
              value={settings.auto_logout_inactive_minutes}
              onChange={(e) => handleSettingChange('auto_logout_inactive_minutes', parseInt(e.target.value) || 30)}
              disabled={isSaving}
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
              checked={settings.require_mfa_for_new_sessions}
              onCheckedChange={(checked) => handleSettingChange('require_mfa_for_new_sessions', checked)}
              disabled={isSaving}
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

        <Button 
          onClick={handleSave} 
          className="w-full" 
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving Settings...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminSessionSettings;

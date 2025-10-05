import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Laptop, 
  Smartphone, 
  Monitor, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Loader2,
  LogOut,
  Shield,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserSessions, signOutSession, signOutAllOtherSessions, SessionInfo } from '@/utils/session-management';

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionData = await getUserSessions();
      setSessions(sessionData);
    } catch (error: unknown) {
      console.error('Error loading sessions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to sign out this session?')) {
      return;
    }

    try {
      setIsSigningOut(sessionId);
      await signOutSession(sessionId);
      
      toast({
        title: "Session Signed Out",
        description: "The session has been successfully signed out.",
      });
      
      await loadSessions();
    } catch (error: unknown) {
      console.error('Error signing out session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign out session",
      });
    } finally {
      setIsSigningOut(null);
    }
  };

  const handleSignOutAll = async () => {
    if (!window.confirm('Are you sure you want to sign out all other sessions? This will log you out of all devices except this one.')) {
      return;
    }

    try {
      setIsSigningOut('all');
      await signOutAllOtherSessions();
      
      toast({
        title: "All Sessions Signed Out",
        description: "All other sessions have been successfully signed out.",
      });
      
      await loadSessions();
    } catch (error: unknown) {
      console.error('Error signing out all sessions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign out all sessions",
      });
    } finally {
      setIsSigningOut(null);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Laptop className="h-4 w-4" />;
    }
  };

  const formatLastActive = (lastActive: string) => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Laptop className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active sessions and devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sessions.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Active Sessions</AlertTitle>
            <AlertDescription>
              No active sessions found. This might be a temporary issue.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.device_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{session.device_name}</span>
                          {session.is_current && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.browser} on {session.os}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatLastActive(session.last_active)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!session.is_current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSignOutSession(session.id)}
                      disabled={isSigningOut === session.id}
                    >
                      {isSigningOut === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-1" />
                          Sign Out
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sign Out All Other Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    This will sign you out of all devices except this one
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleSignOutAll}
                  disabled={isSigningOut === 'all' || sessions.length <= 1}
                >
                  {isSigningOut === 'all' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing Out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out All Others
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Security Tips</h4>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Sign out of sessions on devices you no longer use</li>
                <li>• Enable two-factor authentication for better security</li>
                <li>• Regularly review your active sessions</li>
                <li>• Use strong, unique passwords</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionManagement;

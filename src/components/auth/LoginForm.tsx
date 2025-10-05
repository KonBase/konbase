import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { logDebug, handleError } from '@/utils/debug';
import { getLastVisitedPath, saveCurrentPath } from '@/utils/session-utils';
import MFAVerification from './MFAVerification';
import MFARecovery from './MFARecovery';

const LoginForm = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const { login, signInWithOAuth, userProfile, user, loading: authLoading } = useAuth();
  const [isReady] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const emailVerificationNeeded = location.state?.emailVerification;
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const redirectAttempts = useState(0);
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Enhanced redirection effect
  useEffect(() => {
    // Only attempt redirection if we have a target and auth is not loading
    if (redirectTo && !authLoading) {
      logDebug('Attempting redirection after login', { 
        path: redirectTo, 
        userExists: !!user, 
        profileExists: !!userProfile,
        isGitHubPages
      }, 'info');
      
      // If we have a user or profile, we can redirect
      if (user || userProfile) {
        logDebug('User authenticated, redirecting to', { path: redirectTo }, 'info');
        
        // Small delay to ensure all auth state is properly updated
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
          setRedirectTo(null);
        }, 100);
      } 
      // If we're still not logged in after multiple attempts, force redirect to dashboard
      else if (redirectAttempts[0] >= 3) {
        logDebug('Forcing dashboard redirect after multiple attempts', null, 'warn');
        navigate('/dashboard', { replace: true });
        setRedirectTo(null);
      }
      // Increment redirect attempts
      else {
        redirectAttempts[1](prev => prev + 1);
      }
    }
  }, [redirectTo, user, userProfile, authLoading, navigate, redirectAttempts, isGitHubPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      logDebug('Login attempt', { email }, 'info');
      
      const { data, error } = await login(email, password);
      
      if (error) {
        throw error;
      }

      // Check if MFA is required
      if (data?.session?.aal === 'aal1') {
        // Check if user has verified MFA factors enrolled
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        
        if (factorsError) {
          console.warn('Error checking MFA factors:', factorsError);
          // Continue with login if we can't check factors
        } else {
          const verifiedFactors = [
            ...(factors.totp || []).filter(f => f.status === 'verified'),
            ...(factors.phone || []).filter(f => f.status === 'verified')
          ];
          
          if (verifiedFactors.length > 0) {
            logDebug('User has verified MFA factors, requiring verification', { 
              totpCount: factors.totp?.filter(f => f.status === 'verified').length || 0,
              phoneCount: factors.phone?.filter(f => f.status === 'verified').length || 0
            }, 'info');
            setNeeds2FA(true);
            setPendingUser(data.user);
            setIsLoading(false);
            return;
          }
        }
      }
      
      toast({
        title: 'Login successful',
        description: 'Welcome back! Redirecting...',
      });

      // Reset redirect attempts counter
      redirectAttempts[1](0);

      if (location.state?.from) {
        setRedirectTo(location.state.from);
      } else {
        const lastPath = getLastVisitedPath();
        // Save dashboard as the destination, in case redirection fails
        saveCurrentPath('/dashboard');
        setRedirectTo(lastPath || '/dashboard');
      }
    } catch (error: any) {
      handleError(error, 'LoginForm.handleSubmit');
      
      if (error.message?.includes('email') && error.message?.includes('verification')) {
        toast({
          title: "Email verification required",
          description: "Please check your inbox and verify your email before logging in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: 'Login failed',
          description: error.message || 'Invalid email or password.',
          variant: 'destructive',
        });
      }
      
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      logDebug('Google sign in attempt', null, 'info');
      await signInWithOAuth('google');
    } catch (error: any) {
      handleError(error, 'LoginForm.handleGoogleSignIn');
      setIsGoogleLoading(false);
    }
  };
  
  const handleDiscordLogin = async () => {
    try {
      setIsDiscordLoading(true);
      logDebug('Discord sign in attempt', null, 'info');
      await signInWithOAuth('discord');
    } catch (error: any) {
      handleError(error, 'LoginForm.handleDiscordLogin');
      setIsDiscordLoading(false);
    }
  };

  // 2FA verification handlers
  const handle2FAVerified = () => {
    logDebug('2FA verification successful, completing login', null, 'info');
    setNeeds2FA(false);
    setPendingUser(null);
    
    toast({
      title: 'Login successful',
      description: 'Welcome back! Redirecting...',
    });

    // Reset redirect attempts counter
    redirectAttempts[1](0);

    if (location.state?.from) {
      setRedirectTo(location.state.from);
    } else {
      const lastPath = getLastVisitedPath();
      saveCurrentPath('/dashboard');
      setRedirectTo(lastPath || '/dashboard');
    }
  };

  const handle2FACancel = () => {
    setNeeds2FA(false);
    setPendingUser(null);
    setShowRecoveryKey(false);
  };

  const handleShowRecoveryKey = () => {
    setShowRecoveryKey(true);
  };

  const handleBackTo2FA = () => {
    setShowRecoveryKey(false);
  };
  
  // Show MFA verification if needed
  if (needs2FA && !showRecoveryKey) {
    return (
      <MFAVerification
        onVerified={handle2FAVerified}
        onCancel={handle2FACancel}
        onUseRecoveryKey={handleShowRecoveryKey}
      />
    );
  }

  // Show recovery key verification if needed
  if (needs2FA && showRecoveryKey) {
    return (
      <MFARecovery
        onVerified={handle2FAVerified}
        onBack={handleBackTo2FA}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {emailVerificationNeeded && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email Verification Pending</AlertTitle>
              <AlertDescription>
                Please check your email inbox (and spam folder) to verify your account before logging in.
              </AlertDescription>
            </Alert>
          )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading || isDiscordLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading || isDiscordLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember-me" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              disabled={isLoading || isGoogleLoading || isDiscordLoading}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isDiscordLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Login
          </Button>
        </form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading || isDiscordLoading}>
            {isGoogleLoading ? <Spinner size="sm" className="mr-2" /> : null} Google
          </Button>
          <Button variant="outline" onClick={handleDiscordLogin} disabled={isLoading || isGoogleLoading || isDiscordLoading}>
            {isDiscordLoading ? <Spinner size="sm" className="mr-2" /> : null} Discord
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-center block">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;

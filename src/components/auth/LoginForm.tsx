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
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { login, signInWithOAuth, signInWithMagicLink, userProfile, user, loading: authLoading } = useAuth();
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

  const handleMagicLinkLogin = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address to receive a magic link.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsMagicLinkLoading(true);
      logDebug('Magic link sign in attempt', { email }, 'info');
      
      // Check if the function exists before calling
      if (typeof signInWithMagicLink !== 'function') {
        throw new Error('Magic link authentication is not available');
      }
      
      await signInWithMagicLink(email);
      
      setMagicLinkSent(true);
      toast({
        title: 'Magic link sent!',
        description: 'Check your email for a magic link to sign in.',
      });
    } catch (error: any) {
      console.error('Magic link error:', error);
      handleError(error, 'LoginForm.handleMagicLinkLogin');
      
      let errorMessage = 'Could not send magic link. Please try again.';
      
      if (error.message?.includes('not available')) {
        errorMessage = 'Magic link authentication is not available. Please use password login.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      }
      
      toast({
        title: 'Failed to send magic link',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsMagicLinkLoading(false);
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
              disabled={isLoading || isGoogleLoading || isDiscordLoading || isMagicLinkLoading}
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
              disabled={isLoading || isGoogleLoading || isDiscordLoading || isMagicLinkLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember-me" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              disabled={isLoading || isGoogleLoading || isDiscordLoading || isMagicLinkLoading}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isDiscordLoading || isMagicLinkLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Login
          </Button>
        </form>
        
        {magicLinkSent ? (
          <div className="text-center space-y-4 p-4 bg-primary/10 rounded-lg">
            <div className="p-3 bg-primary/20 rounded-full inline-flex mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-6 w-6">
                <rect width="16" height="13" x="4" y="5" rx="2"/>
                <path d="m4 8 8 5 8-5"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium">Magic link sent!</h3>
            <p className="text-muted-foreground">
              Check your email for a magic link to sign in. You can close this tab and return after clicking the link.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setMagicLinkSent(false)}
              className="mt-2"
            >
              Try another method
            </Button>
          </div>
        ) : (
          <>
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
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={handleMagicLinkLogin} 
                disabled={isLoading || isGoogleLoading || isDiscordLoading || isMagicLinkLoading}
                className="w-full"
              >
                {isMagicLinkLoading ? <Spinner size="sm" className="mr-2" /> : null}
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                  <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                  <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
                </svg>
                Send Magic Link
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading || isDiscordLoading || isMagicLinkLoading}>
                  {isGoogleLoading ? <Spinner size="sm" className="mr-2" /> : null} Google
                </Button>
                <Button variant="outline" onClick={handleDiscordLogin} disabled={isLoading || isGoogleLoading || isDiscordLoading || isMagicLinkLoading}>
                  {isDiscordLoading ? <Spinner size="sm" className="mr-2" /> : null} Discord
                </Button>
              </div>
            </div>
          </>
        )}
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

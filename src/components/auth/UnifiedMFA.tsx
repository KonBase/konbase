import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  ShieldCheck, 
  AlertTriangle, 
  Settings, 
  Plus, 
  Trash2, 
  Smartphone, 
  Key,
  CheckCircle,
  Clock,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMFAFactors, updateMFAStatus } from '@/utils/mfa-utils';
import { supabase } from '@/lib/supabase';

interface MFAFactor {
  id: string;
  factor_type: 'totp' | 'phone';
  friendly_name?: string;
  status: 'verified' | 'unverified';
  phone?: string;
  created_at: string;
}

type MFAView = 'status' | 'setup' | 'management';

const UnifiedMFA: React.FC = () => {
  const [currentView, setCurrentView] = useState<MFAView>('status');
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  // Setup state
  const [setupType, setSetupType] = useState<'totp' | 'phone'>('totp');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSecretCopied, setIsSecretCopied] = useState(false);
  
  // Phone setup state
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isChallenging, setIsChallenging] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const factorsData = await getMFAFactors();
      setFactors(factorsData.all);
    } catch (error: unknown) {
      console.error('Error loading MFA factors:', error);
      setError(error instanceof Error ? error.message : 'Failed to load MFA status');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFactor = async (factorId: string) => {
    if (!window.confirm('Are you sure you want to remove this MFA factor? You will need to set it up again if you wish to use it.')) {
      return;
    }

    try {
      setIsRemoving(factorId);
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      
      if (error) throw error;

      toast({
        title: "Factor Removed",
        description: "The MFA factor has been successfully removed.",
      });

      await loadFactors();
      
      // Update database status
      const factorsData = await getMFAFactors();
      const hasVerifiedFactors = factorsData.verified.length > 0;
      await updateMFAStatus(hasVerifiedFactors);
    } catch (error: unknown) {
      console.error('Error removing MFA factor:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove MFA factor",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const startSetup = async () => {
    try {
      setIsEnrolling(true);
      setError(null);

      // Check for existing factors
      const factorsData = await getMFAFactors();
      const verifiedFactors = factorsData.verified;
      
      if (verifiedFactors.length > 0) {
        toast({
          title: "MFA Already Set Up",
          description: "You already have verified MFA factors. Use the management interface to add more.",
        });
        setCurrentView('management');
        return;
      }

      // Clean up unverified factors
      const unverifiedFactors = factorsData.all.filter(f => f.status === 'unverified');
      for (const factor of unverifiedFactors) {
        try {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        } catch (err) {
          console.warn(`Failed to remove unverified factor ${factor.id}:`, err);
        }
      }

      if (unverifiedFactors.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Start enrollment
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: setupType,
        friendlyName: setupType === 'totp' ? 'KonBase Authenticator' : 'KonBase Phone MFA',
        ...(setupType === 'phone' && { phone: phoneNumber })
      });

      if (error) throw error;

      setFactorId(data.id);
      if (setupType === 'totp') {
        setSecret(data.totp?.secret || null);
        setQrCode(data.totp?.qr_code || null);
      } else {
        // For phone, automatically send challenge
        await sendChallenge(data.id);
      }
    } catch (error: unknown) {
      console.error('Error starting MFA setup:', error);
      setError(error instanceof Error ? error.message : 'Failed to start MFA setup');
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: error instanceof Error ? error.message : "Failed to start MFA setup",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const sendChallenge = async (id: string) => {
    try {
      setIsChallenging(true);
      const { data, error } = await supabase.auth.mfa.challenge({ factorId: id });
      if (error) throw error;
      setChallengeId(data.id);
      toast({
        title: "Code Sent",
        description: "A verification code has been sent to your phone.",
      });
    } catch (error: unknown) {
      console.error('Error sending challenge:', error);
      setError(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setIsChallenging(false);
    }
  };

  const verifyAndComplete = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit code.",
      });
      return;
    }

    if (!factorId) {
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: "No factor ID available. Please restart the setup process.",
      });
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      const challengeIdToUse = challengeId || (await supabase.auth.mfa.challenge({ factorId })).data.id;
      
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeIdToUse,
        code: verificationCode
      });

      if (error) throw error;

      if (data) {
        await updateMFAStatus(true);
        toast({
          title: "MFA Enabled Successfully",
          description: "Your account is now protected with two-factor authentication.",
        });
        
        await loadFactors();
        setCurrentView('status');
        resetSetupState();
      }
    } catch (error: unknown) {
      console.error('Error verifying MFA:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify code');
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "The code you entered is incorrect. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = async () => {
    if (!secret) return;
    
    try {
      await navigator.clipboard.writeText(secret);
      setIsSecretCopied(true);
      toast({
        title: "Secret Copied",
        description: "The secret code has been copied to your clipboard.",
      });
      
      setTimeout(() => setIsSecretCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy secret:', error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy the secret code. Please try again.",
      });
    }
  };

  const resetSetupState = () => {
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerificationCode('');
    setChallengeId(null);
    setPhoneNumber('');
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    
    if (value.length === 6) {
      setTimeout(() => verifyAndComplete(), 500);
    }
  };

  const verifiedFactors = factors.filter(f => f.status === 'verified');
  const isEnabled = verifiedFactors.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading MFA status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Status View
  if (currentView === 'status') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            {isEnabled 
              ? `Your account is protected with ${verifiedFactors.length} verified factor${verifiedFactors.length === 1 ? '' : 's'}` 
              : "Add an extra layer of security to your account"
            }
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

          {isEnabled ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="default" className="bg-green-500">
                    Enabled ({verifiedFactors.length} verified)
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Active Factors:</span>
                  {verifiedFactors.map((factor) => (
                    <div key={factor.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {factor.factor_type === 'totp' ? (
                          <Key className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <div className="text-sm font-medium">
                            {factor.friendly_name || `${factor.factor_type.toUpperCase()} Authenticator`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {factor.factor_type} • {factor.status}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFactor(factor.id)}
                        disabled={isRemoving === factor.id}
                      >
                        {isRemoving === factor.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button onClick={() => setCurrentView('setup')} variant="outline" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Factor
                </Button>
                <Button onClick={() => setCurrentView('management')} className="flex-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-6">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-6">
                  Protect your account with two-factor authentication using an authenticator app or phone number.
                </p>
              </div>
              
              <Button onClick={() => setCurrentView('setup')} className="w-full" size="lg">
                <Shield className="h-5 w-5 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Setup View
  if (currentView === 'setup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Choose your preferred method to secure your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Setup Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!factorId ? (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={setupType === 'totp' ? 'default' : 'outline'}
                    onClick={() => setSetupType('totp')}
                    className="h-20 flex-col gap-2"
                  >
                    <Key className="h-6 w-6" />
                    <span>Authenticator App</span>
                  </Button>
                  <Button
                    variant={setupType === 'phone' ? 'default' : 'outline'}
                    onClick={() => setSetupType('phone')}
                    className="h-20 flex-col gap-2"
                  >
                    <Smartphone className="h-6 w-6" />
                    <span>Phone Number</span>
                  </Button>
                </div>

                {setupType === 'phone' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      disabled={isEnrolling}
                    />
                  </div>
                )}

                <Button 
                  onClick={startSetup} 
                  className="w-full" 
                  disabled={isEnrolling || (setupType === 'phone' && !phoneNumber)}
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Start Setup
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {setupType === 'totp' && qrCode && secret && (
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Scan QR Code</h3>
                  <div className="flex justify-center">
                    <img src={qrCode} alt="MFA QR Code" className="border rounded-lg" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Can't scan the QR code?</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Enter this secret key manually in your authenticator app:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-background border rounded text-sm font-mono break-all">
                        {secret}
                      </code>
                      <Button variant="outline" size="sm" onClick={copySecret}>
                        {isSecretCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={handleInputChange}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-center text-lg font-mono tracking-widest"
                    disabled={isVerifying}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the 6-digit code from your {setupType === 'totp' ? 'authenticator app' : 'phone'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={verifyAndComplete}
                    disabled={verificationCode.length !== 6 || isVerifying}
                    className="flex-1"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </Button>
                  {setupType === 'phone' && challengeId && (
                    <Button
                      variant="outline"
                      onClick={() => sendChallenge(factorId!)}
                      disabled={isChallenging}
                    >
                      {isChallenging ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        'Resend Code'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentView('status');
                resetSetupState();
              }} 
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Management View
  if (currentView === 'management') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage MFA Factors
          </CardTitle>
          <CardDescription>
            View, add, or remove your two-factor authentication factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {factors.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No MFA Factors Configured</AlertTitle>
              <AlertDescription>
                You currently do not have any two-factor authentication factors set up.
                Click "Add New Factor" to enhance your account security.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Your MFA Factors ({factors.length})</h3>
              {factors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {factor.factor_type === 'totp' ? (
                      <Key className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {factor.friendly_name || `Factor (${factor.factor_type})`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Type: {factor.factor_type}
                        {factor.factor_type === 'phone' && factor.phone && ` - ${factor.phone}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Added: {new Date(factor.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={factor.status === 'verified' ? 'default' : 'secondary'}
                      className={factor.status === 'verified' ? 'bg-green-500' : ''}
                    >
                      {factor.status === 'verified' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {factor.status}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFactor(factor.id)}
                      disabled={isRemoving === factor.id || factor.status !== 'verified'}
                    >
                      {isRemoving === factor.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Add New Factor</h3>
            <Button
              className="w-full gap-2"
              onClick={() => setCurrentView('setup')}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              Add New Authenticator
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setCurrentView('status')} 
            className="w-full"
          >
            Back to Status
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default UnifiedMFA;

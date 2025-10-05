import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface MFAVerificationProps {
  onVerified: () => void;
  onCancel: () => void;
  onUseRecoveryKey: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({
  onVerified,
  onCancel,
  onUseRecoveryKey,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit code from your authenticator app.",
      });
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // Get the current session to find the pending MFA challenge
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found');
      }

      // Get the MFA factors for the user
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError || !factors.totp || factors.totp.length === 0) {
        throw new Error('No TOTP factors found');
      }

      // Use the first TOTP factor for verification
      const totpFactor = factors.totp[0];
      
      // Step 1: Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });

      if (challengeError) {
        throw challengeError;
      }

      // Step 2: Verify the TOTP code
      const { data, error } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (error) {
        throw error;
      }

      if (data) {
        toast({
          title: "Verification Successful",
          description: "You have been successfully authenticated.",
        });
        onVerified();
      }
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      setError(error.message || 'Failed to verify code');
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "The code you entered is incorrect. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      setTimeout(() => {
        verifyCode();
      }, 500);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={verifyCode}
              disabled={verificationCode.length !== 6 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          <div className="text-center">
            <Button variant="link" onClick={onUseRecoveryKey} className="text-sm">
              Use recovery code instead
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MFAVerification;
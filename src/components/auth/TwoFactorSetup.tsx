'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Copy, Check, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';
import { logDebug } from '@/utils/debug';
import { isDebugModeEnabled } from '@/utils/debug';

interface TwoFactorSetupProps {
  onVerified: (secret: string) => void;
  onCancel: () => void;
  errorMessage: string | null;
  setErrorMessage: (error: string | null) => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onVerified,
  onCancel,
  errorMessage,
  setErrorMessage,
}) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(isDebugModeEnabled());

  const { toast } = useToast();

  const startSetup = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setSetupError(null);
      setDebugInfo(null);

      logDebug('Starting 2FA setup', null, 'info');

      const { data, error } = await supabase.functions.invoke(
        'generate-totp-secret',
      );

      if (error) {
        logDebug('Error generating TOTP secret:', error, 'error');
        setSetupError(`Error contacting server: ${error.message}`);
        throw error;
      }

      if (data && data.secret) {
        const { secret, keyUri } = data;
        setSecret(secret);

        logDebug(
          'TOTP secret generated successfully',
          { secretLength: secret.length, keyUri },
          'info',
        );

        try {
          const qrCodeImage = await QRCode.toDataURL(keyUri);
          setQrCode(qrCodeImage);
        } catch (err) {
          logDebug('Error generating QR code:', err, 'error');
          setSetupError(
            'Failed to generate QR code. Please use the manual code instead.',
          );
          toast({
            variant: 'destructive',
            title: 'Error generating QR code',
            description: 'Please try again or use the manual code instead.',
          });
        }
      }
    } catch (error: any) {
      console.error('Error setting up 2FA:', error);
      setSetupError(`Failed to set up 2FA: ${error.message}`);
      setErrorMessage(`Failed to set up 2FA. ${error.message}`);
      toast({
        variant: 'destructive',
        title: 'Error setting up 2FA',
        description:
          'There was a problem generating your 2FA secret. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copySecretToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setHasCopied(true);
      toast({
        title: 'Secret copied',
        description: 'The secret key has been copied to your clipboard.',
      });

      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    }
  };

  const verifyAndEnable = async () => {
    if (!secret || verificationCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid code',
        description: 'Please enter a valid 6-digit verification code.',
      });
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage(null);
      setSetupError(null);
      setVerificationAttempts((prev) => prev + 1);

      // Clean up token input
      const cleanToken = verificationCode.trim().replace(/\s/g, '');

      logDebug(
        'Verifying TOTP',
        {
          secretLength: secret.length,
          token: cleanToken,
          tokenLength: cleanToken.length,
          attempt: verificationAttempts + 1,
        },
        'info',
      );

      const { data, error } = await supabase.functions.invoke('verify-totp', {
        body: {
          secret,
          token: cleanToken,
        },
      });

      if (error) {
        logDebug('Verification API error:', error, 'error');
        setSetupError(`Verification API error: ${error.message}`);
        throw error;
      }

      logDebug('TOTP verification response', { data }, 'info');

      // Store server response for debugging
      setDebugInfo(data);

      if (data && data.verified) {
        logDebug('TOTP verification successful', null, 'info');
        onVerified(secret);

        toast({
          title: 'Verification successful',
          description:
            'Your verification code is correct. Please save your recovery keys.',
        });
      } else {
        setVerificationCode('');
        setSetupError(
          `Verification failed. Please try a new code. ${data?.error || ''}`,
        );
        toast({
          variant: 'destructive',
          title: 'Verification failed',
          description:
            'The verification code is incorrect or has expired. Please try again.',
        });
      }
    } catch (error: any) {
      console.error('Error verifying 2FA code:', error);
      setVerificationCode('');
      setSetupError(`Verification error: ${error.message}`);
      setErrorMessage(
        `Failed to verify code. Please try again with a new code.`,
      );
      toast({
        variant: 'destructive',
        title: 'Error verifying code',
        description:
          'There was a problem verifying your 2FA code. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Only auto-verify when manually submitted, not on every change
  const handleManualVerify = () => {
    if (verificationCode.length === 6 && secret) {
      verifyAndEnable();
    }
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo((prev) => !prev);
  };

  // Auto-start the setup process when the component mounts
  useEffect(() => {
    if (!qrCode && !secret && !isGenerating) {
      startSetup();
    }
  }, []);

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {setupError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Setup Error
          </AlertTitle>
          <AlertDescription>{setupError}</AlertDescription>
        </Alert>
      )}

      {qrCode ? (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={startSetup}
                disabled={isGenerating}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Regenerate
              </Button>
            </div>
            <div className="flex justify-center mb-4">
              <img
                src={qrCode}
                alt="QR Code for 2FA"
                className="border p-4 rounded-md"
                width="200"
                height="200"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-muted-foreground">
                Or enter this code manually in your authenticator app:
              </p>
              <div className="flex items-center space-x-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono break-all">
                  {secret}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copySecretToClipboard}
                  className="h-8 w-8"
                >
                  {hasCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="verification-code">
              Enter the 6-digit code from your authenticator app
            </Label>
            <div className="flex flex-col space-y-2">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} index={index} />
                    ))}
                  </InputOTPGroup>
                )}
              />
            </div>
          </div>

          {isDebugModeEnabled() && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDebugInfo}
                className="text-xs"
              >
                {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
              </Button>

              {showDebugInfo && debugInfo && (
                <div className="mt-2 p-2 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleManualVerify}
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-center mb-4">
            To set up two-factor authentication, you'll need an authenticator
            app like Google Authenticator, Authy, or Microsoft Authenticator.
          </p>
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating setup...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Setup failed</AlertTitle>
                <AlertDescription>
                  {setupError ||
                    'Could not generate 2FA setup. Please try again.'}
                </AlertDescription>
              </Alert>
              <Button
                onClick={startSetup}
                disabled={isGenerating}
                className="mx-auto block"
              >
                Retry Setup
              </Button>
            </div>
          )}
        </div>
      )}

      {secret && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <AlertTitle>Two-Factor Authentication Enabled</AlertTitle>
          <AlertDescription>
            Your account is protected with two-factor authentication.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export { TwoFactorSetup };

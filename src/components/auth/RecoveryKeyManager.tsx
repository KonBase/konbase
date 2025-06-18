'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logDebug } from '@/utils/debug';
import { isDebugModeEnabled } from '@/utils/debug';

interface RecoveryKeyManagerProps {
  secret: string;
  onComplete: () => void;
  onCancel: () => void;
  errorMessage: string | null;
  setErrorMessage: (error: string | null) => void;
}

const RecoveryKeyManager: React.FC<RecoveryKeyManagerProps> = ({
  secret,
  onComplete,
  onCancel,
  errorMessage,
  setErrorMessage,
}) => {
  const [recoveryKeys, setRecoveryKeys] = useState<string[]>([]);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [hasCopiedKeys, setHasCopiedKeys] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(isDebugModeEnabled());

  const { toast } = useToast();

  useEffect(() => {
    generateRecoveryKeys();
  }, []);

  const generateRecoveryKeys = async () => {
    try {
      setIsGeneratingKeys(true);
      setErrorMessage(null);
      setSetupError(null);

      logDebug('Generating recovery keys', null, 'info');

      const { data, error } = await supabase.functions.invoke(
        'generate-recovery-keys',
        {
          body: { count: 8 },
        },
      );

      if (error) {
        setSetupError(`Error generating recovery keys: ${error.message}`);
        throw error;
      }

      if (data && data.keys) {
        setRecoveryKeys(data.keys);
        logDebug(
          'Recovery keys generated successfully',
          { keyCount: data.keys.length },
          'info',
        );
      } else {
        setSetupError('No recovery keys were returned from the server');
      }
    } catch (error: any) {
      console.error('Error generating recovery keys:', error);
      setSetupError(`Failed to generate recovery keys: ${error.message}`);
      setErrorMessage('Failed to generate recovery keys. Please try again.');
      logDebug('Error generating recovery keys', error, 'error');
      toast({
        variant: 'destructive',
        title: 'Error generating recovery keys',
        description:
          'There was a problem generating recovery keys. Please try again.',
      });
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  const copyRecoveryKeys = () => {
    if (recoveryKeys.length > 0) {
      const keysText = recoveryKeys.join('\n');
      navigator.clipboard.writeText(keysText);
      setHasCopiedKeys(true);

      toast({
        title: 'Recovery keys copied',
        description:
          'Recovery keys have been copied to your clipboard. Store them securely.',
      });

      setTimeout(() => {
        setHasCopiedKeys(false);
      }, 2000);
    }
  };

  const downloadRecoveryKeys = () => {
    if (recoveryKeys.length === 0) return;

    const keysText = `KonBase 2FA Recovery Keys\n\nGenerated: ${new Date().toLocaleString()}\n\n${recoveryKeys.join('\n')}\n\nKeep these keys in a safe place. You'll need them if you lose access to your authenticator app.`;
    const blob = new Blob([keysText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'konbase-recovery-keys.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Recovery keys downloaded',
      description: 'Recovery keys have been downloaded. Store them securely.',
    });
  };

  const completeSetup = async () => {
    if (!hasConfirmedBackup) {
      toast({
        variant: 'destructive',
        title: 'Confirmation required',
        description: "Please confirm that you've backed up your recovery keys.",
      });
      return;
    }

    try {
      setIsEnabling(true);
      setErrorMessage(null);
      setSetupError(null);

      logDebug(
        'Completing 2FA setup',
        {
          secretLength: secret.length,
          recoveryKeysCount: recoveryKeys.length,
        },
        'info',
      );

      const { data, error } = await supabase.functions.invoke(
        'complete-2fa-setup',
        {
          body: {
            secret,
            recoveryKeys,
          },
        },
      );

      // Store response for debugging
      setDebugInfo(data);

      if (error) {
        console.error('Error from complete-2fa-setup function:', error);
        setSetupError(`API error: ${error.message}`);
        throw error;
      }

      if (data && !data.success) {
        setSetupError(data.error || 'Unknown server error occurred');
        throw new Error(data.error || 'Unknown error');
      }

      logDebug('2FA setup completed successfully', data, 'info');
      onComplete();

      toast({
        title: '2FA Enabled',
        description:
          'Two-factor authentication has been successfully enabled for your account.',
      });
    } catch (error: any) {
      console.error('Error completing 2FA setup:', error);
      logDebug('Error completing 2FA setup', error, 'error');

      // Try to extract a more specific error message if available
      let errorMsg = 'Failed to enable 2FA. Please try again.';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMsg = (error as any).message || (error as any).error || errorMsg;
      }

      setSetupError(errorMsg);
      setErrorMessage(errorMsg);
      toast({
        variant: 'destructive',
        title: 'Error enabling 2FA',
        description: errorMsg,
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo((prev) => !prev);
  };

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

      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          These recovery keys will only be shown once. If you lose them, you
          won't be able to recover your account if you lose access to your
          authenticator app.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Your Recovery Keys</h3>
        {recoveryKeys.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={generateRecoveryKeys}
            disabled={isGeneratingKeys}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Regenerate
          </Button>
        )}
      </div>

      {isGeneratingKeys ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Generating recovery keys...</span>
        </div>
      ) : (
        <>
          <div className="bg-muted p-4 rounded-md">
            <div className="grid grid-cols-2 gap-2">
              {recoveryKeys.map((key, index) => (
                <code key={index} className="font-mono text-sm">
                  {key}
                </code>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={copyRecoveryKeys}
              disabled={recoveryKeys.length === 0}
              className="flex items-center"
            >
              {hasCopiedKeys ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Keys
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={downloadRecoveryKeys}
              disabled={recoveryKeys.length === 0}
            >
              Download Keys
            </Button>
          </div>
        </>
      )}

      <div className="flex items-start space-x-2 pt-4">
        <Checkbox
          id="confirm-backup"
          checked={hasConfirmedBackup}
          onCheckedChange={(checked) =>
            setHasConfirmedBackup(checked as boolean)
          }
          disabled={recoveryKeys.length === 0}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="confirm-backup"
            className={recoveryKeys.length === 0 ? 'text-muted-foreground' : ''}
          >
            I have saved these recovery keys in a secure location
          </Label>
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

          {showDebugInfo && (
            <div className="mt-2 p-2 bg-muted rounded-md text-xs font-mono overflow-x-auto">
              <p>Secret Length: {secret.length}</p>
              <p>Recovery Keys Count: {recoveryKeys.length}</p>
              {debugInfo && <pre>{JSON.stringify(debugInfo, null, 2)}</pre>}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={completeSetup}
          disabled={
            !hasConfirmedBackup || isEnabling || recoveryKeys.length === 0
          }
        >
          {isEnabling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            'Enable 2FA'
          )}
        </Button>
      </div>
    </div>
  );
};

export { RecoveryKeyManager };

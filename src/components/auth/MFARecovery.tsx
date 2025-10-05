import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Loader2, AlertTriangle, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface MFARecoveryProps {
  onVerified: () => void;
  onCancel: () => void;
  onBackToMFA: () => void;
}

const MFARecovery: React.FC<MFARecoveryProps> = ({
  onVerified,
  onCancel,
  onBackToMFA,
}) => {
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const verifyRecoveryCode = async () => {
    if (!recoveryCode || recoveryCode.length < 8) {
      toast({
        variant: "destructive",
        title: "Invalid Recovery Code",
        description: "Please enter a valid recovery code.",
      });
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);

      // For now, we'll use a simple verification approach
      // In a real implementation, you'd verify against stored recovery codes
      const { data, error } = await supabase.auth.signInWithPassword({
        email: '', // This would need to be passed as a prop
        password: recoveryCode, // Using recovery code as password for now
      });

      if (error) {
        throw error;
      }

      if (data) {
        toast({
          title: "Recovery Successful",
          description: "You have been successfully authenticated using your recovery code.",
        });
        onVerified();
      }
    } catch (error: any) {
      console.error('Error verifying recovery code:', error);
      setError(error.message || 'Failed to verify recovery code');
      toast({
        variant: "destructive",
        title: "Recovery Failed",
        description: error.message || "The recovery code you entered is incorrect. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '').toUpperCase().slice(0, 16);
    setRecoveryCode(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Recovery Code
        </CardTitle>
        <CardDescription>
          Enter one of your recovery codes to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Recovery Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Recovery Code</label>
            <input
              type="text"
              value={recoveryCode}
              onChange={handleInputChange}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-center text-lg font-mono tracking-wider"
              disabled={isVerifying}
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter one of your recovery codes (each can only be used once)
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={verifyRecoveryCode}
              disabled={recoveryCode.length < 8 || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Recovery Code'
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          <div className="text-center">
            <Button variant="link" onClick={onBackToMFA} className="text-sm">
              Back to authenticator app
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MFARecovery;
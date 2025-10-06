import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SupabaseAuthDebug = () => {
  const [authMethods, setAuthMethods] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get available auth methods
    const client = getSupabaseClient();
    if (client?.auth) {
      const methods = Object.keys(client.auth);
      setAuthMethods(methods);
      console.log('Available Supabase auth methods:', methods);
    }
  }, []);

  const testMagicLink = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      const client = getSupabaseClient();
      console.log('Testing magic link with client:', client);
      console.log('client.auth:', client?.auth);
      console.log('signInWithOtp method:', client?.auth?.signInWithOtp);
      
      if (!client) {
        setTestResult('ERROR: Supabase client not available');
        return;
      }
      
      if (!client.auth) {
        setTestResult('ERROR: Supabase auth not available');
        return;
      }
      
      if (!client.auth.signInWithOtp) {
        setTestResult('ERROR: signInWithOtp method not found');
        return;
      }

      const { error } = await client.auth.signInWithOtp({
        email: 'test@example.com',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setTestResult(`ERROR: ${error.message}`);
      } else {
        setTestResult('SUCCESS: Magic link request sent (check email)');
      }
    } catch (err: any) {
      console.error('Magic link test error:', err);
      setTestResult(`EXCEPTION: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Supabase Auth Debug</CardTitle>
        <CardDescription>
          Debug information for Supabase authentication methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Available Auth Methods:</h3>
          <div className="grid grid-cols-2 gap-2">
            {authMethods.map((method) => (
              <div key={method} className="p-2 bg-muted rounded text-sm">
                {method}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Magic Link Test:</h3>
          <Button onClick={testMagicLink} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test Magic Link'}
          </Button>
          {testResult && (
            <div className={`mt-2 p-2 rounded text-sm ${
              testResult.startsWith('SUCCESS') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {testResult}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Supabase Client Info:</h3>
          <div className="text-sm space-y-1">
            <div>URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
            <div>Anon Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
            <div>Client: {getSupabaseClient() ? '✅ Initialized' : '❌ Not initialized'}</div>
            <div>Auth: {getSupabaseClient()?.auth ? '✅ Available' : '❌ Not available'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseAuthDebug;

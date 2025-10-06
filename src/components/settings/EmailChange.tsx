import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { useSensitiveAction } from '@/components/auth/withReauth';
import { logDebug, handleError } from '@/utils/debug';
import { Mail, Shield, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  newEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  confirmEmail: z.string().email({
    message: 'Please enter a valid email address.',
  }),
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ["confirmEmail"],
});

type FormValues = z.infer<typeof formSchema>;

const EmailChange = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const sensitiveAction = useSensitiveAction({
    actionName: 'change your email address',
    requirePassword: true,
    requireMFA: false,
    timeout: 10, // 10 minutes for email changes
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newEmail: '',
      confirmEmail: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (values.newEmail === user?.email) {
      toast({
        variant: "destructive",
        title: "Same email address",
        description: "The new email address is the same as your current email address.",
      });
      return;
    }

    // Use sensitive action wrapper to require re-authentication
    sensitiveAction(async () => {
      setIsLoading(true);
      
      try {
        logDebug('Attempting to change email', { 
          currentEmail: user?.email, 
          newEmail: values.newEmail 
        }, 'info');

        // Update the user's email address
        const { error } = await supabase.auth.updateUser({
          email: values.newEmail
        });

        if (error) {
          throw error;
        }

        setIsEmailSent(true);
        logDebug('Email change request sent successfully', null, 'info');
        
        toast({
          title: "Email change initiated",
          description: "Please check your new email address for a confirmation link to complete the change.",
        });

        // Reset the form
        form.reset();
      } catch (error: any) {
        handleError(error, 'EmailChange.onSubmit');
        
        let errorMessage = "Failed to initiate email change. Please try again.";
        
        if (error.message?.includes('email')) {
          if (error.message.includes('already registered')) {
            errorMessage = "This email address is already registered to another account.";
          } else if (error.message.includes('invalid')) {
            errorMessage = "Please enter a valid email address.";
          }
        }
        
        toast({
          variant: "destructive",
          title: "Email change failed",
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    });
  };

  if (isEmailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Change Request Sent
          </CardTitle>
          <CardDescription>
            Check your new email address for a confirmation link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We've sent a confirmation email to your new email address. 
              Please check your inbox (and spam folder) and click the confirmation link 
              to complete the email change process.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Important:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>You'll need to use your new email address to sign in after confirmation</li>
              <li>The confirmation link will expire in 24 hours</li>
              <li>Your current email address will remain active until confirmed</li>
            </ul>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setIsEmailSent(false)}
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Change Email Address
        </CardTitle>
        <CardDescription>
          Update your email address for sign-in and notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Current Email:</span>
              <span className="text-muted-foreground">{user?.email}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="newemail@example.com" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="newemail@example.com" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Note:</strong> Changing your email address will require 
                  confirmation via the new email address. You'll need to use the new email 
                  to sign in after the change is confirmed.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Sending Confirmation...
                  </>
                ) : (
                  'Change Email Address'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailChange;

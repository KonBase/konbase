'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { logDebug, handleError } from '@/utils/debug';
import { useAuth } from '@/contexts/auth';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  invitationCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const RegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { signInWithOAuth } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      invitationCode: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      logDebug(
        'Register attempt',
        {
          email: values.email,
          name: values.name,
          hasInvitationCode: !!values.invitationCode,
        },
        'info',
      );

      // First, check if the invitation code exists and is valid (if provided)
      let associationInvitation = null;
      let conventionInvitation = null;
      let invitationType = null;

      if (values.invitationCode) {
        // Check for association invitation
        const { data: assocData, error: assocError } = await supabase
          .from('association_invitations')
          .select('*')
          .eq('code', values.invitationCode)
          .eq('used', false)
          .maybeSingle();

        if (assocError) {
          logDebug(
            'Error checking association invitation',
            assocError,
            'error',
          );
        } else if (assocData) {
          associationInvitation = assocData;
          invitationType = 'association';
          logDebug(
            'Found valid association invitation',
            { id: assocData.id, role: assocData.role },
            'info',
          );
        }

        // If no association invitation found, check for convention invitation
        if (!associationInvitation) {
          const { data: convData, error: convError } = await supabase
            .from('convention_invitations')
            .select('*')
            .eq('code', values.invitationCode)
            .gt('uses_remaining', 0)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

          if (convError) {
            logDebug(
              'Error checking convention invitation',
              convError,
              'error',
            );
          } else if (convData) {
            conventionInvitation = convData;
            invitationType = 'convention';
            logDebug(
              'Found valid convention invitation',
              { id: convData.id, role: convData.role },
              'info',
            );
          }
        }
      }

      // Register the user
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            invitation_code: values.invitationCode || null,
            invitation_type: invitationType,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        logDebug(
          'User registered with session',
          { userId: data.user?.id },
          'info',
        );

        // If we have an invitation, process it
        if (associationInvitation) {
          // Add user to association with proper role
          const { error: memberError } = await supabase
            .from('association_members')
            .insert({
              user_id: data.user.id,
              association_id: associationInvitation.association_id,
              role: associationInvitation.role,
            });

          if (memberError) {
            logDebug('Error adding user to association', memberError, 'error');
            toast({
              variant: 'destructive',
              title: 'Error setting up association access',
              description:
                'Your account was created but there was an issue with your association access. Please contact an administrator.',
            });
          } else {
            // Update user's primary association and role in profile
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                association_id: associationInvitation.association_id,
                role: associationInvitation.role,
              })
              .eq('id', data.user.id);

            if (profileError) {
              logDebug(
                'Error updating user profile with association',
                profileError,
                'error',
              );
            }

            // Mark invitation as used
            const { error: invitationError } = await supabase
              .from('association_invitations')
              .update({
                used: true,
                used_by: data.user.id,
                used_at: new Date().toISOString(),
              })
              .eq('id', associationInvitation.id);

            if (invitationError) {
              logDebug(
                'Error marking invitation as used',
                invitationError,
                'error',
              );
            }
          }

          // Redirect to dashboard
          router.push('/dashboard');
        } else if (conventionInvitation) {
          // Add user to convention access with proper role
          const { error: accessError } = await supabase
            .from('convention_access')
            .insert({
              user_id: data.user.id,
              convention_id: conventionInvitation.convention_id,
              role: conventionInvitation.role,
              invitation_code: values.invitationCode,
            });

          if (accessError) {
            logDebug('Error adding user to convention', accessError, 'error');
            toast({
              variant: 'destructive',
              title: 'Error setting up convention access',
              description:
                'Your account was created but there was an issue with your convention access. Please contact an administrator.',
            });
          } else {
            // Decrease the uses_remaining count for the invitation
            const { error: invitationError } = await supabase
              .from('convention_invitations')
              .update({
                uses_remaining: conventionInvitation.uses_remaining - 1,
              })
              .eq('id', conventionInvitation.id);

            if (invitationError) {
              logDebug(
                'Error updating invitation uses count',
                invitationError,
                'error',
              );
            }
          }

          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          // No invitation - redirect to create first association
          router.push('/setup');
        }
      } else {
        logDebug('User registered, email confirmation required', null, 'info');
        toast({
          title: 'Account created!',
          description: 'Please check your email to verify your account.',
        });
        router.push('/login');
      }
    } catch (error: any) {
      handleError(error, 'RegisterForm.onSubmit');
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      logDebug('Google sign up attempt', null, 'info');
      await signInWithOAuth('google');
      // Redirect happens automatically via the OAuth provider
    } catch (error: any) {
      handleError(error, 'RegisterForm.handleGoogleSignUp');
      setIsGoogleLoading(false);
    }
  };

  const handleDiscordSignUp = async () => {
    try {
      setIsDiscordLoading(true);
      logDebug('Discord sign up attempt', null, 'info');
      await signInWithOAuth('discord');
      // Redirect happens automatically via the OAuth provider
    } catch (error: any) {
      handleError(error, 'RegisterForm.handleDiscordSignUp');
      setIsDiscordLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invitationCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invitation Code (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter invitation code if you have one"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <Spinner className="mr-2" /> Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <span className="flex items-center justify-center">
              <Spinner className="mr-2" /> Google...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleDiscordSignUp}
          disabled={isDiscordLoading}
        >
          {isDiscordLoading ? (
            <span className="flex items-center justify-center">
              <Spinner className="mr-2" /> Discord...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg
                className="mr-2 h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.375-.444.864-.608 1.25a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.25.077.077 0 0 0-.079-.036A19.496 19.496 0 0 0 3.677 4.492a.07.07 0 0 0-.032.027C.533 9.884-.32 15.116.099 20.276a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.127c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.892a.077.077 0 0 0-.041.106c.36.698.772 1.362 1.225 1.994a.076.076 0 0 0 .084.028 19.834 19.834 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-10.376-3.549-14.629a.061.061 0 0 0-.031-.03zM8.02 16.5c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                  fill="#5865F2"
                />
              </svg>
              Discord
            </span>
          )}
        </Button>
      </div>
    </>
  );
};

export default RegisterForm;

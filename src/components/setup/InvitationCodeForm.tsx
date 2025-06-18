'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { logDebug, handleError } from '@/utils/debug';

const formSchema = z.object({
  invitationCode: z.string().min(6, {
    message: 'Invitation code must be at least 6 characters.',
  }),
});

interface InvitationCodeFormProps {
  onSuccess?: () => void;
}

const InvitationCodeForm = ({ onSuccess }: InvitationCodeFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invitationCode: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to use an invitation code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      logDebug('Validating invitation code', { code: values.invitationCode });

      // Find the invitation
      const { data: invitationData, error: invitationError } = await supabase
        .from('association_invitations')
        .select('*')
        .eq('code', values.invitationCode)
        .single();

      if (invitationError) {
        if (invitationError.code === 'PGRST116') {
          throw new Error(
            'Invalid invitation code. Please check and try again.',
          );
        }
        throw invitationError;
      }

      if (!invitationData) {
        throw new Error('Invalid invitation code. Please check and try again.');
      }

      // Check if invitation has expired
      const now = new Date();
      const expiresAt = new Date(invitationData.expires_at);

      if (now > expiresAt) {
        throw new Error('This invitation code has expired.');
      }

      // Create association member entry
      const { error: memberError } = await supabase
        .from('association_members')
        .insert({
          association_id: invitationData.association_id,
          user_id: user.id,
        });

      if (memberError) {
        // Check if it's a duplicate key error
        if (memberError.code === '23505') {
          throw new Error('You are already a member of this association.');
        }
        throw memberError;
      }

      toast({
        title: 'Success!',
        description: 'You have successfully joined the association.',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (error: any) {
      handleError(error, 'InvitationCodeForm.onSubmit');
      toast({
        title: 'Error',
        description: error.message || 'Failed to process invitation code.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="invitationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invitation Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter your invitation code" {...field} />
              </FormControl>
              <FormDescription>
                Please enter the invitation code you received from your
                association admin.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center">
              <Spinner className="mr-2" /> Joining...
            </span>
          ) : (
            'Join Association'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default InvitationCodeForm;

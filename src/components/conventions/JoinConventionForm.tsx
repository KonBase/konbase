'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const JoinConventionForm = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invitation code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to join a convention',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      // Find the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('convention_invitations')
        .select('*')
        .eq('code', inviteCode.trim())
        .single();

      if (inviteError || !invitation) {
        toast({
          title: 'Invalid Code',
          description: 'The invitation code is invalid or has expired',
          variant: 'destructive',
        });
        return;
      }

      // Check if the invitation is expired
      if (
        invitation.expires_at &&
        new Date(invitation.expires_at) < new Date()
      ) {
        toast({
          title: 'Expired Code',
          description: 'This invitation code has expired',
          variant: 'destructive',
        });
        return;
      }

      // Check if the invitation has uses remaining
      if (
        invitation.uses_remaining !== null &&
        invitation.uses_remaining <= 0
      ) {
        toast({
          title: 'Used Code',
          description: 'This invitation code has already been used',
          variant: 'destructive',
        });
        return;
      }

      // Add user to convention_access
      const { error: accessError } = await supabase
        .from('convention_access')
        .insert({
          convention_id: invitation.convention_id,
          user_id: user.user.id,
          invitation_code: invitation.code,
        });

      if (accessError) throw accessError;

      // Decrement uses remaining if applicable
      if (invitation.uses_remaining !== null) {
        const { error: updateError } = await supabase
          .from('convention_invitations')
          .update({ uses_remaining: invitation.uses_remaining - 1 })
          .eq('id', invitation.id);

        if (updateError)
          console.error('Error updating invitation uses:', updateError);
      }

      toast({
        title: 'Success',
        description: 'You have joined the convention successfully',
      });

      // Navigate to the convention page
      router.push(`/conventions/${invitation.convention_id}`);
    } catch (error: any) {
      console.error('Error joining convention:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Convention</CardTitle>
        <CardDescription>
          Enter an invitation code to join a convention
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="code">Invitation Code</Label>
              <Input
                id="code"
                placeholder="Enter invitation code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push('/')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Convention'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default JoinConventionForm;

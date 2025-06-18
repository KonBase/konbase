'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { UserPlus, Copy } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Convention } from '@/types/convention';
import { format } from 'date-fns';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type FormValues = z.infer<typeof formSchema>;

export const InviteHelperDialog = ({
  convention,
  onInviteSent,
}: {
  convention: Convention;
  onInviteSent?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleGenerateInvite = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error } = await supabase.from('convention_invitations').insert({
        code,
        convention_id: convention.id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
        expires_at: format(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd'T'HH:mm:ssXXX",
        ),
        uses_remaining: 1,
      });

      if (error) throw error;

      setInviteCode(code);

      toast({
        title: 'Invitation Generated',
        description: `Invitation code created for ${values.email}.`,
      });

      if (onInviteSent) onInviteSent();
    } catch (error: any) {
      console.error('Error generating invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast({
        title: 'Copied to clipboard',
        description: 'The invitation code has been copied to your clipboard.',
      });
    }
  };

  const resetForm = () => {
    setInviteCode(null);
    form.reset();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Helper
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Convention Helper</DialogTitle>
          <DialogDescription>
            Invite someone to help with "{convention.name}".
          </DialogDescription>
        </DialogHeader>

        {!inviteCode ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleGenerateInvite)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="border p-4 rounded-md bg-muted">
              <Label className="block mb-2">Invitation Code</Label>
              <div className="flex items-center justify-between">
                <code className="font-mono text-lg">{inviteCode}</code>
                <Button variant="ghost" size="sm" onClick={copyInviteCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This code is valid for 7 days and can be used once. Share it with
              the helper to allow them to access this convention.
            </p>

            <DialogFooter>
              <Button type="button" onClick={() => setIsOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteHelperDialog;

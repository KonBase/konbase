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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { UserPlus, Copy } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTypeSafeSupabase } from '@/hooks/useTypeSafeSupabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['member', 'manager', 'admin']),
  createAccount: z.boolean().default(false),
  name: z.string().optional(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

const InviteMemberDialog = ({
  onInviteSent,
}: {
  onInviteSent?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('invite');
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  const { safeInsert } = useTypeSafeSupabase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'member',
      createAccount: false,
      name: '',
      password: '',
    },
  });

  const watchCreateAccount = form.watch('createAccount');

  const handleInvite = async (values: FormValues) => {
    if (!currentAssociation) {
      toast({
        title: 'Error',
        description: 'No association selected',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // If creating a new account directly
      if (values.createAccount && values.name && values.password) {
        // Create new user via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: values.email,
            password: values.password,
            options: {
              data: {
                name: values.name,
                role: values.role,
              },
            },
          },
        );

        if (authError) throw authError;

        if (authData.user) {
          // Add the new user to the association_members table
          const { error: memberError } = await supabase
            .from('association_members')
            .insert({
              user_id: authData.user.id,
              association_id: currentAssociation.id,
            });

          if (memberError) throw memberError;

          toast({
            title: 'Account Created',
            description: `${values.name} has been added to the association.`,
          });

          setIsOpen(false);
          if (onInviteSent) onInviteSent();
          form.reset();
          return;
        }
      }

      // Check if user already exists (for invitation flow)
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', values.email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (existingUser) {
        // Check if user is already a member
        const { data: existingMember, error: memberError } = await supabase
          .from('association_members')
          .select('user_id')
          .eq('user_id', existingUser.id)
          .eq('association_id', currentAssociation.id)
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          throw memberError;
        }

        if (existingMember) {
          toast({
            title: 'User Already Member',
            description: `${values.email} is already a member of this association.`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Add user directly to association_members
        const { error } = await supabase.from('association_members').insert({
          user_id: existingUser.id,
          association_id: currentAssociation.id,
        });

        if (error) {
          throw error;
        }

        toast({
          title: 'Member Added',
          description: `${values.email} has been added to the association.`,
        });

        setIsOpen(false);
        if (onInviteSent) onInviteSent();
        form.reset();
      } else {
        // Generate an invitation code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Use the type-safe insert method
        const { error } = await safeInsert('association_invitations', {
          code,
          association_id: currentAssociation.id,
          email: values.email,
          role: values.role,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 7 days from now
        });

        if (error) throw error;

        // Set the invite code to show to the user
        setInviteCode(code);

        // In a real app, you would send an email with the code
        // For now, we'll display it to the user to copy
        toast({
          title: 'Invitation Created',
          description: `Please share the invitation code with ${values.email}.`,
        });
      }
    } catch (error: any) {
      console.error('Error inviting member:', error);
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
        title: 'Copied',
        description: 'Invitation code copied to clipboard',
      });
    }
  };

  const closeDialog = () => {
    setIsOpen(false);
    setInviteCode(null);
    form.reset();
    setActiveTab('invite');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Association Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your association.
          </DialogDescription>
        </DialogHeader>

        {inviteCode ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Share this code with the user to join the association:
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2 p-2 bg-background border rounded-md">
              <span className="font-mono text-lg font-bold flex-1">
                {inviteCode}
              </span>
              <Button variant="outline" size="sm" onClick={copyInviteCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              The code will expire in 7 days. The user will need to sign up or
              log in to use this code.
            </p>
            <DialogFooter>
              <Button onClick={closeDialog}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invite">Send Invitation</TabsTrigger>
                <TabsTrigger value="create">Create Member</TabsTrigger>
              </TabsList>

              <TabsContent value="invite">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleInvite)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="member"
                                  id="invite-member"
                                />
                                <Label htmlFor="invite-member">Member</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="manager"
                                  id="invite-manager"
                                />
                                <Label htmlFor="invite-manager">Manager</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="admin"
                                  id="invite-admin"
                                />
                                <Label htmlFor="invite-admin">Admin</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="create">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleInvite)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="createAccount"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Create account for member</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Create a new user account and add them to your
                              association directly
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter email address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchCreateAccount && (
                      <>
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter full name"
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
                                <Input
                                  type="password"
                                  placeholder="Create a password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="member"
                                  id="create-member"
                                />
                                <Label htmlFor="create-member">Member</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="manager"
                                  id="create-manager"
                                />
                                <Label htmlFor="create-manager">Manager</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="admin"
                                  id="create-admin"
                                />
                                <Label htmlFor="create-admin">Admin</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          isLoading ||
                          (watchCreateAccount &&
                            (!form.watch('name') || !form.watch('password')))
                        }
                      >
                        {isLoading ? 'Creating...' : 'Create Member'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;

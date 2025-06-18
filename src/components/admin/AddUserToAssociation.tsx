'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { UserRoleType } from '@/types/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { handleError } from '@/utils/debug';

interface AddUserToAssociationProps {
  associationId: string;
  onUserAdded?: () => void;
}

const ROLE_OPTIONS: { label: string; value: UserRoleType }[] = [
  { label: 'Member', value: 'member' },
  { label: 'Admin', value: 'admin' },
];

export function AddUserToAssociation({
  associationId,
  onUserAdded,
}: AddUserToAssociationProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRoleType>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user exists - use eq_filter instead of direct eq for type safety
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .filter('email', 'eq', email)
        .single();

      if (profileError || !profilesData) {
        throw new Error('User with this email does not exist');
      }

      // Add user to association - use type cast for the insert operation
      const { error: addError } = await supabase
        .from('association_members')
        .insert({
          association_id: associationId,
          user_id: profilesData.id,
        } as any); // Removed the role field as it no longer exists in association_members

      if (addError) throw addError;

      toast({
        title: 'User Added',
        description: `Successfully added ${email} to the association`,
      });

      // Reset form
      setEmail('');
      setRole('member');

      // Callback
      if (onUserAdded) onUserAdded();
    } catch (error: any) {
      handleError(error, 'AddUserToAssociation.handleSubmit');
      toast({
        title: 'Error Adding User',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Add User to Association</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRoleType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Adding...' : 'Add User'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

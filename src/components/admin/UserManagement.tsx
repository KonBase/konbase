'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserRoleManager } from '@/components/admin/UserRoleManager';
import { Search, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { handleError } from '@/utils/debug';

// Interface for user profiles
interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  association_id: string | null;
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, association_id, created_at');

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      handleError(error, 'UserManagement.fetchUsers');
      toast({
        title: 'Error',
        description: 'Failed to load user profiles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      // First check if the user exists to avoid cascading errors
      const { error: userCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (userCheckError) {
        throw new Error('User not found or cannot be accessed');
      }

      // First remove user from audit logs (optional but prevents orphaned records)
      const { error: auditLogError } = await supabase
        .from('audit_logs')
        .delete()
        .eq('user_id', userId);

      if (auditLogError) {
        console.warn(
          'Could not clean up audit logs for user, continuing:',
          auditLogError,
        );
      }

      // Remove user from any associations - wrap in try/catch for resilience
      try {
        const { error: membershipError } = await supabase
          .from('association_members')
          .delete()
          .eq('user_id', userId);

        if (membershipError) {
          console.warn(
            'Error removing association memberships:',
            membershipError,
          );
          // Continue with deletion despite this error
        }
      } catch (membershipDeleteError) {
        console.warn(
          'Exception during association cleanup:',
          membershipDeleteError,
        );
        // Continue with deletion despite this error
      }

      // Remove any documents associated with the user
      try {
        const { error: docsError } = await supabase
          .from('documents')
          .delete()
          .eq('uploaded_by', userId);

        if (docsError) {
          console.warn('Error removing user documents:', docsError);
        }
      } catch (docsError) {
        console.warn('Exception during document cleanup:', docsError);
      }

      // Then delete the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Failed to delete user profile:', profileError);
        throw profileError;
      }

      // Create audit log entry
      await supabase.from('audit_logs').insert({
        action: 'delete_user',
        entity: 'users',
        entity_id: userId,
        user_id: '', // Will be filled by auth context
        changes: { deleted_user_id: userId },
      });

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      // Refresh users
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View and manage user accounts and permissions
        </CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex justify-between p-2 border-b animate-pulse"
              >
                <div className="space-y-1">
                  <div className="h-4 w-40 bg-muted rounded"></div>
                  <div className="h-3 w-60 bg-muted rounded"></div>
                </div>
                <div className="h-8 w-32 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center py-4">No users found</p>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col md:flex-row justify-between md:items-center p-2 border-b last:border-0 gap-2"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    User ID: {user.id.substring(0, 8)}... | Created:{' '}
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Association:{' '}
                    {user.association_id
                      ? user.association_id.substring(0, 8) + '...'
                      : 'None'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <UserRoleManager
                    userId={user.id}
                    currentRole={user.role as any}
                    onRoleUpdated={fetchUsers}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this user? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

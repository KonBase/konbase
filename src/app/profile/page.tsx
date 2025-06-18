'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { Spinner } from '@/components/ui/spinner';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || '');
      // Potentially set existing avatar URL here if available
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: { display_name?: string; avatarFile?: File | null } = {};
      if (displayName !== (user?.user_metadata?.display_name || '')) {
        updateData.display_name = displayName;
      }
      if (avatarFile) {
        updateData.avatarFile = avatarFile;
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes to update.',
        });
        setIsLoading(false);
        return;
      }

      await updateProfile({
        data: updateData,
      });
      setAvatarFile(null); // Clear the file input after successful upload

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorVerified = () => {
    toast({
      title: 'Two-factor authentication enabled',
      description: 'Your account is now protected with 2FA.',
    });
  };

  const handleTwoFactorCancel = () => {
    setErrorMessage('');
  };

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <h1 className="text-2xl font-semibold mb-6">My Profile</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Profile form will go here */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl font-semibold overflow-hidden">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={displayName || 'User avatar'} className="w-full h-full object-cover" />
                    ) : (
                      user?.email?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {displayName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Label htmlFor="avatar">Avatar</Label>
                  <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} disabled={isLoading} />
                  {avatarFile && (
                    <Button onClick={handleUpdateProfile} disabled={isLoading} className="mt-2">
                      {isLoading ? <Spinner size="sm" className="mr-2" /> : 'Upload Avatar'}
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={user?.app_metadata?.role || 'member'} disabled className="bg-muted" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="accountCreated">Account Created</Label>
                  <Input id="accountCreated" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} disabled className="bg-muted" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="association">Association</Label>
                  <Input id="association" value={'Member'} disabled className="bg-muted" />
                </div>

                <div className="space-y-1">
                  <Label>Display Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {displayName || user?.email?.split('@')[0] || 'User'}
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TwoFactorSetup
                onVerified={handleTwoFactorVerified}
                onCancel={handleTwoFactorCancel}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
              />
              <div className="space-y-1">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <Label>User ID</Label>
                <p className="text-sm text-muted-foreground">{user?.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* User Convention Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>User Convention</CardTitle>
              <CardDescription>
                List of conventions you are associated with
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Convention list will go here */}
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                    U
                  </div>
                  <div>
                    <p className="font-medium">Unknown Convention</p>
                    <p className="text-xs text-muted-foreground">N/A - N/A</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-100 dark:bg-green-900/30">
                    Completed
                  </Badge>
                  <Button variant="outline" size="sm">Attendee</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

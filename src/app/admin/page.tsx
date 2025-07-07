'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SuperAdminElevationButton } from '@/components/admin/SuperAdminElevationButton';
import { UserManagement } from '@/components/admin/UserManagement';
import { AssociationManagement } from '@/components/admin/AssociationManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    checkAdminAccess();
  }, [user]); // Added user dependency, removed checkAdminAccess as it's not needed

  const checkAdminAccess = async () => {
    console.log('=== Admin Page Access Check ===');
    console.log('User:', user);
    
    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
      return;
    }

    try {
      // Check user role from profiles table (system-level roles)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('Profile data:', profileData);
      console.log('Profile error:', profileError);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // Check if user has system-level admin role
      const hasSystemAdminRole = profileData?.role && ['admin', 'system_admin', 'super_admin'].includes(profileData.role);
      console.log('Has system admin role:', hasSystemAdminRole, 'Role:', profileData?.role);

      if (hasSystemAdminRole) {
        console.log('User has system admin role, granting access');
        setIsAdmin(true);
        return;
      }

      // If no system admin role, check association-level admin roles
      const { data: memberData, error: memberError } = await supabase
        .from('association_members')
        .select('role, association_id')
        .eq('user_id', user.id);

      console.log('Association member data:', memberData);
      console.log('Association member error:', memberError);

      if (memberError) {
        console.error('Error fetching association membership:', memberError);
        throw memberError;
      }

      // Check if user has admin role in any association
      const hasAssociationAdminRole = memberData?.some(member => 
        ['admin', 'system_admin'].includes(member.role)
      );
      console.log('Has association admin role:', hasAssociationAdminRole);

      if (hasAssociationAdminRole) {
        console.log('User has association admin role, granting access');
        setIsAdmin(true);
        return;
      }

      console.log('User does not have admin privileges, redirecting to dashboard');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage users, associations, and system settings
              </p>
            </div>
          </div>
          <SuperAdminElevationButton />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="associations">Associations</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="associations" className="space-y-4">
            <AssociationManagement />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditLogViewer />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  System settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('=== Admin Status Check Debug ===');
      console.log('User ID:', user?.id);
      console.log('User Email:', user?.email);
      console.log('User role from context:', user?.role);
      console.log('Full User Object:', user);
      
      if (!user?.id) {
        console.warn('No user ID available for admin check');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // First check if we already have the role from the user context
      if (user.role) {
        const isAdminUser = ['admin', 'system_admin', 'super_admin'].includes(user.role);
        console.log('Using role from user context:', user.role, 'Is admin:', isAdminUser);
        setIsAdmin(isAdminUser);
        setLoading(false);
        return;
      }

      // Check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      if (!session) {
        console.warn('No active session found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      console.log('Session user ID:', session.user.id);
      console.log('Session expires at:', session.expires_at);
      console.log('Using session user ID for query:', session.user.id);

      try {
        // Use session.user.id instead of user.id to ensure we're using the authenticated user ID
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Supabase error checking admin status:', error);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          console.error('Error code:', error.code);
          console.error('Full error object:', error);
          
          // Check if it's a permission error
          if (error.code === 'PGRST116' || error.message?.includes('permission')) {
            console.error('Permission denied - user may not have access to their own profile');
          }
          
          throw error;
        }

        if (!data) {
          console.warn('No profile data found for user:', session.user.id);
          setIsAdmin(false);
        } else {
          console.log('Profile data found:', data);
          const isAdminUser = ['admin', 'system_admin', 'super_admin'].includes(data.role);
          console.log('Is admin user:', isAdminUser, 'Role:', data.role);
          setIsAdmin(isAdminUser);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAdminStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-6">{children}</div>
    </AuthGuard>
  );
}

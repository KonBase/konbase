'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { Spinner } from '@/components/ui/spinner';
import { UserRoleType } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RoleGuardProps {
  allowedRoles: UserRoleType[];
  children: ReactNode;
  fallbackPath?: string;
  enforceTwoFactor?: boolean;
}

export function RoleGuard({
  allowedRoles,
  children,
  fallbackPath = '/unauthorized',
  enforceTwoFactor = false,
}: RoleGuardProps) {
  // Destructure isAuthenticated and hasRole correctly now
  const { userProfile, hasRole, loading, isAuthenticated, isLoading } =
    useAuth();
  const [checking, setChecking] = useState(true); // Keep checking state
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null); // Use null initial state
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Only run checks if auth is ready and not loading
    if (isLoading || loading) {
      // Use isLoading instead of isReady
      setChecking(true); // Indicate checking is in progress
      return;
    }

    setChecking(false); // Auth is ready, checking is complete or starting

    // 1. Check Authentication
    if (!isAuthenticated) {
      console.log('RoleGuard: User not authenticated.');
      setAccessGranted(false);
      // Optional: Toast for immediate feedback if desired, but redirect handles it
      // toast({ title: "Authentication Required", description: "Please log in.", variant: "destructive" });
      return; // Stop checks if not authenticated
    }

    // User is authenticated, proceed with role check
    if (!userProfile) {
      console.warn('RoleGuard: User authenticated but profile not loaded yet.');
      // Decide how to handle this - maybe wait longer or treat as no access?
      // For now, treat as no access if profile is missing after loading is done.
      setAccessGranted(false);
      return;
    }

    // 2. Check Role Access
    const hasRequiredRole = allowedRoles.some((role) => hasRole(role));

    if (!hasRequiredRole) {
      console.log(
        `RoleGuard: Access denied. Role '${userProfile.role}' not in allowed roles [${allowedRoles.join(', ')}].`,
      );
      setAccessGranted(false);
      toast({
        title: 'Access Denied',
        description: "You don't have sufficient permissions.",
        variant: 'destructive',
      });
      return; // Stop checks if role is insufficient
    }

    // 3. Check Two-Factor Authentication (if required)
    const needsTwoFactorCheck =
      enforceTwoFactor || hasRole('system_admin') || hasRole('super_admin');

    if (needsTwoFactorCheck && !userProfile.two_factor_enabled) {
      console.log('RoleGuard: 2FA required but not enabled.');
      setShowTwoFactorDialog(true);
      setAccessGranted(false); // Deny access until 2FA is set up or dialog is dismissed
      return; // Stop checks, show dialog
    }

    // All checks passed
    console.log('RoleGuard: Access granted.');
    setAccessGranted(true);
    setShowTwoFactorDialog(false); // Ensure dialog is hidden if previously shown

    // Include all dependencies used in the effect
  }, [
    isLoading,
    loading,
    isAuthenticated,
    userProfile,
    allowedRoles,
    hasRole,
    enforceTwoFactor,
    toast,
    fallbackPath,
    router,
  ]); // Use isLoading instead of isReady

  // Display loading spinner while auth context is initializing OR checks are running
  if (loading || checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Show 2FA dialog if needed
  if (showTwoFactorDialog) {
    return (
      <AlertDialog
        open={showTwoFactorDialog}
        onOpenChange={setShowTwoFactorDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Two-Factor Authentication Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              For enhanced security, Two-Factor Authentication (2FA) is
              required. Please set up 2FA in your security settings to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* Navigate back or to fallback on cancel */}
            <AlertDialogCancel onClick={() => router.push(fallbackPath)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/settings?tab=security')}
            >
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Redirect if access check is complete and access is denied
  if (accessGranted === false) {
    router.replace(fallbackPath);
    return null;
  }

  // Render children only if access check is complete and access is granted
  if (accessGranted === true) {
    return <>{children}</>;
  }

  // Default case (should ideally not be reached if logic is sound)
  return null;
}

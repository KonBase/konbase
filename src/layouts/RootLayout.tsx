import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/components/ui/use-toast';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import { handleOAuthRedirect } from '@/utils/oauth-redirect-handler';
import { SessionRecovery } from '@/components/SessionRecovery';
import RouteChangeHandler from '@/components/RouteChangeHandler';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const location = usePathname();
  const hasProcessedOAuth = useRef(false);
  const { isOffline } = useNetworkStatus({
    showToasts: false,
    testInterval: 60000, // Check connection every minute
    testEndpoint: 'https://www.google.com', // Use a reliable public endpoint
  });

  // Process OAuth redirects when the component mounts
  useEffect(() => {
    const processOAuthRedirect = async () => {
      // Only process once per session and only if there's a hash
      if (
        !hasProcessedOAuth.current &&
        window.location.hash &&
        window.location.hash.includes('access_token')
      ) {
        hasProcessedOAuth.current = true;
        const result = await handleOAuthRedirect();
        if (result.success) {
          toast({
            title: 'Login successful',
            description: 'You have been successfully logged in.',
          });
          // Redirect to the dashboard
          router.push('/dashboard');
        }
      }
    };

    processOAuthRedirect();
  }, [router, toast]);

  // Add effect to show offline status
  useEffect(() => {
    if (isOffline) {
      toast({
        title: "You're offline",
        description:
          'Some features may not work correctly. Please check your connection.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [isOffline, toast]);

  // Check if we're on the index page
  const isIndexPage = location === '/';

  return (
    <>
      <SessionRecovery />
      <RouteChangeHandler />
      {!!user && !isIndexPage && <Header />}
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster />
    </>
  );
}

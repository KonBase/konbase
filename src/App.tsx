import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from '@/contexts/auth';
import { AssociationProvider } from './contexts/AssociationContext';
import { ReauthProvider } from '@/contexts/ReauthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { SessionRecovery } from '@/components/SessionRecovery';
import { isConfigured } from '@/lib/config-store';
import { useEffect } from 'react';

// Routing
import { AppRouter } from './components/routing';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    isConfigured();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <AuthProvider>
            <ReauthProvider>
              <AssociationProvider>
                <SessionRecovery />
                <AppRouter />
                <Toaster />
              </AssociationProvider>
            </ReauthProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;


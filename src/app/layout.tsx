import { ThemeProvider } from '@/contexts/ThemeProvider';
import { AuthProvider } from '@/contexts/auth';
import { AssociationProvider } from '@/contexts/AssociationContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityProvider';
import { ToasterProvider } from '@/components/ui/ToasterProvider';
import RouteChangeHandler from '@/components/RouteChangeHandler';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { SkipToMain } from '@/components/accessibility/SkipLink';
import '@/app/globals.css';

export const metadata = {
  title: 'KonBase - Event & Inventory Management',
  description: 'Manage your events, inventory, and more with KonBase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <AssociationProvider>
                <SkipToMain />
                <ConditionalLayout>
                  <ToasterProvider />
                  <RouteChangeHandler />
                  <main id="main-content" tabIndex={-1}>
                    {children}
                  </main>
                </ConditionalLayout>
              </AssociationProvider>
            </AuthProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

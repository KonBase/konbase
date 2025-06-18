import { ThemeProvider } from '@/contexts/ThemeProvider';
import { AuthProvider } from '@/contexts/auth';
import { AssociationProvider } from '@/contexts/AssociationContext';
import { ToasterProvider } from '@/components/ui/ToasterProvider';
import RouteChangeHandler from '@/components/RouteChangeHandler';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
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
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AssociationProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              <ToasterProvider />
              <RouteChangeHandler />
            </AssociationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

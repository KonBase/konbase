'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';
import { ReactNode } from 'react';

interface MainLayoutWrapperProps {
  children: ReactNode;
}

const MainLayoutWrapper = ({ children }: MainLayoutWrapperProps) => {
  const pathname = usePathname();

  // Check if we're on the login or register pages
  const hideFooter = pathname === '/login' || pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-grow">{children}</div>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default MainLayoutWrapper;

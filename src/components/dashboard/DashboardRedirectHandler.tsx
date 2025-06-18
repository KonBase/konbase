'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

const DashboardRedirectHandler: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Handle redirect from setupWizard if there's a 'completed' query param
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('completed') === 'true') {
      toast({
        title: 'Setup completed',
        description: 'Welcome to your dashboard!',
      });
      // Clear the query parameter
      router.replace('/dashboard');
    }
  }, [router]);

  return null; // This component doesn't render anything
};

export default DashboardRedirectHandler;

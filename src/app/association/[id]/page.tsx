'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface AssociationPageProps {
  params: Promise<{ id: string }>;
}

export default function AssociationPage({ params }: AssociationPageProps) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new route structure
    router.replace(`/associations/${id}`);
  }, [router, id]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

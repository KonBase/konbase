'use client';

import { use } from 'react';
import { ConventionLocationsTab } from '@/components/conventions/ConventionLocationsTab';

interface ConventionLocationsPageProps {
  params: Promise<{ id: string }>;
}

export default function ConventionLocationsPage({
  params,
}: ConventionLocationsPageProps) {
  const { id } = use(params);

  return <ConventionLocationsTab conventionId={id} />;
}

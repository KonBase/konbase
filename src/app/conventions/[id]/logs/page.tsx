'use client';

import { use } from 'react';
import ConventionLogsTab from '@/components/conventions/ConventionLogsTab';

interface ConventionLogsPageProps {
  params: Promise<{ id: string }>;
}

export default function ConventionLogsPage({
  params,
}: ConventionLogsPageProps) {
  const { id } = use(params);

  return <ConventionLogsTab conventionId={id} />;
}

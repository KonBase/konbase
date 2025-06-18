'use client';

import { AuthGuard } from '@/components/guards/AuthGuard';

export default function ConventionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="container mx-auto py-6">{children}</div>
    </AuthGuard>
  );
}

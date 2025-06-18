'use client';

import React from 'react';
import AssociationOverviewCard from './AssociationOverviewCard';
import RecentActivityCard from './RecentActivityCard';
import QuickActionsCard from './QuickActionsCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Association } from '@/types/association';

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
}

interface DashboardOverviewSectionProps {
  currentAssociation: Association | null;
  isLoadingActivity: boolean;
  recentActivity: (() => AuditLog[]) | AuditLog[] | null; // Support both function and direct array
  activityError: any;
  handleRetry: () => void;
}

const DashboardOverviewSection: React.FC<DashboardOverviewSectionProps> = ({
  currentAssociation,
  isLoadingActivity,
  recentActivity,
  activityError,
  handleRetry,
}) => {
  return (
    <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 mb-6 md:mb-8">
      <ErrorBoundary>
        <AssociationOverviewCard association={currentAssociation} />
      </ErrorBoundary>

      <ErrorBoundary>
        <RecentActivityCard
          isLoading={isLoadingActivity}
          activities={
            typeof recentActivity === 'function'
              ? recentActivity()
              : recentActivity
          }
          error={activityError}
          onRetry={handleRetry}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <QuickActionsCard />
      </ErrorBoundary>
    </div>
  );
};

export default DashboardOverviewSection;

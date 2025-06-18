'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { useAssociation } from '@/contexts/AssociationContext';
import { AuthGuard } from '@/components/guards/AuthGuard';
import ErrorBoundary from '@/components/ErrorBoundary';

import DashboardOverviewSection from '@/components/dashboard/DashboardOverviewSection';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import { DashboardModulesSection } from '@/components/dashboard/DashboardModulesSection';
import { ModuleProvider } from '@/components/modules/ModuleContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ErrorType } from '@/types/common';

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [activityError, setActivityError] = useState<ErrorType | null>(null);
  const [lastError, setLastError] = useState<ErrorType | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadTime, setLoadTime] = useState<number | undefined>();

  const fetchRecentActivity = useCallback(async () => {
    if (!user) return;

    const startTime = Date.now();
    setIsLoadingActivity(true);
    setActivityError(null);

    try {
      // Note: audit_logs table doesn't have association_id column
      // We filter by user_id to show user's own actions
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      setRecentActivity(data || []);
      setLoadTime(Date.now() - startTime);
    } catch (error) {
      const err = error as ErrorType;
      console.error('Error fetching recent activity:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        error: err
      });
      setActivityError(err);
      setLastError(err);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    fetchRecentActivity();
  };

  const safeRecentActivity = () => recentActivity;

  const onShowLocationManager = () => {
    // Navigate to location manager
    window.location.href = '/inventory/locations';
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-6 space-y-8">
          {/* Dashboard title section */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                {currentAssociation ? (
                  <p className="text-muted-foreground">
                    Welcome back to {currentAssociation.name}!
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    No association selected
                  </p>
                )}
              </div>
            </div>
          </div>

          <ErrorBoundary>
            <DashboardOverviewSection
              currentAssociation={currentAssociation}
              isLoadingActivity={isLoadingActivity}
              recentActivity={safeRecentActivity}
              activityError={activityError}
              handleRetry={handleRetry}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <AssociationManagementSection
              onShowLocationManager={onShowLocationManager}
            />
          </ErrorBoundary>

          <ErrorBoundary>
            <ConventionManagementSection />
          </ErrorBoundary>

          <ErrorBoundary>
            <ModuleProvider>
              <DashboardModulesSection />
            </ModuleProvider>
          </ErrorBoundary>
        </div>
      </div>
    </AuthGuard>
  );
}

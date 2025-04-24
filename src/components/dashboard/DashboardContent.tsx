import React, { useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardOverviewSection from '@/components/dashboard/DashboardOverviewSection';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import DashboardDebugPanel from '@/components/dashboard/DashboardDebugPanel';
import { Association } from '@/types/association';
import { User } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
}

interface DashboardContentProps {
  currentAssociation: Association;
  user: User | null;
  isLoadingActivity: boolean;
  safeRecentActivity: () => AuditLog[]; // Changed to function type
  activityError: any;
  handleRetry: () => void;
  onShowLocationManager: () => void;
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  networkStatus: any;
  lastError: any;
  retryCount: number;
  loadTime?: number;
  requestInfo?: {
    requestTimestamp?: number | null;
    responseTimestamp?: number | null;
  };
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  currentAssociation,
  user,
  isLoadingActivity,
  safeRecentActivity,
  activityError,
  handleRetry,
  onShowLocationManager,
  isDebugMode,
  toggleDebugMode,
  networkStatus,
  lastError,
  retryCount,
  loadTime,
  requestInfo
}) => {
  const isHome = true;
  const { toast } = useToast();
  
  // Show a toast when in debug mode to indicate loading time
  useEffect(() => {
    if (isDebugMode && loadTime && loadTime > 0) {
      toast({
        title: "Dashboard loaded",
        description: `Loading time: ${loadTime}ms`,
        variant: "default",
      });
    }
  }, [isDebugMode, loadTime, toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-8">
        <DashboardHeader 
          currentAssociation={currentAssociation} 
          user={user} 
          isHome={isHome} 
        />

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
          <AssociationManagementSection onShowLocationManager={onShowLocationManager} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <ConventionManagementSection />
        </ErrorBoundary>
        
        <DashboardDebugPanel 
          isDebugMode={isDebugMode}
          toggleDebugMode={toggleDebugMode}
          networkStatus={networkStatus}
          user={user}
          currentAssociation={currentAssociation}
          lastError={lastError}
          handleRetry={handleRetry}
          retryCount={retryCount}
          loadTime={loadTime}
          requestInfo={requestInfo}
        />
      </div>
    </div>
  );
};

export default DashboardContent;

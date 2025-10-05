import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { AssociationManagement } from '@/components/admin/AssociationManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/contexts/auth';
import { SuperAdminElevationButton } from '@/components/admin/SuperAdminElevationButton';
import { SuperAdminDemotionButton } from '@/components/admin/SuperAdminDemotionButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ModuleManager } from '@/components/modules/ModuleManager';
import { ModuleProvider } from '@/components/modules/ModuleContext';
import AdminPrefixConfig from '@/components/admin/AdminPrefixConfig';
import { useLocation } from 'react-router-dom';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  // Determine if the user has access to specific admin sections
  const canAccessSettings = user?.role === 'super_admin';
  const canAccessAuditLogs = user?.role === 'super_admin';
  const canAccessModules = user?.role === 'super_admin';
  const isSystemAdmin = user?.role === 'system_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Handle URL params for direct tab navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    // If a valid tab is specified in the URL and user has access to it
    if (tabParam) {
      if (tabParam === 'modules' && canAccessModules) {
        setActiveTab('modules');
      } else if (tabParam === 'settings' && canAccessSettings) {
        setActiveTab('settings');
      } else if (tabParam === 'audit-logs' && canAccessAuditLogs) {
        setActiveTab('audit-logs');
      } else if (tabParam === 'users' || tabParam === 'associations') {
        setActiveTab(tabParam);
      }
    }
  }, [location.search, canAccessModules, canAccessSettings, canAccessAuditLogs]);
  
  // Effect to check for elevation/demotion success on page load (useful after page refreshes)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const elevationSuccess = urlParams.get('elevation');
    const demotionSuccess = urlParams.get('demotion');
    
    if (elevationSuccess === 'success') {
      toast({
        title: 'Super Admin Access Granted',
        description: 'You now have super admin privileges',
        variant: 'default',
      });
      
      // Remove the query parameter but preserve any tab parameter
      const tabParam = urlParams.get('tab');
      const newUrl = tabParam 
        ? `${window.location.pathname}?tab=${tabParam}` 
        : window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (demotionSuccess === 'success') {
      toast({
        title: 'Demoted from Super Admin',
        description: 'You have been demoted to system administrator',
        variant: 'default',
      });
      
      // Remove the query parameter but preserve any tab parameter
      const tabParam = urlParams.get('tab');
      const newUrl = tabParam 
        ? `${window.location.pathname}?tab=${tabParam}` 
        : window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toast]);
  
  return (
    <RoleGuard allowedRoles={['system_admin', 'super_admin']}>
      <div className="container mx-auto py-4 md:py-8 px-2 md:px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage users, associations, and system settings
            </p>
          </div>
          
          {/* Show elevation/demotion buttons based on user role */}
          <div className="flex flex-col sm:flex-row gap-2">
            {isSystemAdmin && <SuperAdminElevationButton />}
            {isSuperAdmin && <SuperAdminDemotionButton />}
          </div>
        </div>
        
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="flex w-full justify-start overflow-x-auto px-2 py-1">
                <TabsTrigger value="users" className="flex-shrink-0">Users</TabsTrigger>
                <TabsTrigger value="associations" className="flex-shrink-0">Associations</TabsTrigger>
                <TabsTrigger value="prefixes" className="flex-shrink-0">Code Prefixes</TabsTrigger>
                
                {/* Only show these tabs to super_admin */}
                {canAccessAuditLogs && <TabsTrigger value="audit-logs" className="flex-shrink-0">Audit Logs</TabsTrigger>}
                {canAccessModules && <TabsTrigger value="modules" className="flex-shrink-0">Modules</TabsTrigger>}
                {canAccessSettings && <TabsTrigger value="settings" className="flex-shrink-0">Settings</TabsTrigger>}
              </TabsList>
            </ScrollArea>
            
            <TabsContent value="users" className="space-y-4 px-2 md:px-4 pt-4">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="associations" className="space-y-4 px-2 md:px-4 pt-4">
              <AssociationManagement />
            </TabsContent>
            
            <TabsContent value="prefixes" className="space-y-4 px-2 md:px-4 pt-4">
              <AdminPrefixConfig />
            </TabsContent>
            
            {canAccessAuditLogs && (
              <TabsContent value="audit-logs" className="space-y-4 px-2 md:px-4 pt-4">
                <AuditLogViewer />
              </TabsContent>
            )}
            
            {canAccessModules && (
              <TabsContent value="modules" className="space-y-4 px-2 md:px-4 pt-4">
                <ModuleProvider>
                  <ModuleManager />
                </ModuleProvider>
              </TabsContent>
            )}
            
            {canAccessSettings && (
              <TabsContent value="settings" className="space-y-4 px-2 md:px-4 pt-4">
                <SystemSettings />
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </RoleGuard>
  );
}

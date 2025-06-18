'use client';

import React from 'react';
import { useModules } from '@/components/modules/ModuleContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PackageOpen, AlertTriangle } from 'lucide-react';
import { ErrorDetails } from '@/utils/debug/error-details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth';

export const DashboardModulesSection = () => {
  const { isInitialized, dashboardComponents, manifests } = useModules();
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  // Check if we have any enabled modules or components to show
  const hasEnabledModules = manifests.some((m) => m.isEnabled);
  const hasComponents = dashboardComponents.length > 0;

  if (!isInitialized) {
    // If modules aren't initialized yet, show a loading state
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Modules</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/40"></CardHeader>
              <CardContent className="h-16 bg-muted/20"></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If no modules or components, show placeholder state
  if (!hasEnabledModules) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Modules</h2>
          {isSuperAdmin && (
            <Button size="sm" onClick={() => router.push('/admin?tab=modules')}>
              Manage Modules
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PackageOpen className="mr-2 h-5 w-5" />
              No Active Modules
            </CardTitle>
            <CardDescription>
              Extend your Konbase experience with custom modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isSuperAdmin
                ? 'Install and enable modules to add new features and functionality to your Konbase experience.'
                : 'Contact your system administrator to enable modules for additional features.'}
            </p>
            {isSuperAdmin && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/admin?tab=modules')}
              >
                Browse Available Modules
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // No dashboard components but has enabled modules
  if (!hasComponents) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Modules</h2>
          {isSuperAdmin && (
            <Button size="sm" onClick={() => router.push('/admin?tab=modules')}>
              Manage Modules
            </Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PackageOpen className="mr-2 h-5 w-5" />
              Modules Enabled
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-700"
              >
                {manifests.filter((m) => m.isEnabled).length} Active
              </Badge>
            </CardTitle>
            <CardDescription>
              Your enabled modules don't provide any dashboard components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The modules you have enabled don't add any components to the
              dashboard. They may add functionality to other areas of the
              application.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render dashboard components from modules
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Modules</h2>
        {isSuperAdmin && (
          <Button size="sm" onClick={() => router.push('/admin?tab=modules')}>
            Manage Modules
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardComponents.map((component, index) => {
          try {
            if (!component.component) {
              return (
                <Card key={`error-${index}`} className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-500">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Module Error
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-500">
                      This module component failed to load.
                    </p>
                  </CardContent>
                </Card>
              );
            }

            // Handle both ReactNode and function returning ReactNode
            if (typeof component.component === 'function') {
              const ComponentFn = component.component as () => React.ReactNode;
              return (
                <div
                  key={`${component.moduleId || ''}-${index}`}
                  className={
                    component.gridSpan === 'full'
                      ? 'md:col-span-2 lg:col-span-3'
                      : component.gridSpan === 'half'
                        ? 'lg:col-span-2'
                        : ''
                  }
                >
                  {ComponentFn()}
                </div>
              );
            } else {
              return (
                <div
                  key={`${component.moduleId || ''}-${index}`}
                  className={
                    component.gridSpan === 'full'
                      ? 'md:col-span-2 lg:col-span-3'
                      : component.gridSpan === 'half'
                        ? 'lg:col-span-2'
                        : ''
                  }
                >
                  {component.component}
                </div>
              );
            }
          } catch (error) {
            return (
              <Card key={`error-${index}`} className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-500">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Module Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorDetails errorData={error} />
                </CardContent>
              </Card>
            );
          }
        })}
      </div>
    </div>
  );
};

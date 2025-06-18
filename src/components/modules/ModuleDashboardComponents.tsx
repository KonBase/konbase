'use client';

import React from 'react';
import { useModules } from './ModuleContext';
import { ErrorDetails } from '../../utils/debug/error-details';
import { DashboardCardSkeleton } from '../dashboard/DashboardSkeleton';
import { ModuleDashboardComponent } from '../../types/modules';

export const ModuleDashboardComponents: React.FC = () => {
  const { dashboardComponents, isInitialized } = useModules();

  if (!isInitialized) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (dashboardComponents.length === 0) {
    return null;
  }

  const renderComponent = (
    component: ModuleDashboardComponent,
    index: number,
  ) => {
    if (!component.component) {
      return <DashboardCardSkeleton key={index} error={true} />;
    }

    try {
      // Handle both ReactNode and function returning ReactNode
      if (typeof component.component === 'function') {
        const ComponentFn = component.component as () => React.ReactNode;
        return (
          <div key={`${component.moduleId || ''}-${index}`}>
            {ComponentFn()}
          </div>
        );
      } else {
        return (
          <div key={`${component.moduleId || ''}-${index}`}>
            {component.component}
          </div>
        );
      }
    } catch (error) {
      return (
        <div
          key={`error-${index}`}
          className="border border-red-200 rounded-md p-4"
        >
          <h3 className="text-red-500 font-medium mb-2">Module Error</h3>
          <ErrorDetails errorData={error} />
        </div>
      );
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {dashboardComponents.map((component, index) =>
        renderComponent(component, index),
      )}
    </div>
  );
};

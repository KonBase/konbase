import { cn } from '@/lib/utils';
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: React.ReactNode; // Update: Changed from string to ReactNode
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm p-6',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold">{value}</p>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center text-xs font-medium',
              trend.positive ? 'text-green-600' : 'text-red-600',
            )}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

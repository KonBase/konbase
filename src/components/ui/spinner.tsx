import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'destructive';
  loadingText?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  color = 'primary',
  loadingText,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    destructive: 'text-destructive',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2
        data-testid="loading-spinner"
        className={cn(
          `animate-spin`,
          colorClasses[color],
          sizeClasses[size],
          className,
        )}
      />
      {loadingText && (
        <span className="mt-2 text-sm text-muted-foreground">
          {loadingText}
        </span>
      )}
    </div>
  );
};

// Add error display component for debugging
export const LoadingError: React.FC<{
  error: any;
  retry?: () => void;
}> = ({ error, retry }) => {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'An error occurred while loading data';

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <div className="text-destructive mb-2">
        <span className="font-semibold">Error:</span> {errorMessage}
      </div>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 mt-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Check console for more details
      </p>
    </div>
  );
};

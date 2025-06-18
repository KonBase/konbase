import * as React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'default' | 'destructive' | 'success';
  className?: string;
  children?: React.ReactNode;
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & AlertProps
>(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default:
      'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
    destructive:
      'border-red-500/50 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
    success:
      'border-green-500/50 text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
  };

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };

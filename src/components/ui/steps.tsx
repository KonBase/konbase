import React from 'react';
import { cn } from '@/lib/utils';

export interface StepProps {
  title: string;
  description?: string;
}

export const Step: React.FC<StepProps> = ({ title, description }) => {
  return (
    <div className="flex-1">
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <div className="text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );
};

export interface StepsProps {
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

export const Steps: React.FC<StepsProps> = ({
  currentStep,
  children,
  className,
}) => {
  // Convert children to array
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={cn('flex items-center', className)}>
      {childrenArray.map((child, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <React.Fragment key={index}>
            {/* Step number indicator */}
            <div className="relative">
              <div
                className={cn(
                  'h-8 w-8 rounded-full border flex items-center justify-center text-sm font-medium',
                  isActive &&
                    'border-primary bg-primary text-primary-foreground',
                  isCompleted &&
                    'border-primary bg-primary text-primary-foreground',
                  !isActive &&
                    !isCompleted &&
                    'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            </div>

            {/* Step content */}
            <div className="ml-3 mr-5">{child}</div>

            {/* Connecting line (if not last step) */}
            {index < childrenArray.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

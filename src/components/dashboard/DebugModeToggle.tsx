'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { enableDebugMode } from '@/utils/debug';
import { Bug, EyeOff } from 'lucide-react';

interface DebugModeToggleProps {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  variant?: 'button' | 'switch' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A component that allows users to toggle debug mode on/off
 * Supports different visual variants and sizes
 */
const DebugModeToggle: React.FC<DebugModeToggleProps> = ({
  isDebugMode,
  toggleDebugMode,
  variant = 'link',
  size = 'sm',
  className = '',
}) => {
  // Directly sync with localStorage when toggled
  const handleToggle = () => {
    enableDebugMode(!isDebugMode); // Set localStorage directly
    toggleDebugMode(); // Update component state in parent
  };

  switch (variant) {
    case 'button':
      return (
        <Button
          size={size === 'lg' ? 'default' : 'sm'}
          variant={isDebugMode ? 'default' : 'outline'}
          onClick={handleToggle}
          className={className}
        >
          {isDebugMode ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Debug Info
            </>
          ) : (
            <>
              <Bug className="h-4 w-4 mr-2" />
              Show Debug Info
            </>
          )}
        </Button>
      );

    case 'switch':
      return (
        <div className={`flex items-center justify-between ${className}`}>
          <div className="space-y-0.5">
            <Label htmlFor="debug-mode" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Show additional debugging information
            </p>
          </div>
          <Switch
            id="debug-mode"
            checked={isDebugMode}
            onCheckedChange={handleToggle}
          />
        </div>
      );

    case 'link':
    default:
      return (
        <button
          onClick={handleToggle}
          className={`flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors underline ${className}`}
        >
          {isDebugMode ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Hide Debug Information
            </>
          ) : (
            <>
              <Bug className="h-3 w-3 mr-1" />
              Show Debug Information
            </>
          )}
        </button>
      );
  }
};

export default DebugModeToggle;

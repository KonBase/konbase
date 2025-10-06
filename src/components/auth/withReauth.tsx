import React, { ComponentType } from 'react';
import { useReauthContext } from '@/contexts/ReauthContext';

interface ReauthOptions {
  actionName?: string;
  requirePassword?: boolean;
  requireMFA?: boolean;
  timeout?: number;
}

export function withReauth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: ReauthOptions = {}
) {
  const WithReauthComponent = (props: P) => {
    const { checkReauthRequired, requireReauth } = useReauthContext();

    const handleSensitiveAction = (action: () => void) => {
      const {
        actionName = 'perform this action',
        requirePassword = true,
        requireMFA = false,
        timeout = 15,
      } = options;

      // Check if re-authentication is required
      const isRequired = checkReauthRequired({
        actionName,
        requirePassword,
        requireMFA,
        timeout,
      });

      if (isRequired) {
        // Require re-authentication before proceeding
        requireReauth(action, {
          actionName,
          requirePassword,
          requireMFA,
          timeout,
        });
      } else {
        // Proceed with the action immediately
        action();
      }
    };

    // Pass the re-authentication handler to the wrapped component
    return (
      <WrappedComponent
        {...props}
        onSensitiveAction={handleSensitiveAction}
      />
    );
  };

  WithReauthComponent.displayName = `withReauth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithReauthComponent;
}

// Hook version for functional components
export function useSensitiveAction(options: ReauthOptions = {}) {
  const { checkReauthRequired, requireReauth } = useReauthContext();

  return (action: () => void, customOptions?: Partial<ReauthOptions>) => {
    const finalOptions = { ...options, ...customOptions };
    const {
      actionName = 'perform this action',
      requirePassword = true,
      requireMFA = false,
      timeout = 15,
    } = finalOptions;

    // Check if re-authentication is required
    const isRequired = checkReauthRequired({
      actionName,
      requirePassword,
      requireMFA,
      timeout,
    });

    if (isRequired) {
      // Require re-authentication before proceeding
      requireReauth(action, {
        actionName,
        requirePassword,
        requireMFA,
        timeout,
      });
    } else {
      // Proceed with the action immediately
      action();
    }
  };
}

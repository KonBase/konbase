import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { useAssociation } from '@/contexts/AssociationContext';
import { 
  QuickAction, 
  UserQuickActionConfig, 
  PREDEFINED_QUICK_ACTIONS,
  QuickActionType 
} from '@/types/quickActions';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'konbase_quick_actions_config';

export const useQuickActions = () => {
  const { user } = useAuth();
  const { currentAssociation } = useAssociation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userConfig, setUserConfig] = useState<UserQuickActionConfig | null>(null);
  const [enabledActions, setEnabledActions] = useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user configuration from localStorage
  const loadUserConfig = useCallback(() => {
    if (!user?.id || !currentAssociation?.id) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const configs: UserQuickActionConfig[] = JSON.parse(stored);
        const userConfig = configs.find(
          c => c.userId === user.id && c.associationId === currentAssociation.id
        );
        
        if (userConfig) {
          setUserConfig(userConfig);
          return userConfig;
        }
      }
    } catch (error) {
      console.error('Error loading quick actions config:', error);
    }

    // Create default config if none exists
    const defaultConfig: UserQuickActionConfig = {
      userId: user.id,
      associationId: currentAssociation.id,
      enabledActions: [],
      customOrder: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setUserConfig(defaultConfig);
    return defaultConfig;
  }, [user?.id, currentAssociation?.id]);

  // Save user configuration to localStorage
  const saveUserConfig = useCallback((config: UserQuickActionConfig) => {
    if (!user?.id || !currentAssociation?.id) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let configs: UserQuickActionConfig[] = stored ? JSON.parse(stored) : [];
      
      // Remove existing config for this user/association
      configs = configs.filter(
        c => !(c.userId === user.id && c.associationId === currentAssociation.id)
      );
      
      // Add new config
      configs.push(config);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
      setUserConfig(config);
    } catch (error) {
      console.error('Error saving quick actions config:', error);
    }
  }, [user?.id, currentAssociation?.id]);

  // Get enabled actions based on user configuration
  const getEnabledActions = useCallback((config: UserQuickActionConfig): QuickAction[] => {
    const actions = PREDEFINED_QUICK_ACTIONS
      .filter(action => config.enabledActions.includes(action.title))
      .map(action => ({
        ...action,
        id: action.title, // Use title as ID for predefined actions
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: config.customOrder[action.title] || action.order,
      }))
      .sort((a, b) => a.order - b.order);

    return actions;
  }, []);

  // Enable/disable an action
  const toggleAction = useCallback((actionTitle: string, enabled: boolean) => {
    if (!userConfig) return;

    const newConfig = {
      ...userConfig,
      enabledActions: enabled
        ? [...userConfig.enabledActions, actionTitle]
        : userConfig.enabledActions.filter(title => title !== actionTitle),
      updatedAt: new Date().toISOString(),
    };

    saveUserConfig(newConfig);
    setEnabledActions(getEnabledActions(newConfig));
  }, [userConfig, saveUserConfig, getEnabledActions]);

  // Reorder actions
  const reorderActions = useCallback((actionTitle: string, newOrder: number) => {
    if (!userConfig) return;

    const newConfig = {
      ...userConfig,
      customOrder: {
        ...userConfig.customOrder,
        [actionTitle]: newOrder,
      },
      updatedAt: new Date().toISOString(),
    };

    saveUserConfig(newConfig);
    setEnabledActions(getEnabledActions(newConfig));
  }, [userConfig, saveUserConfig, getEnabledActions]);

  // Execute a quick action
  const executeAction = useCallback(async (action: QuickAction) => {
    try {
      switch (action.type) {
        case 'navigation':
          if (action.config.navigation) {
            navigate(action.config.navigation.path, {
              state: action.config.navigation.params,
            });
          }
          break;
          
        case 'modal':
          // For modal actions, we'll emit an event that components can listen to
          window.dispatchEvent(new CustomEvent('quick-action-modal', {
            detail: {
              component: action.config.modal?.component,
              props: action.config.modal?.props,
            },
          }));
          break;
          
        case 'api_call':
          if (action.config.apiCall) {
            // This would need to be implemented based on your API structure
            console.log('API call action:', action.config.apiCall);
            toast({
              title: 'Action Executed',
              description: action.config.apiCall.successMessage || 'Action completed successfully',
            });
          }
          break;
          
        case 'custom_function':
          if (action.config.customFunction) {
            // This would need to be implemented based on your function registry
            console.log('Custom function action:', action.config.customFunction);
          }
          break;
          
        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('Error executing quick action:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute action',
        variant: 'destructive',
      });
    }
  }, [navigate, toast]);

  // Initialize
  useEffect(() => {
    if (!user?.id || !currentAssociation?.id) {
      setIsLoading(false);
      return;
    }

    const config = loadUserConfig();
    if (config) {
      setEnabledActions(getEnabledActions(config));
    }
    setIsLoading(false);
  }, [user?.id, currentAssociation?.id, loadUserConfig, getEnabledActions]);

  return {
    enabledActions,
    userConfig,
    isLoading,
    toggleAction,
    reorderActions,
    executeAction,
    predefinedActions: PREDEFINED_QUICK_ACTIONS,
  };
};

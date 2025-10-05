
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  Calendar,
  Package,
  Users,
  BarChart3,
  Cog,
  Settings,
  Plus,
} from 'lucide-react';
import { useQuickActions } from '@/hooks/useQuickActions';
import { QuickActionsConfigDialog } from './QuickActionsConfigDialog';
import { QuickActionCategory } from '@/types/quickActions';

const CATEGORY_ICONS: Record<QuickActionCategory, React.ComponentType<{ className?: string }>> = {
  association: Building2,
  convention: Calendar,
  inventory: Package,
  user_management: Users,
  reports: BarChart3,
  system: Cog,
};

const CATEGORY_COLORS: Record<QuickActionCategory, string> = {
  association: 'bg-blue-100 text-blue-700',
  convention: 'bg-green-100 text-green-700',
  inventory: 'bg-purple-100 text-purple-700',
  user_management: 'bg-orange-100 text-orange-700',
  reports: 'bg-yellow-100 text-yellow-700',
  system: 'bg-gray-100 text-gray-700',
};

interface QuickActionButtonProps {
  action: any; // QuickAction type
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ action, onClick }) => {
  const IconComponent = CATEGORY_ICONS[action.category];
  
  return (
    <Button
      variant="outline"
      className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-accent/50 transition-colors min-h-[80px] w-full"
      onClick={onClick}
    >
      <div className={`p-2 rounded-full ${CATEGORY_COLORS[action.category]}`}>
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="text-center space-y-1 w-full">
        <div className="font-medium text-xs leading-tight line-clamp-2">{action.title}</div>
        <div className="text-xs text-muted-foreground line-clamp-2 leading-tight">{action.description}</div>
      </div>
    </Button>
  );
};

const QuickActionsCard: React.FC = () => {
  const { enabledActions, executeAction, isLoading } = useQuickActions();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Loading your quick actions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasEnabledActions = enabledActions.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              {hasEnabledActions 
                ? `${enabledActions.length} configured actions`
                : 'Configure your most used actions'
              }
            </CardDescription>
          </div>
          <QuickActionsConfigDialog>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </QuickActionsConfigDialog>
        </div>
      </CardHeader>
      <CardContent>
        {hasEnabledActions ? (
          <div className="grid grid-cols-2 gap-2">
            {enabledActions.slice(0, 6).map((action) => (
              <QuickActionButton
                key={action.id}
                action={action}
                onClick={() => executeAction(action)}
              />
            ))}
            {enabledActions.length > 6 && (
              <div className="col-span-2 flex items-center justify-center p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  <Plus className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <div className="text-xs text-muted-foreground">
                    +{enabledActions.length - 6} more actions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Configure to see all
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="mb-3">
              <Settings className="h-10 w-10 mx-auto text-muted-foreground/50" />
            </div>
            <h3 className="font-medium mb-1 text-sm">No Quick Actions Configured</h3>
            <p className="text-xs text-muted-foreground">
              Use the Configure button above to set up your quick actions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;

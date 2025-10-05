import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Settings, 
  GripVertical, 
  Plus,
  Building2,
  Calendar,
  Package,
  Users,
  BarChart3,
  Cog,
} from 'lucide-react';
import { useQuickActions } from '@/hooks/useQuickActions';
import { QuickAction, QuickActionCategory } from '@/types/quickActions';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<QuickActionCategory, React.ComponentType<{ className?: string }>> = {
  association: Building2,
  convention: Calendar,
  inventory: Package,
  user_management: Users,
  reports: BarChart3,
  system: Cog,
};

const CATEGORY_LABELS: Record<QuickActionCategory, string> = {
  association: 'Association',
  convention: 'Convention',
  inventory: 'Inventory',
  user_management: 'User Management',
  reports: 'Reports',
  system: 'System',
};

interface QuickActionItemProps {
  action: QuickAction;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onReorder: (newOrder: number) => void;
  isDragging?: boolean;
}

const QuickActionItem: React.FC<QuickActionItemProps> = ({
  action,
  isEnabled,
  onToggle,
  onReorder,
  isDragging = false,
}) => {
  const IconComponent = CATEGORY_ICONS[action.category];
  
  return (
    <div
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
        isEnabled ? 'bg-accent/50 border-accent' : 'bg-background border-border',
        isDragging && 'opacity-50'
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{action.title}</span>
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[action.category]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
      </div>
      
      <Switch
        checked={isEnabled}
        onCheckedChange={onToggle}
        size="sm"
      />
    </div>
  );
};

interface QuickActionsConfigDialogProps {
  children: React.ReactNode;
}

export const QuickActionsConfigDialog: React.FC<QuickActionsConfigDialogProps> = ({ children }) => {
  const { 
    enabledActions, 
    predefinedActions, 
    toggleAction, 
    isLoading 
  } = useQuickActions();
  
  const [isOpen, setIsOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Group actions by category
  const actionsByCategory = predefinedActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<QuickActionCategory, typeof predefinedActions>);

  const handleToggle = (actionTitle: string, enabled: boolean) => {
    toggleAction(actionTitle, enabled);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Configure Quick Actions</DialogTitle>
            <DialogDescription>
              Loading your quick actions configuration...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configure Quick Actions
          </DialogTitle>
          <DialogDescription>
            Enable and organize your most frequently used actions for quick access on the dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto space-y-6">
          {Object.entries(actionsByCategory).map(([category, actions]) => {
            const CategoryIcon = CATEGORY_ICONS[category as QuickActionCategory];
            const enabledCount = actions.filter(action => 
              enabledActions.some(enabled => enabled.title === action.title)
            ).length;
            
            return (
              <div key={category}>
                <div className="flex items-center space-x-2 mb-3">
                  <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{CATEGORY_LABELS[category as QuickActionCategory]}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {enabledCount}/{actions.length} enabled
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {actions.map((action) => {
                    const isEnabled = enabledActions.some(enabled => enabled.title === action.title);
                    
                    return (
                      <QuickActionItem
                        key={action.title}
                        action={action}
                        isEnabled={isEnabled}
                        onToggle={(enabled) => handleToggle(action.title, enabled)}
                        onReorder={(newOrder) => {
                          // TODO: Implement drag and drop reordering
                          console.log('Reorder:', action.title, newOrder);
                        }}
                        isDragging={draggedItem === action.title}
                      />
                    );
                  })}
                </div>
                
                <Separator className="mt-4" />
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

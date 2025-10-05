import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Package, Building2, Settings, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AuditLog } from '@/types/audit';

interface RecentActivityCardProps {
  isLoading: boolean;
  activities: (() => AuditLog[]) | AuditLog[] | null;
  error: any;
  onRetry: () => void;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ 
  isLoading, 
  activities, 
  error, 
  onRetry 
}) => {
  // Extract the activities array whether it's a function or direct array
  const activitiesData = typeof activities === 'function' ? activities() : activities;

  // Helper function to get entity icon and color
  const getEntityInfo = (entity: string, action: string) => {
    switch (entity) {
      case 'association':
        return { 
          icon: Building2, 
          color: 'bg-blue-100 text-blue-700',
          label: 'Association'
        };
      case 'convention':
        return { 
          icon: Calendar, 
          color: 'bg-green-100 text-green-700',
          label: 'Convention'
        };
      case 'item':
        return { 
          icon: Package, 
          color: 'bg-purple-100 text-purple-700',
          label: 'Item'
        };
      case 'module':
        return { 
          icon: Settings, 
          color: 'bg-orange-100 text-orange-700',
          label: 'Module'
        };
      case 'profiles':
        return { 
          icon: User, 
          color: 'bg-gray-100 text-gray-700',
          label: 'User'
        };
      default:
        return { 
          icon: AlertCircle, 
          color: 'bg-gray-100 text-gray-700',
          label: entity.charAt(0).toUpperCase() + entity.slice(1)
        };
    }
  };

  // Helper function to format action text
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest changes across associations, conventions, and modules</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center">
              <Spinner size="sm" />
            </div>
          ) : activitiesData && Array.isArray(activitiesData) && activitiesData.length > 0 ? (
            <ul className="space-y-3">
              {activitiesData.map((activity) => {
                const entityInfo = getEntityInfo(activity.entity, activity.action);
                const Icon = entityInfo.icon;
                
                return (
                  <li key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${entityInfo.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {formatAction(activity.action)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {entityInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {activity.profiles && (
                          <span className="text-xs text-muted-foreground">
                            by {activity.profiles.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activities to display</p>
          )}
          
          {error && (
            <button 
              onClick={onRetry}
              className="text-xs text-primary underline"
            >
              Error loading activities. Click to retry.
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;

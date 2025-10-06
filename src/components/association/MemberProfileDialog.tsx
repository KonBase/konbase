import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Mail, Shield, User, Clock, Activity } from 'lucide-react';
import { AssociationMember } from '@/hooks/useAssociationMembers';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserRoleType, USER_ROLES } from '@/types/user';

interface MemberProfileDialogProps {
  member: AssociationMember | null;
  isOpen: boolean;
  onClose: () => void;
  onRoleChange?: (memberId: string, newRole: UserRoleType) => void;
  canManageRoles?: boolean;
}

interface MemberActivity {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

const MemberProfileDialog: React.FC<MemberProfileDialogProps> = ({
  member,
  isOpen,
  onClose,
  onRoleChange,
  canManageRoles = false
}) => {
  const [memberActivity, setMemberActivity] = useState<MemberActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (member && isOpen) {
      fetchMemberActivity();
    }
  }, [member, isOpen]);

  const fetchMemberActivity = async () => {
    if (!member) return;
    
    setLoading(true);
    try {
      // Fetch recent audit logs for this member
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', member.user_id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setMemberActivity(data || []);
    } catch (error: any) {
      console.error('Error fetching member activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to load member activity',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: UserRoleType) => {
    switch (role) {
      case 'admin':
      case 'system_admin':
      case 'super_admin':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'member':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (!member) return null;

  const profile = member.profile || { name: 'Unknown User', email: 'No email', profile_image: undefined };
  const roleInfo = USER_ROLES[member.role];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.profile_image || ''} alt={profile.name} />
              <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-semibold">{profile.name}</div>
              <div className="text-sm text-muted-foreground">{profile.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            View member details and activity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Member Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Role</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {roleInfo.name}
                    </Badge>
                    {canManageRoles && onRoleChange && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // This would open a role change dialog
                          // For now, we'll just show the current role
                        }}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Change
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Member Since</div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(member.created_at)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Role Description</div>
                <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Permissions</div>
                <div className="flex flex-wrap gap-1">
                  {roleInfo.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission.replace(':', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-sm text-muted-foreground">Loading activity...</div>
                </div>
              ) : memberActivity.length > 0 ? (
                <div className="space-y-3">
                  {memberActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-medium">{activity.action}</div>
                        {activity.details && (
                          <div className="text-xs text-muted-foreground">
                            {JSON.stringify(activity.details, null, 2)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">No recent activity found</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberProfileDialog;

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Shield, Eye, UserCheck, Bell, Trash2, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface SettingsTabProps {
  association: any;
  onUpdate: () => void;
}

export function SettingsTab({ association, onUpdate }: SettingsTabProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    is_public: association?.is_public || false,
    allow_member_invites: association?.allow_member_invites || false,
    require_approval: association?.require_approval || false,
    notification_emails: association?.notification_emails || true,
  });

  const handleSettingChange = async (key: string, value: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('associations')
        .update({ [key]: value })
        .eq('id', association.id);

      if (error) throw error;

      setSettings({ ...settings, [key]: value });
      toast({
        title: 'Setting updated',
        description: 'Your association setting has been updated.',
      });
      onUpdate();
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to update setting.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveAssociation = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('associations')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', association.id);

      if (error) throw error;

      toast({
        title: 'Association archived',
        description: 'Your association has been archived successfully.',
      });
      onUpdate();
    } catch (error: any) {
      console.error('Error archiving association:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive association.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy & Visibility</CardTitle>
          <CardDescription>
            Control who can see and join your association.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="public-association">Public Association</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Make your association visible to everyone. Private associations
                can only be found by invitation.
              </p>
            </div>
            <Switch
              id="public-association"
              checked={settings.is_public}
              onCheckedChange={(checked) =>
                handleSettingChange('is_public', checked)
              }
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="member-invites">Allow Member Invites</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow members to invite others to join the association. Admins
                can always invite new members.
              </p>
            </div>
            <Switch
              id="member-invites"
              checked={settings.allow_member_invites}
              onCheckedChange={(checked) =>
                handleSettingChange('allow_member_invites', checked)
              }
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="require-approval">Require Approval</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                New members must be approved by an admin before joining.
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={settings.require_approval}
              onCheckedChange={(checked) =>
                handleSettingChange('require_approval', checked)
              }
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how your association handles notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="notification-emails">Email Notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Send email notifications to admins for important events.
              </p>
            </div>
            <Switch
              id="notification-emails"
              checked={settings.notification_emails}
              onCheckedChange={(checked) =>
                handleSettingChange('notification_emails', checked)
              }
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your association.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Archive Association</p>
              <p className="text-sm text-muted-foreground">
                Archive this association and all its data. Archived associations
                can be restored later.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive Association?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive the association and make it inactive. You
                    can restore it later from the archives. All conventions and
                    inventory will be preserved but inaccessible until restored.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleArchiveAssociation}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Archive Association
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Delete Association</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this association and all associated data.
              </p>
              <Badge variant="destructive" className="mt-1">
                This action cannot be undone
              </Badge>
            </div>
            <Button variant="destructive" size="sm" disabled>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

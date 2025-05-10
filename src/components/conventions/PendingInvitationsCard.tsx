import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TrashIcon, RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ConventionInvitation {
  id: string;
  code: string;
  created_by: string;
  convention_id: string;
  role: string;
  expires_at: string;
  uses_remaining: number;
  created_at: string;
  creator: {
    name: string;
    email: string;
  } | null;
}

interface PendingInvitationsCardProps {
  conventionId: string;
  onUpdate: () => void;
}

const PendingInvitationsCard: React.FC<PendingInvitationsCardProps> = ({ conventionId, onUpdate }) => {
  const [invitations, setInvitations] = useState<ConventionInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_invitations')
        .select(`
          id,
          code,
          created_by,
          convention_id,
          role,
          expires_at,
          uses_remaining,
          created_at,
          creator:profiles(name, email)
        `)
        .eq('convention_id', conventionId)
        .gt('uses_remaining', 0)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching pending invitations:', error);
      toast({
        title: 'Error loading invitations',
        description: error.message || 'Could not fetch invitation list.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (conventionId) {
      fetchInvitations();
    }
  }, [conventionId]);

  const handleRemoveInvitation = async (invitationId: string, invitationCode: string) => {
    if (!confirm(`Are you sure you want to revoke invitation code ${invitationCode}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('convention_invitations')
        .update({ uses_remaining: 0 })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Invitation Revoked',
        description: `Invitation code ${invitationCode} has been revoked.`,
      });
      
      fetchInvitations(); // Refresh the list
      onUpdate(); // Notify parent component
    } catch (error: any) {
      console.error('Error revoking invitation:', error);
      toast({
        title: 'Error Revoking Invitation',
        description: error.message || 'Could not revoke the invitation.',
        variant: 'destructive',
      });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied to Clipboard',
      description: 'Invitation code has been copied to clipboard.',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Badge variant="default">Organizer</Badge>;
      case 'staff':
        return <Badge variant="secondary">Staff</Badge>;
      case 'helper':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Helper</Badge>;
      case 'attendee':
      default:
        return <Badge variant="outline" className="bg-muted">Attendee</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Pending Invitations</CardTitle>
          <CardDescription>Active invitation codes for this convention.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInvitations} className="h-8 w-8 p-0">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh invitations</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Spinner />
            <p className="ml-2 text-muted-foreground">Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pending invitations found.</p>
            <p className="text-sm text-muted-foreground mt-1">Create an invitation to invite people to this convention.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm bg-muted px-1 py-0.5 rounded">{invitation.code}</code>
                    {getRoleBadge(invitation.role)}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2 text-xs text-muted-foreground">
                    <span>Created: {format(new Date(invitation.created_at), 'MMM d, yyyy')}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Expires: {format(new Date(invitation.expires_at), 'MMM d, yyyy')}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Uses: {invitation.uses_remaining}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyInviteCode(invitation.code)}
                    aria-label={`Copy invitation code ${invitation.code}`}
                  >
                    Copy
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveInvitation(invitation.id, invitation.code)}
                    aria-label={`Revoke invitation code ${invitation.code}`}
                  >
                    <TrashIcon className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingInvitationsCard;

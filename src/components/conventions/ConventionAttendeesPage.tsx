import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserRoundPlus, Trash2, TicketPlus } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { InviteAttendeeDialog } from '@/components/conventions/InviteAttendeeDialog';
import PendingInvitationsCard from '@/components/conventions/PendingInvitationsCard';
import RedeemInvitationDialog from '@/components/conventions/RedeemInvitationDialog';

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface ConventionAttendee {
  id: string; // convention_access id
  user_id: string;
  created_at: string;
  role: string; // Updated to include role
  invitation_code?: string | null; // Track if they joined via invitation code
  profile: Pick<Profile, 'id' | 'name' | 'email'> | null; // Include profile details
}

interface ConventionAttendeesPageProps {
  conventionId: string;
}

const ConventionAttendeesPage = ({ conventionId }: ConventionAttendeesPageProps) => {  const [attendees, setAttendees] = useState<ConventionAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [canManageRoles, setCanManageRoles] = useState(false);  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(true); // Default to true initially
  const [attendeeStats, setAttendeeStats] = useState({
    organizers: 0,
    staff: 0,
    helpers: 0,
    attendees: 0,
    total: 0
  });
  const { toast } = useToast();const fetchAttendees = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (user) {
        setCurrentUserId(user.id);
        
        // Check if the user has access to this convention
        const { data: accessData, error: accessError } = await supabase.rpc(
          'can_access_convention', 
          { p_convention_id: conventionId }
        );
        
        if (accessError) throw accessError;
        
        // Update access state
        const hasAccessToConvention = !!accessData;
        setHasAccess(hasAccessToConvention);
        
        // First check if current user can manage this convention
        const { data: canManageData, error: canManageError } = await supabase
          .rpc('can_manage_convention', { p_convention_id: conventionId });
        
        if (canManageError) throw canManageError;
        setCanManageRoles(canManageData || false);

        // Only fetch attendees if the user has access
        if (hasAccessToConvention) {
          // Fetch attendees with their roles and invitation codes (if any)
          const { data, error } = await supabase
            .from('convention_access')
            .select(`
              id,
              user_id,
              created_at,
              role,
              invitation_code,
              profile:profiles ( id, name, email ) 
            `)
            .eq('convention_id', conventionId)
            .order('role', { ascending: false })
            .order('created_at', { ascending: true });          if (error) throw error;
          
          // Filter out entries where profile might be null if needed, or handle display appropriately
          const attendeeList = data || [];
          setAttendees(attendeeList);
          
          // Calculate stats
          const stats = {
            organizers: 0,
            staff: 0,
            helpers: 0,
            attendees: 0,
            total: attendeeList.length
          };
          
          attendeeList.forEach(attendee => {
            switch(attendee.role) {
              case 'organizer':
                stats.organizers++;
                break;
              case 'staff':
                stats.staff++;
                break;
              case 'helper':
                stats.helpers++;
                break;
              case 'attendee':
                stats.attendees++;
                break;
            }
          });
          
          setAttendeeStats(stats);
        }
      } else {
        // No user is logged in
        setAttendees([]);
      }

    } catch (error: any) {
      console.error('Error fetching convention attendees:', error);
      toast({
        title: 'Error loading attendees',
        description: error.message || 'Could not fetch attendee list.',
        variant: 'destructive',
      });
      setAttendees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (conventionId) {
      fetchAttendees();
    }
  }, [conventionId]);

  const handleRemoveAttendee = async (accessId: string, attendeeName: string | null | undefined) => {
    const name = attendeeName || 'this attendee';
    if (!confirm(`Are you sure you want to remove ${name} from this convention?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('convention_access')
        .delete()
        .eq('id', accessId);

      if (error) throw error;

      toast({
        title: 'Attendee Removed',
        description: `${name} has been removed from the convention.`,
      });
      fetchAttendees(); // Refresh the list
    } catch (error: any) {
      console.error('Error removing attendee:', error);
      toast({
        title: 'Error Removing Attendee',
        description: error.message || 'Could not remove the attendee.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateRole = async (accessId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('convention_access')
        .update({ role: newRole })
        .eq('id', accessId);

      if (error) throw error;

      toast({
        title: 'Role Updated',
        description: 'The attendee role has been updated successfully.',
      });
      
      // Update local state
      setAttendees(attendees.map(attendee => 
        attendee.id === accessId 
          ? { ...attendee, role: newRole } 
          : attendee
      ));
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error Updating Role',
        description: error.message || 'Could not update the role.',
        variant: 'destructive',
      });
    }
  };
    const handleInviteAttendee = () => {
    setIsInviteDialogOpen(true);
  };

  const handleRedeemInvitation = () => {
    setIsRedeemDialogOpen(true);
  };

  const handleInviteSent = () => {
    setIsInviteDialogOpen(false);
    fetchAttendees(); // Refresh the attendee list
  };
  
  const handleInvitationRedeemed = () => {
    setIsRedeemDialogOpen(false);
    fetchAttendees(); // Refresh the attendee list
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
    <div className="space-y-6">
      <Card>        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Convention Attendees</CardTitle>
            <CardDescription>Manage users who have access to this convention.</CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Redeem invitation code button */}
            <Button variant="outline" size="sm" onClick={handleRedeemInvitation}>
              <TicketPlus className="mr-2 h-4 w-4" />
              Redeem Code
            </Button>
            
            {/* Invite attendee button - only show for those who can manage */}
            {canManageRoles && (
              <Button variant="outline" size="sm" onClick={handleInviteAttendee}>
                <UserRoundPlus className="mr-2 h-4 w-4" />
                Invite Attendee
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Show message when user doesn't have access */}          {!hasAccess && !isLoading && (
            <div className="bg-muted/50 rounded-md p-6 text-center">
              <p className="text-muted-foreground">You don't have access to view the attendee list.</p>
              <p className="mt-2 text-sm text-muted-foreground">Use an invitation code to join this convention.</p>
              <Button variant="default" className="mt-4" onClick={handleRedeemInvitation}>
                <TicketPlus className="mr-2 h-4 w-4" />
                Redeem Invitation Code
              </Button>
            </div>
          )}
          
          {/* Attendee Stats Display */}
          {hasAccess && !isLoading && attendees.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
              <div className="border rounded-md p-3 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{attendeeStats.total}</p>
              </div>
              <div className="border rounded-md p-3 text-center">
                <p className="text-xs text-muted-foreground">Organizers</p>
                <p className="text-2xl font-bold">{attendeeStats.organizers}</p>
              </div>
              <div className="border rounded-md p-3 text-center">
                <p className="text-xs text-muted-foreground">Staff</p>
                <p className="text-2xl font-bold">{attendeeStats.staff}</p>
              </div>
              <div className="border rounded-md p-3 text-center">
                <p className="text-xs text-muted-foreground">Helpers</p>
                <p className="text-2xl font-bold">{attendeeStats.helpers}</p>
              </div>
              <div className="border rounded-md p-3 text-center">
                <p className="text-xs text-muted-foreground">Attendees</p>
                <p className="text-2xl font-bold">{attendeeStats.attendees}</p>
              </div>
            </div>
          )}
            {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner />
              <p className="ml-2 text-muted-foreground">Loading attendees...</p>
            </div>
          ) : !hasAccess ? (
            // The no-access message will be displayed above this condition
            null
          ) : attendees.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No attendees found for this convention yet.</p>
              {canManageRoles && (
                <Button variant="outline" className="mt-4" onClick={handleInviteAttendee}>
                  <UserRoundPlus className="mr-2 h-4 w-4" />
                  Invite First Attendee
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">{attendees.map((attendee) => {
                const isCurrentUser = attendee.user_id === currentUserId;
                return (
                  <li key={attendee.id} className={`flex items-center justify-between p-3 border rounded-md bg-card ${isCurrentUser ? 'border-primary/20 bg-primary/5' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium flex items-center gap-1">
                          {attendee.profile?.name || 'Unknown User'}
                          {isCurrentUser && <span className="text-xs text-primary">(You)</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">{attendee.profile?.email || 'No email available'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {getRoleBadge(attendee.role)}
                        {attendee.invitation_code && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">
                            Invited
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageRoles && (
                        <>
                          <Select
                            defaultValue={attendee.role}
                            onValueChange={(value) => handleUpdateRole(attendee.id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="organizer">Organizer</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="helper">Helper</SelectItem>
                              <SelectItem value="attendee">Attendee</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Don't allow removing yourself */}
                          {!isCurrentUser && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveAttendee(attendee.id, attendee.profile?.name)}
                              aria-label={`Remove ${attendee.profile?.name || 'attendee'}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
            {/* Invite Attendee Dialog */}
          <InviteAttendeeDialog 
            isOpen={isInviteDialogOpen}
            conventionId={conventionId}
            onClose={() => setIsInviteDialogOpen(false)}
            onInviteSent={handleInviteSent}
          />
            {/* Redeem Invitation Dialog */}
          <RedeemInvitationDialog
            isOpen={isRedeemDialogOpen}
            onClose={() => setIsRedeemDialogOpen(false)}
            onRedeemed={handleInvitationRedeemed}
          />
        </CardContent>
      </Card>

      {/* Only show pending invitations if user can manage roles */}
      {canManageRoles && (
        <PendingInvitationsCard conventionId={conventionId} onUpdate={fetchAttendees} />
      )}
    </div>
  );
};

export default ConventionAttendeesPage;

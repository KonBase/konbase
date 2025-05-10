import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Copy, CheckCircle } from 'lucide-react';

interface InviteAttendeeDialogProps {
  isOpen: boolean;
  conventionId: string;
  onClose: () => void;
  onInviteSent: () => void;
}

export const InviteAttendeeDialog: React.FC<InviteAttendeeDialogProps> = ({
  isOpen,
  conventionId,
  onClose,
  onInviteSent
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('attendee');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const handleCreateInvite = async () => {
    setIsLoading(true);
    try {
      // Generate a random alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Set expiration date to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');
      
      // Create the invitation in the database
      const { error } = await supabase.from('convention_invitations').insert({
        code,
        convention_id: conventionId,
        created_by: user.id,
        role, // Use the selected role
        expires_at: expiresAt.toISOString(),
        uses_remaining: 1, // Single-use invitation
      });
      
      if (error) throw error;
      
      // Log creation to convention_logs
      await supabase.from('convention_logs').insert({
        convention_id: conventionId,
        user_id: user.id,
        action: 'Created Invitation',
        details: { role, email: email || null }
      });
      
      // If email was provided, send email (this would typically be done server-side)
      if (email) {
        // TODO: Implement real email sending via a server function
        // For now, just show the code to be shared manually
        toast({
          title: 'Invitation Created',
          description: `An invitation code has been created. Please share it with ${email}.`,
        });
      }
      
      // Show the invitation code
      setInviteCode(code);
      
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Error Creating Invitation',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };  const handleSearchUser = async () => {
    setIsLoading(true);
    try {
      // Check if user exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('email', email)
        .maybeSingle();

      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Handle case where user doesn't exist
      if (!data) {
        // User not found - create invitation and suggest sharing with them
        toast({
          title: 'User Not Found',
          description: `No user with email ${email} was found. Creating invitation code instead.`,
          variant: 'default',
        });
        
        // Generate a random alphanumeric code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Set expiration date to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        // Create invitation
        const { error: inviteError } = await supabase.from('convention_invitations').insert({
          code,
          convention_id: conventionId,
          created_by: user.id,
          role, // Use the selected role
          expires_at: expiresAt.toISOString(),
          uses_remaining: 1, // Single-use invitation
        });
        
        if (inviteError) throw inviteError;
        
        // Log creation to convention_logs
        await supabase.from('convention_logs').insert({
          convention_id: conventionId,
          user_id: user.id,
          action: 'Created Invitation for New User',
          details: { role, email }
        });
        
        setInviteCode(code);
        return;
      }

      if (error) throw error;

      // Check if user is already in convention
      const { data: existingAccess, error: checkError } = await supabase
        .from('convention_access')
        .select('id')
        .eq('convention_id', conventionId)
        .eq('user_id', data.id)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingAccess) {
        toast({
          title: 'Already Added',
          description: `User ${data.name} already has access to this convention.`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'User Found',
        description: `User ${data.name} (${data.email}) found. Adding to attendees...`,
      });

      // Add the user to convention attendees
      const { error: addError } = await supabase
        .from('convention_access')
        .insert({
          convention_id: conventionId,
          user_id: data.id,
          role,
        });

      if (addError) throw addError;

      // Log to convention logs
      await supabase.from('convention_logs').insert({
        convention_id: conventionId,
        user_id: user.id,
        action: 'Added User',
        details: { 
          added_user_id: data.id, 
          added_user_name: data.name, 
          added_user_email: data.email, 
          role 
        }
      });

      toast({
        title: 'User Added',
        description: `${data.name} has been added to the convention as ${role}.`,
      });

      // Notify parent component and reset state
      onInviteSent();
      setEmail('');
      setRole('attendee');
      onClose();
    } catch (error: any) {
      console.error('Error searching or adding user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not add the user to the convention.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setIsCopied(true);
      toast({
        title: 'Copied to Clipboard',
        description: 'Invitation code has been copied to clipboard.',
      });
      
      // Reset copy state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleClose = () => {
    // Reset the dialog state
    setEmail('');
    setRole('attendee');
    setInviteCode(null);
    setIsCopied(false);
    
    // If an invite was created, notify the parent
    if (inviteCode) {
      onInviteSent();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Convention Attendee</DialogTitle>
          <DialogDescription>
            Search for a user by email or create an invitation manually.
          </DialogDescription>
        </DialogHeader>
        {/* Invate as mail*/}
        {!inviteCode ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="Enter user email"
                  className="col-span-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4 mt-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>                <Select 
                  value={role} 
                  onValueChange={setRole}
                >
                  <SelectTrigger className="col-span-3" id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="helper">Helper</SelectItem>
                    <SelectItem value="attendee">Attendee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                  type="submit"
                  onClick={handleSearchUser}
                  disabled={isLoading || !email}
              >
                {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                ) : (
                    'Search User'
                )}
              </Button>
              <Button 
                type="submit" 
                onClick={handleCreateInvite} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Invitation'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Invite Code
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="code"
                    value={inviteCode}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={handleCopyCode}
                  >
                    {isCopied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="col-span-4 text-sm text-muted-foreground">
                <p>Share this code with the attendee. They can use it to join the convention.</p>
                <p className="mt-1">The code will expire in 7 days and can only be used once.</p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleClose}
              >
                Done
              </Button>
              <Button
                onClick={() => {
                  setInviteCode(null);
                  setEmail('');
                  setRole('attendee');
                }}
              >
                Create Another
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};


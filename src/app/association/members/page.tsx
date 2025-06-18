'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Loader2,
  UserCheck,
  UserX,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAssociation } from '@/contexts/AssociationContext';
import InviteMemberDialog from '@/components/association/InviteMemberDialog';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { ErrorType } from '@/types/common';

interface Member {
  id: string;
  user_id: string;
  association_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    id: string;
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface Invitation {
  id: string;
  association_id: string;
  email?: string;
  role: string;
  code: string;
  created_at: string;
  used: boolean;
}

export default function AssociationMembersPage() {
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!currentAssociation) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('association_members')
        .select(
          `
          *,
          profiles:user_id (id, email, display_name, avatar_url)
        `,
        )
        .eq('association_id', currentAssociation.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      const err = error as ErrorType;
      console.error('Error loading members:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: err && typeof err === 'object' && 'details' in err ? err.details : undefined,
        code: err && typeof err === 'object' && 'code' in err ? err.code : undefined
      });
      
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      toast({
        title: 'Error loading members',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentAssociation, toast]);

  const fetchInvitations = useCallback(async () => {
    if (!currentAssociation) return;

    try {
      const { data, error } = await supabase
        .from('association_invitations')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .eq('used', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (error) {
      const err = error as ErrorType;
      console.error('Error loading invitations:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: err && typeof err === 'object' && 'details' in err ? err.details : undefined,
        code: err && typeof err === 'object' && 'code' in err ? err.code : undefined
      });
      
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      toast({
        title: 'Error loading invitations',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [currentAssociation]);

  useEffect(() => {
    if (currentAssociation) {
      fetchMembers();
      fetchInvitations();
    }
  }, [currentAssociation, fetchMembers, fetchInvitations]);

  const handleInviteSent = () => {
    fetchInvitations();
    setIsInviteDialogOpen(false);
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('association_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Invitation deleted',
        description: 'The invitation has been deleted successfully',
      });

      fetchInvitations();
    } catch (error) {
      const err = error as ErrorType;
      console.error('Error deleting invitation:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: err && typeof err === 'object' && 'details' in err ? err.details : undefined,
        code: err && typeof err === 'object' && 'code' in err ? err.code : undefined
      });
      
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      toast({
        title: 'Error deleting invitation',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return (
          <Badge className="bg-amber-500">
            <ShieldAlert className="mr-1 h-3 w-3" /> Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge>
            <ShieldCheck className="mr-1 h-3 w-3" /> Admin
          </Badge>
        );
      case 'manager':
        return (
          <Badge variant="secondary">
            <Shield className="mr-1 h-3 w-3" /> Manager
          </Badge>
        );
      case 'member':
        return (
          <Badge variant="outline">
            <UserCheck className="mr-1 h-3 w-3" /> Member
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredMembers = members.filter((member) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    const profile = member.profiles;

    return (
      profile?.display_name?.toLowerCase().includes(term) ||
      profile?.email?.toLowerCase().includes(term) ||
      member.role?.toLowerCase().includes(term)
    );
  });

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Association Members
              </h1>
            </div>
            <p className="text-muted-foreground">
              {currentAssociation?.name
                ? `Manage members for ${currentAssociation.name}`
                : 'Manage your association members'}
            </p>
          </div>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Manage users with access to this association.
            </CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">
                  Loading members...
                </span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? 'No members match your search criteria.'
                    : 'This association has no members yet.'}
                </p>
                {searchTerm ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsInviteDialogOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite First Member
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profiles?.avatar_url} />
                            <AvatarFallback>
                              {member.profiles?.display_name?.charAt(0) ||
                                member.profiles?.email?.charAt(0) ||
                                '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.profiles?.display_name || 'Unnamed User'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.profiles?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString()
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that have been sent but not yet accepted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invited Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {invitation.email || 'No email'}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1 py-0.5 text-sm font-mono">
                          {invitation.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvitation(invitation.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <UserX className="mr-1 h-4 w-4" /> Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {isInviteDialogOpen && (
          <InviteMemberDialog onInviteSent={handleInviteSent} />
        )}
      </div>
    </AuthGuard>
  );
}

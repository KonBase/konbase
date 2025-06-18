'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddUserToAssociation } from '@/components/admin/AddUserToAssociation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Search, Trash2, Plus, ExternalLink } from 'lucide-react';
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
import { Association } from '@/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAssociation } from '@/contexts/AssociationContext';

// Interface for association creation/edit form
interface AssociationFormData {
  name: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  address: string;
}

export function AssociationManagement() {
  const router = useRouter();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loadingAssociations, setLoadingAssociations] = useState(true);
  const [associationSearchQuery, setAssociationSearchQuery] = useState('');
  const [newAssociationDialogOpen, setNewAssociationDialogOpen] =
    useState(false);
  const [formData, setFormData] = useState<AssociationFormData>({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    address: '',
  });

  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { currentAssociation, setCurrentAssociation } = useAssociation();

  const fetchAssociations = async () => {
    setLoadingAssociations(true);
    try {
      const { data, error } = await supabase
        .from('associations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAssociations = data.map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
        contactEmail: a.contact_email,
        contactPhone: a.contact_phone || '',
        website: a.website || '',
        address: a.address || '',
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        logo: a.logo || '',
      }));

      setAssociations(formattedAssociations || []);
    } catch (error: any) {
      console.error('Error fetching associations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load associations',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssociations(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
  }, []);

  const handleCreateAssociation = async () => {
    try {
      const {
        name,
        description,
        contact_email,
        contact_phone,
        website,
        address,
      } = formData;

      if (!name || !contact_email) {
        toast({
          title: 'Validation Error',
          description: 'Name and contact email are required',
          variant: 'destructive',
        });
        return;
      }

      // Generate a UUID for the new association
      const id = crypto.randomUUID();

      const now = new Date().toISOString();
      const newAssociation = {
        id,
        name,
        description,
        contact_email,
        contact_phone,
        website,
        address,
        created_at: now,
        updated_at: now,
      };

      const { error } = await supabase
        .from('associations')
        .insert(newAssociation);

      if (error) throw error;

      // Create audit log entry
      await supabase.from('audit_logs').insert({
        action: 'create_association',
        entity: 'associations',
        entity_id: id,
        user_id: profile?.id || '',
        changes: newAssociation,
      });

      toast({
        title: 'Success',
        description: 'Association created successfully',
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        description: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        address: '',
      });

      setNewAssociationDialogOpen(false);

      // Refresh associations
      fetchAssociations();
    } catch (error: any) {
      console.error('Error creating association:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create association',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAssociation = async (id: string) => {
    try {
      // First check if this association has members
      const { count, error: countError } = await supabase
        .from('association_members')
        .select('*', { count: 'exact', head: true })
        .eq('association_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        // Remove all association members first
        const { error: deleteMemError } = await supabase
          .from('association_members')
          .delete()
          .eq('association_id', id);

        if (deleteMemError) throw deleteMemError;
      }

      // Then delete the association
      const { error } = await supabase
        .from('associations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Create audit log entry
      await supabase.from('audit_logs').insert({
        action: 'delete_association',
        entity: 'associations',
        entity_id: id,
        user_id: profile?.id || '',
      });

      toast({
        title: 'Success',
        description: 'Association deleted successfully',
      });
      await fetchAssociations();
      if (id === currentAssociation?.id) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Error deleting association:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete association',
        variant: 'destructive',
      });
    }
  };

  const handleManageAssociation = (association: Association) => {
    try {
      // Set this association as the current association for admin to manage
      setCurrentAssociation(association);

      // Create a small delay to ensure the context is updated
      setTimeout(() => {
        // Navigate to the association profile page
        router.push(`/association/profile`);

        // Notify the admin
        toast({
          title: 'Association Selected',
          description: `You are now managing ${association.name}`,
        });
      }, 100);
    } catch (error: any) {
      console.error('Error selecting association:', error);
      toast({
        title: 'Error',
        description: 'Failed to select association for management',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Filter associations based on search query
  const filteredAssociations = associations.filter(
    (association) =>
      association.name
        .toLowerCase()
        .includes(associationSearchQuery.toLowerCase()) ||
      association.description
        ?.toLowerCase()
        .includes(associationSearchQuery.toLowerCase() || ''),
  );

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Association Management</CardTitle>
              <CardDescription>
                View, create and manage associations
              </CardDescription>
            </div>
            <AlertDialog
              open={newAssociationDialogOpen}
              onOpenChange={setNewAssociationDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Association
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>Create New Association</AlertDialogTitle>
                  <AlertDialogDescription>
                    Complete the form below to create a new association.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name*
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact_email" className="text-right">
                      Contact Email*
                    </Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact_phone" className="text-right">
                      Contact Phone
                    </Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="website" className="text-right">
                      Website
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCreateAssociation}>
                    Create
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search associations by name or description"
              value={associationSearchQuery}
              onChange={(e) => setAssociationSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingAssociations ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex justify-between p-2 border-b animate-pulse"
                >
                  <div className="space-y-1">
                    <div className="h-4 w-40 bg-muted rounded"></div>
                    <div className="h-3 w-60 bg-muted rounded"></div>
                  </div>
                  <div className="h-8 w-32 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredAssociations.length === 0 ? (
            <p className="text-center py-4">No associations found</p>
          ) : (
            <div className="space-y-6">
              {filteredAssociations.map((association) => (
                <Card key={association.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between">
                      <CardTitle>{association.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageAssociation(association)}
                          title="Manage this association"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Manage
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Association
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this
                                association? This action cannot be undone and
                                will remove all related data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteAssociation(association.id)
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <CardDescription>
                      {association.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm">Contact</h4>
                        <p className="text-sm">{association.contactEmail}</p>
                        {association.contactPhone && (
                          <p className="text-sm">{association.contactPhone}</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Website</h4>
                        <p className="text-sm">
                          {association.website || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {association.address && (
                      <div>
                        <h4 className="font-semibold text-sm">Address</h4>
                        <p className="text-sm">{association.address}</p>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Association Members
                      </h4>
                      <AddUserToAssociation
                        associationId={association.id}
                        onUserAdded={() => {}}
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        asChild
                      >
                        <Link
                          href={`/association/members?associationId=${association.id}`}
                        >
                          View All Members
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                  <CardContent className="text-xs text-muted-foreground pt-0">
                    ID: {association.id} | Created:{' '}
                    {new Date(association.createdAt).toLocaleDateString()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

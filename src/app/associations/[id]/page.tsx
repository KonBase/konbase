'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Users,
  Calendar,
  Settings,
  Globe,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
} from 'lucide-react';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth';
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
import { EditAssociationDialog } from '@/components/association/EditAssociationDialog';
import { MembersTab } from '@/components/association/MembersTab';
import { ConventionsTab } from '@/components/association/ConventionsTab';
import { SettingsTab } from '@/components/association/SettingsTab';

interface AssociationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AssociationDetailPage({
  params,
}: AssociationDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [association, setAssociation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    memberCount: 0,
    conventionCount: 0,
    activeConventions: 0,
  });

  const fetchAssociation = async () => {
    try {
      const { data, error } = await supabase
        .from('associations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAssociation(data);

      // Fetch stats
      await fetchStats();
    } catch (error: any) {
      console.error('Error fetching association:', error);
      toast.error('Failed to load association details');
      router.push('/associations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch member count
      const { count: memberCount } = await supabase
        .from('association_members')
        .select('*', { count: 'exact', head: true })
        .eq('association_id', id);

      // Fetch convention count
      const { count: conventionCount } = await supabase
        .from('conventions')
        .select('*', { count: 'exact', head: true })
        .eq('association_id', id);

      // Fetch active conventions
      const { count: activeConventions } = await supabase
        .from('conventions')
        .select('*', { count: 'exact', head: true })
        .eq('association_id', id)
        .eq('status', 'active');

      setStats({
        memberCount: memberCount || 0,
        conventionCount: conventionCount || 0,
        activeConventions: activeConventions || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('associations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Association deleted successfully');
      router.push('/associations');
    } catch (error: any) {
      console.error('Error deleting association:', error);
      toast.error('Failed to delete association');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    fetchAssociation();
  }, [id]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    );
  }

  if (!association) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Association not found</h2>
            <p className="text-muted-foreground mb-4">
              The association you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link href="/associations">Back to Associations</Link>
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isOwner = association.owner_id === user?.id;

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/associations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Associations
              </Link>
            </Button>
          </div>
          {isOwner && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the association and all associated data including
                      conventions, members, and inventory.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{association.name}</CardTitle>
                <CardDescription className="mt-2">
                  {association.description}
                </CardDescription>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {association.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Website</p>
                    <a
                      href={association.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {association.website}
                    </a>
                  </div>
                </div>
              )}
              {association.contact_email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href={`mailto:${association.contact_email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {association.contact_email}
                    </a>
                  </div>
                </div>
              )}
              {association.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {association.phone}
                    </p>
                  </div>
                </div>
              )}
              {association.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {association.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="conventions">Conventions</TabsTrigger>
            {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Association Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                    <h3 className="text-2xl font-bold">{stats.memberCount}</h3>
                    <p className="text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
                    <h3 className="text-2xl font-bold">
                      {stats.conventionCount}
                    </h3>
                    <p className="text-muted-foreground">Total Conventions</p>
                  </div>
                  <div className="text-center">
                    <Settings className="h-8 w-8 mx-auto text-primary mb-2" />
                    <h3 className="text-2xl font-bold">
                      {stats.activeConventions}
                    </h3>
                    <p className="text-muted-foreground">Active Conventions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <MembersTab associationId={id} isOwner={isOwner} />
          </TabsContent>

          <TabsContent value="conventions">
            <ConventionsTab associationId={id} />
          </TabsContent>

          {isOwner && (
            <TabsContent value="settings">
              <SettingsTab
                association={association}
                onUpdate={fetchAssociation}
              />
            </TabsContent>
          )}
        </Tabs>

        <EditAssociationDialog
          association={association}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={fetchAssociation}
        />
      </div>
    </AuthGuard>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, BuildingIcon, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionLocation } from '@/types/convention';
import { AddLocationDialog } from '@/components/conventions/AddLocationDialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConventionLocationsTabProps {
  conventionId: string;
}

const ConventionLocationsTab: React.FC<ConventionLocationsTabProps> = ({
  conventionId,
}) => {
  const { currentAssociation } = useAssociation();
  const [locations, setLocations] = useState<ConventionLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] =
    useState<ConventionLocation | null>(null);
  const [canManageLocations, setCanManageLocations] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] =
    useState<ConventionLocation | null>(null);
  const { toast } = useToast();

  const fetchLocations = useCallback(async () => {
    if (!conventionId || !currentAssociation) return;

    setIsLoading(true);
    try {
      console.log('Fetching locations for convention:', conventionId);

      // First check if user can manage this convention
      const { data: canManageData, error: canManageError } = await supabase.rpc(
        'can_manage_convention',
        { p_convention_id: conventionId },
      );

      if (canManageError) throw canManageError;
      setCanManageLocations(canManageData || false);

      const { data, error } = await supabase
        .from('convention_locations')
        .select('*')
        .eq('convention_id', conventionId)
        .order('name');

      if (error) throw error;

      console.log('Locations fetched:', data?.length || 0);
      setLocations(data || []);
    } catch (error: any) {
      console.error('Error loading locations:', error);
      toast({
        title: 'Error loading locations',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [conventionId, currentAssociation, toast]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleLocationAdded = () => {
    console.log('Location added/updated callback triggered');
    fetchLocations();
  };

  const handleEditLocation = (location: ConventionLocation) => {
    setLocationToEdit(location);
    setIsAddLocationOpen(true);
  };

  const handleDeleteLocation = (location: ConventionLocation) => {
    setLocationToDelete(location);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteLocation = async () => {
    if (!locationToDelete || !conventionId) return;

    try {
      // Check if location is used by equipment
      const { count, error: countError } = await supabase
        .from('convention_equipment')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationToDelete.id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast({
          title: 'Cannot delete location',
          description:
            'This location has equipment assigned to it. Please reassign or remove the equipment first.',
          variant: 'destructive',
        });
        setDeleteConfirmOpen(false);
        return;
      }

      // Delete the location
      const { error } = await supabase
        .from('convention_locations')
        .delete()
        .eq('id', locationToDelete.id);

      if (error) throw error;

      toast({
        title: 'Location deleted',
        description: `${locationToDelete.name} has been deleted successfully.`,
      });

      // Log the action
      await supabase.from('convention_logs').insert({
        convention_id: conventionId,
        user_id: currentAssociation?.id,
        action: 'delete',
        entity_type: 'location',
        entity_id: locationToDelete.id,
        details: { name: locationToDelete.name },
      });

      // Refresh locations
      fetchLocations();
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error deleting location',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Handle opening the location dialog
  const openAddLocationDialog = () => {
    console.log('Opening add location dialog for convention:', conventionId);
    setLocationToEdit(null);
    setIsAddLocationOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddLocationOpen(false);
    setLocationToEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <CardTitle>Convention Locations</CardTitle>
        <Button onClick={openAddLocationDialog}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Locations List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BuildingIcon className="h-5 w-5" /> Defined Locations
          </CardTitle>
          <CardDescription>
            Rooms, halls, and areas used during this convention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Loading locations...
              </span>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-10">
              <BuildingIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No Locations Added Yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Define specific locations used during the convention.
              </p>
              <Button
                variant="default"
                className="mt-4"
                onClick={openAddLocationDialog}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add First Location
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        {location.name}
                      </TableCell>
                      <TableCell>{location.type || '—'}</TableCell>
                      <TableCell className="text-right">
                        {location.capacity || '—'}
                      </TableCell>
                      <TableCell>{location.building || '—'}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {location.description || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageLocations && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLocation(location)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLocation(location)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Location Dialog */}
      <AddLocationDialog
        isOpen={isAddLocationOpen}
        onOpenChange={setIsAddLocationOpen}
        onClose={handleCloseDialog}
        onLocationAdded={handleLocationAdded}
        conventionId={conventionId}
        locationToEdit={locationToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the location "
              {locationToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLocation}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConventionLocationsTab;

// Add named export as well
export { ConventionLocationsTab };

'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { AddEditLocationDialog } from '@/components/inventory/AddEditLocationDialog';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

interface StorageLocation {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  item_count?: number;
  created_at: string;
}

export default function StorageLocationsPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<StorageLocation | null>(null);
  const [locationToDelete, setLocationToDelete] =
    useState<StorageLocation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data: locationsData, error: locationsError } = await supabase
        .from('storage_locations')
        .select('*')
        .order('name');

      if (locationsError) throw locationsError;

      // Fetch item counts for each location
      const { data: itemCounts, error: countError } = await supabase
        .from('items')
        .select('storage_location_id')
        .in(
          'storage_location_id',
          locationsData.map((l) => l.id),
        );

      if (!countError && itemCounts) {
        const countMap = itemCounts.reduce(
          (acc, item) => {
            acc[item.storage_location_id] =
              (acc[item.storage_location_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        const locationsWithCounts = locationsData.map((location) => ({
          ...location,
          item_count: countMap[location.id] || 0,
        }));

        setLocations(locationsWithCounts);
      } else {
        setLocations(locationsData);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load storage locations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: StorageLocation) => {
    setSelectedLocation(location);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;

    try {
      const { error } = await supabase
        .from('storage_locations')
        .delete()
        .eq('id', locationToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Storage location deleted successfully',
      });

      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description:
          'Failed to delete location. Make sure no items are stored in this location.',
        variant: 'destructive',
      });
    } finally {
      setLocationToDelete(null);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Storage Locations</h1>
            <p className="text-muted-foreground">
              Manage where your inventory is stored
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No storage locations yet
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first storage location to track where items are stored
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          {location.name}
                        </CardTitle>
                        {location.description && (
                          <CardDescription>
                            {location.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {location.item_count || 0} items
                    </Badge>
                  </div>
                </CardHeader>
                {location.address && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {location.address}
                    </p>
                  </CardContent>
                )}
                <CardContent className="pt-0">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(location)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocationToDelete(location)}
                      disabled={(location.item_count || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddEditLocationDialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setSelectedLocation(null);
          }}
          location={selectedLocation}
          onSuccess={() => {
            setIsAddDialogOpen(false);
            setSelectedLocation(null);
            fetchLocations();
          }}
        />

        <AlertDialog
          open={!!locationToDelete}
          onOpenChange={() => setLocationToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Storage Location</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{locationToDelete?.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
}

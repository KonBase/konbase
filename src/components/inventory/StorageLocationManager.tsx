'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { MapPin, Plus, Search, Package, Edit, Trash2 } from 'lucide-react';
import { AddEditLocationDialog } from './AddEditLocationDialog';
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

interface StorageLocation {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  item_count?: number;
  parent_id: string | null;
  children?: StorageLocation[];
}

export function StorageLocationManager() {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<StorageLocation | null>(null);
  const [locationToDelete, setLocationToDelete] =
    useState<StorageLocation | null>(null);

  useEffect(() => {
    if (currentAssociation) {
      fetchLocations();
    }
  }, [currentAssociation]);

  const fetchLocations = async () => {
    if (!currentAssociation) return;

    try {
      setLoading(true);
      const { data: locationsData, error: locationsError } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .order('name');

      if (locationsError) throw locationsError;

      // Fetch item counts
      const { data: itemCounts, error: countError } = await supabase
        .from('inventory_items')
        .select('location_id')
        .eq('association_id', currentAssociation.id);

      if (!countError && itemCounts) {
        const countMap = itemCounts.reduce(
          (acc, item) => {
            if (item.location_id) {
              acc[item.location_id] = (acc[item.location_id] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>,
        );

        const locationsWithCounts = locationsData.map((location) => ({
          ...location,
          item_count: countMap[location.id] || 0,
        }));

        // Build hierarchy
        const locationMap = new Map<string, StorageLocation>();
        const rootLocations: StorageLocation[] = [];

        locationsWithCounts.forEach((loc) => {
          locationMap.set(loc.id, { ...loc, children: [] });
        });

        locationsWithCounts.forEach((loc) => {
          const location = locationMap.get(loc.id)!;
          if (loc.parent_id && locationMap.has(loc.parent_id)) {
            locationMap.get(loc.parent_id)!.children!.push(location);
          } else {
            rootLocations.push(location);
          }
        });

        setLocations(rootLocations);
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
        description: 'Location deleted successfully',
      });

      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description:
          'Failed to delete location. Make sure no items are stored here.',
        variant: 'destructive',
      });
    } finally {
      setLocationToDelete(null);
    }
  };

  const renderLocation = (location: StorageLocation, level: number = 0) => {
    const isVisible =
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!isVisible && searchTerm) return null;

    return (
      <div key={location.id} className={`${level > 0 ? 'ml-8' : ''}`}>
        <Card className="mb-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">{location.name}</CardTitle>
                <Badge variant="secondary">
                  {location.item_count || 0} items
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(location)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocationToDelete(location)}
                  disabled={(location.item_count || 0) > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {(location.description || location.address) && (
            <CardContent className="pt-0">
              {location.description && (
                <p className="text-sm text-muted-foreground">
                  {location.description}
                </p>
              )}
              {location.address && (
                <p className="text-sm text-muted-foreground mt-1">
                  {location.address}
                </p>
              )}
            </CardContent>
          )}
        </Card>
        {location.children &&
          location.children.map((child) => renderLocation(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storage Locations</CardTitle>
              <CardDescription>
                Organize inventory by physical storage areas
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No storage locations yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Add your first storage location to organize inventory
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => renderLocation(location))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';

export interface Location {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  associationId: string;
  isRoom: boolean;
  type: string; // This is needed for the UI
  createdAt: string;
  updatedAt: string;
}

export type NewLocation = Omit<Location, 'id' | 'createdAt' | 'updatedAt'>;

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();

  useEffect(() => {
    if (currentAssociation) {
      fetchLocations();
    } else {
      setLocations([]);
      setLoading(false);
    }
  }, [currentAssociation]);

  const fetchLocations = async () => {
    if (!currentAssociation) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .order('name');

      if (error) throw error;

      const formattedLocations = data.map((location) => ({
        id: location.id,
        name: location.name,
        description: location.description,
        parentId: location.parent_id,
        associationId: location.association_id,
        isRoom: location.is_room,
        type: location.is_room ? 'room' : 'container', // Map is_room to a type for compatibility
        createdAt: location.created_at,
        updatedAt: location.updated_at,
      }));

      setLocations(formattedLocations);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load locations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createLocation = async (newLocation: {
    name: string;
    description: string;
    parentId: string | null;
    type: 'room' | 'building' | 'container';
  }) => {
    if (!currentAssociation) {
      toast({
        title: 'Error',
        description: 'No association selected.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      // Convert type to is_room flag
      const isRoom = newLocation.type === 'room';

      const { error } = await supabase.from('locations').insert({
        id,
        name: newLocation.name,
        description: newLocation.description,
        parent_id:
          newLocation.parentId === 'none' ? null : newLocation.parentId,
        association_id: currentAssociation.id,
        is_room: isRoom,
        created_at: now,
        updated_at: now,
      });

      if (error) throw error;

      await fetchLocations();
      return true;
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateLocation = async (
    id: string,
    updates: {
      name?: string;
      description?: string;
      parentId?: string | null;
      type?: 'room' | 'building' | 'container';
    },
  ) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.parentId !== undefined)
        updateData.parent_id =
          updates.parentId === 'none' ? null : updates.parentId;
      if (updates.type !== undefined)
        updateData.is_room = updates.type === 'room';

      const { error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchLocations();
      return true;
    } catch (error: any) {
      console.error('Error updating location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase.from('locations').delete().eq('id', id);

      if (error) throw error;

      setLocations((prev) => prev.filter((location) => location.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    locations,
    loading,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  };
}

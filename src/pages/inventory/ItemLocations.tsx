import { useEffect, useState } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Check, Home, MapPin, PlusIcon, Pencil, TrashIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Location {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  parentName?: string;
  is_room: boolean;
  itemsCount: number;
}

const ItemLocations = () => {
  const { currentAssociation } = useAssociation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    parent_id: null as string | null,
    is_room: false
  });
  
  useEffect(() => {
    const fetchLocations = async () => {
      if (!currentAssociation) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*, parent:parent_id(name)')
          .eq('association_id', currentAssociation.id);
        
        if (error) throw error;
        
        // Get item counts for each location
        const locationsWithCounts = await Promise.all(data.map(async (location) => {
          const { count, error: countError } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('location_id', location.id);
            
          if (countError) throw countError;
          
          return {
            id: location.id,
            name: location.name,
            description: location.description,
            parent_id: location.parent_id,
            parentName: location.parent?.name,
            is_room: location.is_room,
            itemsCount: count || 0
          };
        }));
        
        setLocations(locationsWithCounts);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast({
          title: "Error",
          description: "Failed to load locations.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLocations();
  }, [currentAssociation]);

  const handleCreateLocation = async () => {
    if (!currentAssociation || !newLocation.name) return;
    
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: newLocation.name,
          description: newLocation.description || null,
          parent_id: newLocation.parent_id,
          is_room: newLocation.is_room,
          association_id: currentAssociation.id
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      // Find parent name if there's a parent_id
      let parentName;
      if (data.parent_id) {
        const parent = locations.find(loc => loc.id === data.parent_id);
        parentName = parent?.name;
      }
      
      // Add the new location to the list
      setLocations(prev => [...prev, {
        id: data.id,
        name: data.name,
        description: data.description,
        parent_id: data.parent_id,
        parentName,
        is_room: data.is_room,
        itemsCount: 0
      }]);
      
      toast({
        title: "Location Created",
        description: "Successfully created new location.",
      });
      
      setIsDialogOpen(false);
      setNewLocation({ name: '', description: '', parent_id: null, is_room: false });
    } catch (error) {
      console.error("Error creating location:", error);
      toast({
        title: "Error",
        description: "Failed to create location.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateLocation = async () => {
    if (!currentAssociation || !editingLocation) return;
    
    try {
      const { error } = await supabase
        .from('locations')
        .update({
          name: editingLocation.name,
          description: editingLocation.description,
          parent_id: editingLocation.parent_id,
          is_room: editingLocation.is_room
        })
        .eq('id', editingLocation.id);
        
      if (error) throw error;
      
      // Find parent name if there's a parent_id
      let parentName;
      if (editingLocation.parent_id) {
        const parent = locations.find(loc => loc.id === editingLocation.parent_id);
        parentName = parent?.name;
      }
      
      // Update the location in the list
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id 
          ? { ...editingLocation, parentName } 
          : loc
      ));
      
      toast({
        title: "Location Updated",
        description: "Successfully updated location.",
      });
      
      setEditingLocation(null);
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: "Failed to update location.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!currentAssociation) return;
    
    // Check if location has items or is a parent to other locations
    const location = locations.find(loc => loc.id === id);
    if (!location) return;
    
    if (location.itemsCount > 0) {
      toast({
        title: "Cannot Delete",
        description: "This location has items stored in it. Move items first.",
        variant: "destructive"
      });
      return;
    }
    
    const hasChildren = locations.some(loc => loc.parent_id === id);
    if (hasChildren) {
      toast({
        title: "Cannot Delete",
        description: "This location has sublocations. Remove sublocations first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Remove the location from the list
      setLocations(prev => prev.filter(loc => loc.id !== id));
      
      toast({
        title: "Location Deleted",
        description: "Successfully deleted location.",
      });
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: "Failed to delete location.",
        variant: "destructive"
      });
    }
  };

  if (!currentAssociation) {
    return (
      <div>
        <h2>Association Required</h2>
        <p>You need to be part of an association to manage item locations.</p>
        {/* Update link */}
        <Link to="/setup/association">Set Up Association</Link> 
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Locations</h1>
          <p className="text-muted-foreground">Manage locations where your items are stored.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Location</DialogTitle>
              <DialogDescription>
                Add a new storage location for your inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Warehouse, Main Office"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this location..."
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Location (Optional)</Label>
                <Select 
                  value={newLocation.parent_id || 'none'} 
                  onValueChange={(value) => setNewLocation({
                    ...newLocation, 
                    parent_id: value === 'none' ? null : value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_room"
                  checked={newLocation.is_room}
                  onCheckedChange={(checked) => setNewLocation({...newLocation, is_room: checked})}
                />
                <Label htmlFor="is_room">This is a room (useful for convention mapping)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLocation} 
                disabled={!newLocation.name}
              >
                Create Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editingLocation && (
          <Dialog 
            open={!!editingLocation} 
            onOpenChange={(open) => !open && setEditingLocation(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Location</DialogTitle>
                <DialogDescription>
                  Update this location's details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Location Name</Label>
                  <Input
                    id="edit-name"
                    value={editingLocation.name}
                    onChange={(e) => setEditingLocation({
                      ...editingLocation, 
                      name: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingLocation.description || ''}
                    onChange={(e) => setEditingLocation({
                      ...editingLocation, 
                      description: e.target.value || null
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-parent">Parent Location</Label>
                  <Select 
                    value={editingLocation.parent_id || 'none'} 
                    onValueChange={(value) => setEditingLocation({
                      ...editingLocation, 
                      parent_id: value === 'none' ? null : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {locations
                        .filter(loc => loc.id !== editingLocation.id)
                        .map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-is_room"
                    checked={editingLocation.is_room}
                    onCheckedChange={(checked) => setEditingLocation({
                      ...editingLocation, 
                      is_room: checked
                    })}
                  />
                  <Label htmlFor="edit-is_room">This is a room (useful for convention mapping)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingLocation(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateLocation} 
                  disabled={!editingLocation.name}
                >
                  Update Location
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-10">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No Locations Yet</h3>
              <p className="mt-1 text-muted-foreground">
                Get started by creating your first storage location.
              </p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parent Location</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {location.is_room ? (
                          <Home className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        )}
                        {location.name}
                      </div>
                    </TableCell>
                    <TableCell>{location.description || 'N/A'}</TableCell>
                    <TableCell>{location.parentName || 'None'}</TableCell>
                    <TableCell>
                      {location.is_room ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{location.itemsCount}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLocation(location)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => handleDeleteLocation(location.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemLocations;

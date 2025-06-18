'use client';

import React, { useState } from 'react';
import { useLocations, Location } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle,
  Pencil,
  Trash,
  FolderTree,
  MapPin,
  Building,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const buildLocationTree = (
  locations: Location[],
): (Location & { children: Location[] })[] => {
  const locationsMap: Record<string, Location & { children: Location[] }> = {};

  locations.forEach((location) => {
    locationsMap[location.id] = { ...location, children: [] };
  });

  const rootLocations: (Location & { children: Location[] })[] = [];

  locations.forEach((location) => {
    if (location.parentId) {
      if (locationsMap[location.parentId]) {
        locationsMap[location.parentId].children.push(
          locationsMap[location.id],
        );
      } else {
        rootLocations.push(locationsMap[location.id]);
      }
    } else {
      rootLocations.push(locationsMap[location.id]);
    }
  });

  return rootLocations;
};

const LocationManager = () => {
  const { locations, loading, createLocation, updateLocation, deleteLocation } =
    useLocations();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: 'none',
    type: 'room',
  });

  const locationTree = buildLocationTree(locations);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: 'none',
      type: 'room',
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (location: Location) => {
    setCurrentLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      parentId: location.parentId || 'none',
      type: location.type || 'room',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (location: Location) => {
    setCurrentLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateLocation = async () => {
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Location name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createLocation({
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId === 'none' ? null : formData.parentId,
        type: formData.type as 'room' | 'building' | 'container',
      });

      setIsAddDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Location created successfully',
      });
    } catch (error) {
      console.error('Error creating location:', error);
      toast({
        title: 'Error',
        description: 'Failed to create location',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLocation = async () => {
    if (!currentLocation || !formData.name) {
      toast({
        title: 'Error',
        description: 'Location name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateLocation(currentLocation.id, {
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId === 'none' ? null : formData.parentId,
        type: formData.type as 'room' | 'building' | 'container',
      });

      setIsEditDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Location updated successfully',
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: 'Error',
        description: 'Failed to update location',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLocation = async () => {
    if (!currentLocation) return;

    try {
      const success = await deleteLocation(currentLocation.id);

      if (success) {
        setIsDeleteDialogOpen(false);

        toast({
          title: 'Success',
          description: 'Location deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete location',
        variant: 'destructive',
      });
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'building':
        return <Building className="h-4 w-4 mr-2" />;
      case 'container':
        return <FolderTree className="h-4 w-4 mr-2" />;
      case 'room':
      default:
        return <MapPin className="h-4 w-4 mr-2" />;
    }
  };

  const renderLocationTreeItem = (
    location: Location & { children: Location[] },
    depth = 0,
  ) => {
    return (
      <React.Fragment key={location.id}>
        <TableRow>
          <TableCell className="font-medium">
            <div
              style={{ paddingLeft: `${depth * 1.5}rem` }}
              className="flex items-center"
            >
              {getLocationIcon(location.type)}
              {location.name}
            </div>
          </TableCell>
          <TableCell>{location.type}</TableCell>
          <TableCell>{location.description || '-'}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(location)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(location)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {location.children &&
          location.children.map((child) =>
            renderLocationTreeItem(
              child as Location & { children: Location[] },
              depth + 1,
            ),
          )}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Storage Locations</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
            >
              {viewMode === 'list' ? (
                <>
                  <FolderTree className="h-4 w-4 mr-2" />
                  Tree View
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  List View
                </>
              )}
            </Button>
            <Button size="sm" onClick={openAddDialog}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No Locations Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Storage locations help you track where your inventory items are
                stored.
              </p>
              <Button className="mt-4" onClick={openAddDialog}>
                Create Your First Location
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewMode === 'list'
                    ? locations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {getLocationIcon(location.type)}
                              {location.name}
                              {location.parentId && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (Sub-location)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{location.type}</TableCell>
                          <TableCell>{location.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(location)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(location)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : locationTree.map((location) =>
                        renderLocationTreeItem(location),
                      )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>
              Create a new storage location for your inventory items.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter location name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Location Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="container">Container/Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter location description"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Location (Optional)</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLocation}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update location details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Location Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-type">Location Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                  <SelectItem value="container">Container/Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-parent">Parent Location</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {locations
                    .filter((location) => location.id !== currentLocation?.id)
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateLocation}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this location? Any items stored at
              this location must be moved first.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {currentLocation && (
            <div className="py-4">
              <p className="font-medium">{currentLocation.name}</p>
              {currentLocation.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentLocation.description}
                </p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLocation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LocationManager;

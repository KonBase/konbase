import React, { useState, useEffect } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Trash, 
  Edit, 
  Copy, 
  Package, 
  Loader2,
  BoxIcon
} from 'lucide-react';

// Types for our equipment sets
interface EquipmentSetItem {
  id: string;
  equipment_set_id: string;
  item_id: string;
  quantity: number;
  notes?: string;
  item_name?: string;
  item_category?: string;
}

interface EquipmentSet {
  id: string;
  name: string;
  description?: string;
  association_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  items_count?: number;
  tags?: string[];
  is_template?: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  category_id?: string;
  category_name?: string;
}

const EquipmentSetManager: React.FC = () => {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  
  const [equipmentSets, setEquipmentSets] = useState<EquipmentSet[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [setItems, setSetItems] = useState<EquipmentSetItem[]>([]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_template: false
  });
  
  // New item form state
  const [newItemForm, setNewItemForm] = useState({
    item_id: '',
    quantity: 1,
    notes: ''
  });
  
  // Fetch equipment sets and inventory items
  useEffect(() => {
    if (currentAssociation) {
      fetchEquipmentSets();
      fetchInventoryItems();
    }
  }, [currentAssociation]);
  
  const fetchEquipmentSets = async () => {
    if (!currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipment_sets')
        .select('*, equipment_set_items(count)')
        .eq('association_id', currentAssociation.id);
      
      if (error) throw error;
      
      // Format the data to include items count
      const formattedSets = data.map(set => ({
        ...set,
        items_count: set.equipment_set_items[0]?.count || 0
      }));
      
      setEquipmentSets(formattedSets);
    } catch (error: any) {
      console.error('Error fetching equipment sets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load equipment sets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchInventoryItems = async () => {
    if (!currentAssociation) return;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          id, 
          name,
          category_id, 
          categories(name)
        `)
        .eq('association_id', currentAssociation.id);
      
      if (error) throw error;
      
      const formattedItems = data.map(item => ({
        id: item.id,
        name: item.name,
        category_id: item.category_id,
        category_name: item.categories?.name
      }));
      
      setInventoryItems(formattedItems);
    } catch (error: any) {
      console.error('Error fetching inventory items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory items',
        variant: 'destructive',
      });
    }
  };
  
  const fetchSetItems = async (setId: string) => {
    try {
      const { data, error } = await supabase
        .from('equipment_set_items')
        .select(`
          *,
          items(name, categories(name))
        `)
        .eq('equipment_set_id', setId);
      
      if (error) throw error;
      
      const formattedItems = data.map(item => ({
        id: item.id,
        equipment_set_id: item.equipment_set_id,
        item_id: item.item_id,
        quantity: item.quantity,
        notes: item.notes,
        item_name: item.items?.name,
        item_category: item.items?.categories?.name
      }));
      
      setSetItems(formattedItems);
    } catch (error: any) {
      console.error('Error fetching set items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load set items',
        variant: 'destructive',
      });
    }
  };
  
  const handleCreateSet = async () => {
    if (!currentAssociation) return;
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Set name is required',
        variant: 'destructive',
      });
      return;
    }
    
    setIsCreating(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('equipment_sets')
        .insert({
          name: formData.name,
          description: formData.description,
          association_id: currentAssociation.id,
          created_at: now,
          updated_at: now,
          is_template: formData.is_template
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Equipment set created successfully',
      });
      
      // Add the new set to our state
      setEquipmentSets([
        ...equipmentSets, 
        { ...data, items_count: 0 }
      ]);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        is_template: false
      });
      
      // Close dialog
      setIsEditDialogOpen(false);
      
    } catch (error: any) {
      console.error('Error creating equipment set:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create equipment set',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleAddItemToSet = async () => {
    if (!currentSetId || !newItemForm.item_id) return;
    
    try {
      const { data, error } = await supabase
        .from('equipment_set_items')
        .insert({
          equipment_set_id: currentSetId,
          item_id: newItemForm.item_id,
          quantity: newItemForm.quantity,
          notes: newItemForm.notes || null
        })
        .select(`
          *,
          items(name, categories(name))
        `)
        .single();
      
      if (error) throw error;
      
      // Add new item to the list
      const newItem: EquipmentSetItem = {
        id: data.id,
        equipment_set_id: data.equipment_set_id,
        item_id: data.item_id,
        quantity: data.quantity,
        notes: data.notes,
        item_name: data.items?.name,
        item_category: data.items?.categories?.name
      };
      
      setSetItems([...setItems, newItem]);
      
      // Update the set count in the list
      setEquipmentSets(equipmentSets.map(set => 
        set.id === currentSetId 
          ? { ...set, items_count: (set.items_count || 0) + 1 }
          : set
      ));
      
      // Reset form
      setNewItemForm({
        item_id: '',
        quantity: 1,
        notes: ''
      });
      
      toast({
        title: 'Success',
        description: 'Item added to equipment set',
      });
    } catch (error: any) {
      console.error('Error adding item to set:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item to set',
        variant: 'destructive',
      });
    }
  };
  
  const handleRemoveItemFromSet = async (itemId: string) => {
    if (!currentSetId) return;
    
    try {
      const { error } = await supabase
        .from('equipment_set_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Remove item from the list
      setSetItems(setItems.filter(item => item.id !== itemId));
      
      // Update the set count in the list
      setEquipmentSets(equipmentSets.map(set => 
        set.id === currentSetId 
          ? { ...set, items_count: Math.max(0, (set.items_count || 0) - 1) }
          : set
      ));
      
      toast({
        title: 'Success',
        description: 'Item removed from equipment set',
      });
    } catch (error: any) {
      console.error('Error removing item from set:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item from set',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteSet = async (setId: string) => {
    try {
      // First delete all items in the set
      const { error: itemsError } = await supabase
        .from('equipment_set_items')
        .delete()
        .eq('equipment_set_id', setId);
      
      if (itemsError) throw itemsError;
      
      // Then delete the set itself
      const { error } = await supabase
        .from('equipment_sets')
        .delete()
        .eq('id', setId);
      
      if (error) throw error;
      
      // Update local state
      setEquipmentSets(equipmentSets.filter(set => set.id !== setId));
      
      toast({
        title: 'Success',
        description: 'Equipment set deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting equipment set:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete equipment set',
        variant: 'destructive',
      });
    }
  };
  
  const handleEditSet = (set: EquipmentSet) => {
    setCurrentSetId(set.id);
    fetchSetItems(set.id);
    setFormData({
      name: set.name,
      description: set.description || '',
      is_template: set.is_template || false
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateSet = async () => {
    if (!currentSetId || !formData.name.trim()) return;
    
    try {
      const { error } = await supabase
        .from('equipment_sets')
        .update({
          name: formData.name,
          description: formData.description,
          is_template: formData.is_template,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSetId);
      
      if (error) throw error;
      
      // Update local state
      setEquipmentSets(equipmentSets.map(set => 
        set.id === currentSetId
          ? { 
              ...set, 
              name: formData.name,
              description: formData.description,
              is_template: formData.is_template 
            }
          : set
      ));
      
      toast({
        title: 'Success',
        description: 'Equipment set updated successfully',
      });
      
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating equipment set:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update equipment set',
        variant: 'destructive',
      });
    }
  };
  
  const handleDuplicateSet = async (set: EquipmentSet) => {
    if (!currentAssociation) return;
    
    try {
      // 1. Create the new set
      const now = new Date().toISOString();
      const { data: newSet, error: setError } = await supabase
        .from('equipment_sets')
        .insert({
          name: `${set.name} (Copy)`,
          description: set.description,
          association_id: currentAssociation.id,
          created_at: now,
          updated_at: now,
          is_template: set.is_template
        })
        .select()
        .single();
      
      if (setError) throw setError;
      
      // 2. Fetch all items in the original set
      const { data: setItems, error: itemsError } = await supabase
        .from('equipment_set_items')
        .select('*')
        .eq('equipment_set_id', set.id);
      
      if (itemsError) throw itemsError;
      
      // 3. Create new items for the duplicate set
      if (setItems && setItems.length > 0) {
        const newItems = setItems.map(item => ({
          equipment_set_id: newSet.id,
          item_id: item.item_id,
          quantity: item.quantity,
          notes: item.notes
        }));
        
        const { error: insertError } = await supabase
          .from('equipment_set_items')
          .insert(newItems);
        
        if (insertError) throw insertError;
      }
      
      // 4. Update local state
      setEquipmentSets([
        ...equipmentSets, 
        { ...newSet, items_count: set.items_count || 0 }
      ]);
      
      toast({
        title: 'Success',
        description: 'Equipment set duplicated successfully',
      });
    } catch (error: any) {
      console.error('Error duplicating equipment set:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to duplicate equipment set',
        variant: 'destructive',
      });
    }
  };
  
  const openCreateDialog = () => {
    setCurrentSetId(null);
    setFormData({
      name: '',
      description: '',
      is_template: false
    });
    setSetItems([]);
    setIsEditDialogOpen(true);
  };
  
  // Sorted inventory items by category
  const sortedInventoryItems = [...inventoryItems].sort((a, b) => {
    if (!a.category_name && b.category_name) return 1;
    if (a.category_name && !b.category_name) return -1;
    if (!a.category_name && !b.category_name) return a.name.localeCompare(b.name);
    return a.category_name!.localeCompare(b.category_name!) || a.name.localeCompare(b.name);
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Equipment Sets</CardTitle>
          <Button onClick={openCreateDialog}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Set
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : equipmentSets.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <BoxIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No Equipment Sets</h3>
                <p className="text-muted-foreground">
                  Create your first equipment set to group items together
                </p>
              </div>
              <Button onClick={openCreateDialog}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Set
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipmentSets.map(set => (
                    <TableRow key={set.id}>
                      <TableCell className="font-medium">{set.name}</TableCell>
                      <TableCell>{set.items_count} items</TableCell>
                      <TableCell>
                        {set.is_template ? (
                          <Badge variant="outline">Template</Badge>
                        ) : (
                          <Badge variant="secondary">Standard</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditSet(set)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDuplicateSet(set)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Equipment Set</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this equipment set?
                                  This action cannot be undone and will remove all items in this set.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSet(set.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentSetId ? 'Edit Equipment Set' : 'Create Equipment Set'}
            </DialogTitle>
            <DialogDescription>
              {currentSetId 
                ? 'Update the equipment set details and manage items'
                : 'Create a new equipment set to group items together'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Set Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter set name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this equipment set"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_template"
                checked={formData.is_template}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_template: checked as boolean })
                }
              />
              <Label htmlFor="is_template">
                Mark as template (reusable for conventions)
              </Label>
            </div>
          </div>
          
          {currentSetId && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Items in this Set</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="col-span-3 md:col-span-1">
                    <Label htmlFor="item">Item</Label>
                    <Select
                      value={newItemForm.item_id}
                      onValueChange={(value) => 
                        setNewItemForm({ ...newItemForm, item_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedInventoryItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} {item.category_name && `(${item.category_name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={newItemForm.quantity}
                      onChange={(e) => 
                        setNewItemForm({ 
                          ...newItemForm, 
                          quantity: parseInt(e.target.value) || 1 
                        })
                      }
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={newItemForm.notes}
                      onChange={(e) => 
                        setNewItemForm({ ...newItemForm, notes: e.target.value })
                      }
                      placeholder="Optional notes"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAddItemToSet}
                    disabled={!newItemForm.item_id}
                    className="col-span-3"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                {setItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {setItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>{item.item_category || 'None'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {item.notes || 'None'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItemFromSet(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 border rounded-md">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No items in this set yet</p>
                  </div>
                )}
              </div>
            </>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            {currentSetId ? (
              <Button onClick={handleUpdateSet} disabled={isCreating}>
                Update Set
              </Button>
            ) : (
              <Button onClick={handleCreateSet} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                    Creating...
                  </>
                ) : (
                  <>Create Set</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentSetManager;

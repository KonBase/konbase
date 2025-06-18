'use client';

import React, { useState } from 'react';
import {
  InventoryItem,
  NewInventoryItem,
  InventoryFilters,
  InventorySort,
} from '@/hooks/useInventoryItems';
import { Category } from '@/hooks/useCategories'; // Assuming Category type exists
import { Location } from '@/hooks/useLocations'; // Assuming Location type exists
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Package2, Pencil, Search, Trash, ArrowUpDown, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAssociation } from '@/contexts/AssociationContext';

// Define the props for the component
interface InventoryItemsComponentProps {
  items: InventoryItem[];
  loading: boolean;
  createItem: (item: NewInventoryItem) => Promise<boolean | null>;
  updateItem: (
    id: string,
    updates: Partial<NewInventoryItem>,
  ) => Promise<boolean | null>;
  deleteItem: (id: string) => Promise<boolean | null>;
  categories: Category[];
  locations: Location[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: InventoryFilters;
  setFilters: (filters: InventoryFilters) => void;
  sort: InventorySort;
  setSort: (sort: InventorySort) => void;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (isOpen: boolean) => void;
  refreshItems: () => void; // Added refreshItems prop
}

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  barcode: z.string().optional(),
  condition: z.string().min(1, { message: 'Condition is required' }),
  categoryId: z.string().min(1, { message: 'Category is required' }),
  locationId: z.string().min(1, { message: 'Location is required' }),
  isConsumable: z.boolean().default(false),
  quantity: z.number().positive().optional().nullable(),
  minimumQuantity: z.number().positive().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(), // Renamed from unitPrice
  warrantyExpiration: z.string().optional().nullable(),
  notes: z.string().optional(),
  image: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const InventoryItemsComponent: React.FC<InventoryItemsComponentProps> = ({
  // Use React.FC and destructure props
  items,
  loading,
  createItem,
  updateItem,
  deleteItem,
  categories,
  locations,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  sort,
  setSort,
  isAddDialogOpen,
  setIsAddDialogOpen,
}) => {
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();

  // Remove internal state for items, loading, categories, locations as they are props now
  // const [items, setItems] = useState<InventoryItem[]>([]);
  // const [loading, setLoading] = useState(true);
  // const { categories } = useCategories();
  // const { locations } = useLocations();
  // const [searchTerm, setSearchTerm] = useState('');

  // Dialog states managed by parent
  // const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      serialNumber: '',
      barcode: '',
      condition: 'good', // Default condition
      categoryId: '',
      locationId: '',
      isConsumable: false,
      quantity: null,
      minimumQuantity: null,
      purchaseDate: null,
      purchasePrice: null, // Renamed
      warrantyExpiration: null,
      notes: '',
      image: null,
    },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    // Default values will be set when opening the edit dialog
  });

  const openAddDialog = () => {
    form.reset({
      name: '',
      description: '',
      serialNumber: '',
      barcode: '',
      condition: 'good',
      categoryId: categories.length > 0 ? categories[0].id : '', // Pre-select if possible
      locationId: locations.length > 0 ? locations[0].id : '', // Pre-select if possible
      isConsumable: false,
      quantity: 1, // Default quantity for non-consumable
      minimumQuantity: null,
      purchaseDate: null,
      purchasePrice: null,
      warrantyExpiration: null,
      notes: '',
      image: null,
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setCurrentItem(item);
    editForm.reset({
      name: item.name,
      description: item.description || '',
      serialNumber: item.serialNumber || '',
      barcode: item.barcode || '',
      condition: item.condition || 'good',
      categoryId: item.categoryId || '',
      locationId: item.locationId || '',
      isConsumable: item.isConsumable,
      quantity: item.quantity,
      minimumQuantity: item.minimumQuantity,
      purchaseDate: item.purchaseDate,
      purchasePrice: item.purchasePrice, // Renamed
      warrantyExpiration: item.warrantyExpiration,
      notes: (item as any).notes || '', // Assuming notes might exist but not in type yet
      image: item.image,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: InventoryItem) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateItem = async (values: FormValues) => {
    try {
      if (!currentAssociation) {
        toast({
          title: 'Error',
          description: 'No association selected',
          variant: 'destructive',
        });
        return;
      }

      const newItem: NewInventoryItem = {
        name: values.name,
        description: values.description || null,
        serialNumber: values.serialNumber || null,
        barcode: values.barcode || null,
        condition: values.condition,
        categoryId: values.categoryId,
        locationId: values.locationId,
        isConsumable: values.isConsumable,
        quantity: values.isConsumable ? (values.quantity ?? 1) : 1, // Ensure quantity is set
        minimumQuantity: values.isConsumable ? values.minimumQuantity : null,
        purchasePrice: values.purchasePrice, // Renamed
        purchaseDate: values.purchaseDate || null,
        warrantyExpiration: values.warrantyExpiration || null,
        image: values.image || null,
        associationId: currentAssociation.id,
        notes: values.notes || null, // Add notes
      };

      const success = await createItem(newItem);
      if (success) {
        setIsAddDialogOpen(false);
        toast({ title: 'Success', description: 'Item created successfully' });
        // refreshItems(); // Refresh is handled by the hook after successful creation
      } else {
        // Error toast is handled within the hook
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to create item',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateItem = async (values: FormValues) => {
    if (!currentItem) return;

    try {
      const updates: Partial<NewInventoryItem> = {
        name: values.name,
        description: values.description || null,
        serialNumber: values.serialNumber || null,
        barcode: values.barcode || null,
        condition: values.condition,
        categoryId: values.categoryId,
        locationId: values.locationId,
        isConsumable: values.isConsumable,
        quantity: values.isConsumable ? (values.quantity ?? 1) : 1, // Ensure quantity is set
        minimumQuantity: values.isConsumable ? values.minimumQuantity : null,
        purchasePrice: values.purchasePrice, // Renamed
        purchaseDate: values.purchaseDate || null,
        warrantyExpiration: values.warrantyExpiration || null,
        image: values.image || null,
        notes: values.notes || null, // Add notes
      };

      const success = await updateItem(currentItem.id, updates);
      if (success) {
        setIsEditDialogOpen(false);
        toast({ title: 'Success', description: 'Item updated successfully' });
        // refreshItems(); // Refresh is handled by the hook after successful update
      } else {
        // Error toast is handled within the hook
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!currentItem) return;

    try {
      const success = await deleteItem(currentItem.id);
      if (success) {
        setIsDeleteDialogOpen(false);
        toast({ title: 'Success', description: 'Item deleted successfully' });
        // refreshItems(); // Refresh is handled by the hook after successful deletion
      } else {
        // Error toast is handled within the hook
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const handleSort = (
    field: keyof InventoryItem | 'categoryName' | 'locationName',
  ) => {
    setSort({
      field,
      direction:
        sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // No need for filteredItems state, items prop already contains filtered/sorted data from the hook
  // const filteredItems = items.filter(...);

  if (loading) {
    // Loading state can be handled by the parent or shown here
    // return <div>Loading...</div>;
  }

  // Check if categories or locations are missing (handled by parent now)
  // if (categories.length === 0 || locations.length === 0) { ... }

  const renderSortIcon = (
    field: keyof InventoryItem | 'categoryName' | 'locationName',
  ) => {
    if (sort.field === field) {
      return (
        <ArrowUpDown
          className={`ml-2 h-4 w-4 inline-block ${sort.direction === 'desc' ? 'rotate-180' : ''}`}
        />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 inline-block opacity-30" />;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter moved to parent, but could be here if needed */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0.5 top-0.5 h-8 w-8 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <Select
            value={filters.categoryId || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                categoryId: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.locationId || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                locationId: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.condition || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                condition: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {/* Add condition options dynamically or hardcode */}
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  Name {renderSortIcon('name')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('categoryName')}
                >
                  Category {renderSortIcon('categoryName')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('locationName')}
                >
                  Location {renderSortIcon('locationName')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('condition')}
                >
                  Condition {renderSortIcon('condition')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('quantity')}
                >
                  Quantity {renderSortIcon('quantity')}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No items found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || Object.values(filters).some((v) => v)
                        ? 'No items match your criteria.'
                        : 'Start by adding your first inventory item.'}
                    </p>
                    {!searchTerm && !Object.values(filters).some((v) => v) && (
                      <Button
                        size="sm"
                        className="mt-4"
                        onClick={openAddDialog}
                        disabled={
                          categories.length === 0 || locations.length === 0
                        }
                      >
                        Add Item
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.categoryName || 'N/A'}</TableCell>
                    <TableCell>{item.locationName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.condition === 'new'
                            ? 'default'
                            : item.condition === 'good'
                              ? 'secondary'
                              : item.condition === 'fair'
                                ? 'outline'
                                : item.condition === 'poor' ||
                                    item.condition === 'damaged' ||
                                    item.condition === 'retired'
                                  ? 'destructive'
                                  : 'outline'
                        }
                      >
                        {item.condition || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.isConsumable ? (item.quantity ?? 'N/A') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.isConsumable ? 'Consumable' : 'Asset'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Add a new item to your inventory. Fields marked with * are
              required.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreateItem)}
              className="space-y-6"
            >
              <ScrollArea className="h-[60vh] max-h-[600px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Form Fields (Similar structure for Add and Edit) */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isConsumable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // Reset quantity fields if switching back to non-consumable
                              if (!checked) {
                                form.setValue('quantity', null);
                                form.setValue('minimumQuantity', null);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Consumable Item</FormLabel>
                          <FormDescription>
                            Check if this item is tracked by quantity (e.g.,
                            screws, paper).
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch('isConsumable') && (
                    <>
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                value={field.value ?? ''} // Handle null
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? null
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="minimumQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                value={field.value ?? ''} // Handle null
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? null
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Low stock alert threshold.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchasePrice" // Ensure name is correct
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            value={field.value ?? ''} // Handle null for display
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? null
                                  : parseFloat(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warrantyExpiration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Expiration</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description and Notes spanning full width */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Item'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update item details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleUpdateItem)}
              className="space-y-6"
            >
              <ScrollArea className="h-[60vh] max-h-[600px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Form Fields (Re-use structure from Add Dialog) */}
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="isConsumable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) {
                                editForm.setValue('quantity', null);
                                editForm.setValue('minimumQuantity', null);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Consumable Item</FormLabel>
                          <FormDescription>
                            Check if this item is tracked by quantity.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {editForm.watch('isConsumable') && (
                    <>
                      <FormField
                        control={editForm.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? null
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="minimumQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ''
                                      ? null
                                      : Number(e.target.value),
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Low stock alert threshold.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={editForm.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="purchasePrice" // Ensure name is correct
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            value={field.value ?? ''} // Handle null for display
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? null
                                  : parseFloat(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="warrantyExpiration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Expiration</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ''}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                >
                  {editForm.formState.isSubmitting
                    ? 'Saving...'
                    : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {currentItem && (
            <div className="py-4">
              <p className="font-medium">{currentItem.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentItem.categoryName} • {currentItem.locationName}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryItemsComponent;

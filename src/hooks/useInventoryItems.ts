import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  barcode: string | null;
  condition: string | null;
  categoryId: string | null;
  locationId: string | null;
  isConsumable: boolean;
  quantity: number;
  minimumQuantity: number | null;
  purchasePrice: number | null; // Renamed from unitPrice
  purchaseDate: string | null;
  warrantyExpiration: string | null;
  image: string | null;
  notes: string | null; // Added notes field
  associationId: string;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  locationName?: string;
}

export type NewInventoryItem = Omit<
  InventoryItem,
  'id' | 'createdAt' | 'updatedAt' | 'categoryName' | 'locationName'
>;

// Add filter and sort types
export interface InventoryFilters {
  categoryId?: string | 'all';
  locationId?: string | 'all';
  condition?: string | 'all';
  isConsumable?: boolean | 'all'; // Added isConsumable filter
}

export interface InventorySort {
  field: keyof InventoryItem | 'categoryName' | 'locationName';
  direction: 'asc' | 'desc';
}

export function useInventoryItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [sort, setSort] = useState<InventorySort>({
    field: 'name',
    direction: 'asc',
  });

  const fetchItems = useCallback(async () => {
    if (!currentAssociation) return;

    setLoading(true);
    try {
      let query = supabase
        .from('items')
        .select(
          `
          *,
          categories(name),
          locations(name)
        `,
        )
        .eq('association_id', currentAssociation.id);

      // Apply filters
      if (filters.categoryId && filters.categoryId !== 'all') {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.locationId && filters.locationId !== 'all') {
        query = query.eq('location_id', filters.locationId);
      }
      if (filters.condition && filters.condition !== 'all') {
        query = query.eq('condition', filters.condition);
      }
      if (filters.isConsumable !== undefined && filters.isConsumable !== 'all') { // Added isConsumable filter logic
        query = query.eq('is_consumable', filters.isConsumable);
      }

      // Apply sorting - Handle joined fields sorting client-side for simplicity
      const sortField = sort.field;
      if (sortField !== 'categoryName' && sortField !== 'locationName') {
        query = query.order(sortField as string, {
          ascending: sort.direction === 'asc',
        });
      }

      const { data, error } = await query;

      if (error) throw error;

      let formattedItems = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        serialNumber: item.serial_number,
        barcode: item.barcode,
        condition: item.condition || 'unknown',
        categoryId: item.category_id,
        locationId: item.location_id,
        isConsumable: item.is_consumable,
        quantity: item.quantity,
        minimumQuantity: item.minimum_quantity,
        purchasePrice: item.purchase_price, // Use purchase_price
        purchaseDate: item.purchase_date,
        warrantyExpiration: item.warranty_expiration,
        image: item.image,
        notes: item.notes, // Added notes to the formatted item
        associationId: item.association_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        categoryName: item.categories?.name || 'N/A',
        locationName: item.locations?.name || 'N/A',
      }));

      // Apply search filter client-side
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        formattedItems = formattedItems.filter(
          (item) =>
            item.name.toLowerCase().includes(lowerSearchTerm) ||
            item.description?.toLowerCase().includes(lowerSearchTerm) ||
            item.serialNumber?.toLowerCase().includes(lowerSearchTerm) ||
            item.barcode?.toLowerCase().includes(lowerSearchTerm) ||
            item.categoryName?.toLowerCase().includes(lowerSearchTerm) ||
            item.locationName?.toLowerCase().includes(lowerSearchTerm),
        );
      }

      // Apply client-side sorting for joined fields if necessary
      if (sortField === 'categoryName' || sortField === 'locationName') {
        formattedItems.sort((a, b) => {
          const valA = a[sortField]?.toLowerCase() || '';
          const valB = b[sortField]?.toLowerCase() || '';
          if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }

      setItems(formattedItems);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory items.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentAssociation, filters, sort, searchTerm, toast]); // Add dependencies

  useEffect(() => {
    if (currentAssociation) {
      fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [currentAssociation, fetchItems]); // Use fetchItems callback

  const createItem = async (newItem: NewInventoryItem) => {
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

      const { error } = await supabase.from('items').insert({
        id,
        name: newItem.name,
        description: newItem.description,
        serial_number: newItem.serialNumber,
        barcode: newItem.barcode,
        condition: newItem.condition,
        category_id: newItem.categoryId,
        location_id: newItem.locationId,
        is_consumable: newItem.isConsumable,
        quantity: newItem.quantity,
        minimum_quantity: newItem.minimumQuantity,
        purchase_price: newItem.purchasePrice,
        purchase_date: newItem.purchaseDate,
        warranty_expiration: newItem.warrantyExpiration,
        image: newItem.image,
        notes: newItem.notes, // Added notes to insert
        association_id: currentAssociation.id,
        created_at: now,
        updated_at: now,
      });

      if (error) throw error;

      // Fetch the newly created item with joined category and location names
      await fetchItems();

      return true;
    } catch (error: any) {
      console.error('Error creating item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateItem = async (id: string, updates: Partial<NewInventoryItem>) => {
    try {
      const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Map the camelCase properties to snake_case for the database
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.serialNumber !== undefined)
        dbUpdates.serial_number = updates.serialNumber;
      if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
      if (updates.condition !== undefined)
        dbUpdates.condition = updates.condition;
      if (updates.categoryId !== undefined)
        dbUpdates.category_id = updates.categoryId;
      if (updates.locationId !== undefined)
        dbUpdates.location_id = updates.locationId;
      if (updates.isConsumable !== undefined)
        dbUpdates.is_consumable = updates.isConsumable;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.minimumQuantity !== undefined)
        dbUpdates.minimum_quantity = updates.minimumQuantity;
      if (updates.purchasePrice !== undefined)
        dbUpdates.purchase_price = updates.purchasePrice;
      if (updates.purchaseDate !== undefined)
        dbUpdates.purchase_date = updates.purchaseDate;
      if (updates.warrantyExpiration !== undefined)
        dbUpdates.warranty_expiration = updates.warrantyExpiration;
      if (updates.image !== undefined) dbUpdates.image = updates.image;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes; // Added notes to update

      const { error } = await supabase
        .from('items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Refresh the items list
      await fetchItems();

      return true;
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('items').delete().eq('id', id);

      if (error) throw error;

      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    items,
    loading,
    refreshItems: fetchItems,
    createItem,
    updateItem,
    deleteItem,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sort,
    setSort,
  };
}

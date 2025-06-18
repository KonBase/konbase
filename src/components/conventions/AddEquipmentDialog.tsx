'use client';

import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AddEquipmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conventionId: string;
  onEquipmentAdded: () => void;
}

interface Item {
  id: string;
  name: string;
  barcode: string | null;
  category_id: string;
}

interface Location {
  id: string;
  name: string;
}

const equipmentSchema = z.object({
  item_id: z.string().min(1, { message: 'Please select an item' }),
  quantity: z.coerce
    .number()
    .int()
    .positive({ message: 'Quantity must be positive' }),
  convention_location_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const AddEquipmentDialog: React.FC<AddEquipmentDialogProps> = ({
  isOpen,
  onClose,
  conventionId,
  onEquipmentAdded,
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      item_id: '',
      quantity: 1,
      convention_location_id: null,
      notes: '',
    },
  });

  // Fetch equipment items (non-consumables)
  useEffect(() => {
    const fetchEquipmentItems = async () => {
      if (!isOpen) return;

      try {
        const { data, error } = await supabase
          .from('items')
          .select('id, name, barcode, category_id')
          .eq('is_consumable', false)
          .order('name');

        if (error) throw error;
        setItems(data || []);
      } catch (error: any) {
        console.error('Error loading equipment items:', error);
        toast({
          title: 'Error loading items',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    };

    fetchEquipmentItems();
  }, [isOpen]);

  // Fetch convention locations
  useEffect(() => {
    const fetchLocations = async () => {
      if (!isOpen || !conventionId) return;

      try {
        const { data, error } = await supabase
          .from('convention_locations')
          .select('id, name')
          .eq('convention_id', conventionId)
          .order('name');

        if (error) throw error;
        setLocations(data || []);

        // Set default location to "Storage" if it exists
        const storageLocation = data?.find(
          (location) => location.name.toLowerCase() === 'storage',
        );
        if (storageLocation) {
          form.setValue('convention_location_id', storageLocation.id);
        }
      } catch (error: any) {
        console.error('Error loading locations:', error);
        toast({
          title: 'Error loading locations',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    };

    fetchLocations();
  }, [isOpen, conventionId]);

  const onSubmit = async (values: z.infer<typeof equipmentSchema>) => {
    if (!conventionId) {
      toast({
        title: 'Error',
        description: 'Convention ID is missing',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get the current user's ID
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Prepare data, converting "__NONE__" back to null for convention_location_id
      const dataToSend = {
        ...values,
        convention_location_id:
          values.convention_location_id === '__NONE__'
            ? null
            : values.convention_location_id,
      };

      // Check if this item is already allocated to the convention
      const { data: existingData, error: checkError } = await supabase
        .from('convention_equipment')
        .select('id')
        .eq('convention_id', conventionId)
        .eq('item_id', dataToSend.item_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingData) {
        // Update existing allocation
        const { error } = await supabase
          .from('convention_equipment')
          .update({
            quantity: dataToSend.quantity,
            convention_location_id: dataToSend.convention_location_id,
            notes: dataToSend.notes,
          })
          .eq('id', existingData.id);

        if (error) throw error;

        toast({
          title: 'Equipment updated',
          description: 'The equipment allocation has been updated',
        });
      } else {
        // Create new allocation
        const { error } = await supabase.from('convention_equipment').insert({
          convention_id: conventionId,
          item_id: dataToSend.item_id,
          quantity: dataToSend.quantity,
          convention_location_id: dataToSend.convention_location_id,
          status: 'stored',
          notes: dataToSend.notes,
        });

        if (error) throw error;

        toast({
          title: 'Equipment added',
          description: 'The equipment has been allocated to the convention',
        });
      }

      form.reset();
      onEquipmentAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding equipment:', error);
      toast({
        title: 'Error adding equipment',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
          <DialogDescription>
            Allocate equipment to your convention.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Item*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} {item.barcode ? `(${item.barcode})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select equipment from your inventory
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity*</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    How many of this item to allocate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or notes"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Equipment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

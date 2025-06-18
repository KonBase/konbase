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
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AddConsumableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conventionId: string;
  onConsumableAdded: () => void;
}

interface Item {
  id: string;
  name: string;
  barcode: string | null;
}

interface Location {
  id: string;
  name: string;
}

const consumableSchema = z.object({
  item_id: z.string().min(1, { message: 'Please select an item' }),
  allocated_quantity: z.coerce
    .number()
    .int()
    .positive({ message: 'Quantity must be positive' }),
  used_quantity: z.coerce
    .number()
    .int()
    .min(0, { message: 'Used quantity cannot be negative' }),
  location_id: z.string().nullable().optional(),
});

export const AddConsumableDialog: React.FC<AddConsumableDialogProps> = ({
  isOpen,
  onClose,
  conventionId,
  onConsumableAdded,
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof consumableSchema>>({
    resolver: zodResolver(consumableSchema),
    defaultValues: {
      item_id: '',
      allocated_quantity: 1,
      used_quantity: 0,
      location_id: null,
    },
  });

  // Fetch consumable items (those with is_consumable flag set to true)
  useEffect(() => {
    const fetchConsumableItems = async () => {
      if (!isOpen) return;

      try {
        const { data, error } = await supabase
          .from('items')
          .select('id, name, barcode')
          .eq('is_consumable', true)
          .order('name');

        if (error) throw error;
        setItems(data || []);
      } catch (error: any) {
        console.error('Error loading consumable items:', error);
        toast({
          title: 'Error loading items',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    };

    fetchConsumableItems();
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

  const onSubmit = async (values: z.infer<typeof consumableSchema>) => {
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
      // Check if this item is already allocated to the convention
      const { data: existingData, error: checkError } = await supabase
        .from('convention_consumables')
        .select('id')
        .eq('convention_id', conventionId)
        .eq('item_id', values.item_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingData) {
        // Update existing allocation
        const { error } = await supabase
          .from('convention_consumables')
          .update({
            allocated_quantity: values.allocated_quantity,
            used_quantity: values.used_quantity,
            location_id: values.location_id,
          })
          .eq('id', existingData.id);

        if (error) throw error;

        toast({
          title: 'Consumable updated',
          description: 'The consumable allocation has been updated',
        });
      } else {
        // Create new allocation
        const { error } = await supabase.from('convention_consumables').insert({
          convention_id: conventionId,
          item_id: values.item_id,
          allocated_quantity: values.allocated_quantity,
          used_quantity: values.used_quantity,
          location_id: values.location_id,
        });

        if (error) throw error;

        toast({
          title: 'Consumable added',
          description: 'The consumable has been allocated to the convention',
        });
      }

      form.reset();
      onConsumableAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding consumable:', error);
      toast({
        title: 'Error adding consumable',
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
          <DialogTitle>Add Consumable</DialogTitle>
          <DialogDescription>
            Add consumable items to your convention.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consumable Item*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a consumable item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only consumable items are shown here
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allocated_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocated Quantity*</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Total quantity allocated for this convention
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="used_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Used Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Quantity already used (default is 0)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No location</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Where this consumable is stored
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Consumable'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

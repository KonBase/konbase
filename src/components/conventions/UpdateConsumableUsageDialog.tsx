'use client';

import React, { useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ConventionConsumable } from '@/types/convention';

interface UpdateConsumableUsageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consumable: ConventionConsumable;
  onUsageUpdated: () => void;
}

const usageSchema = z.object({
  used_quantity: z.coerce
    .number()
    .int()
    .min(0, {
      message: 'Used quantity cannot be negative',
    })
    .refine(
      (val) => {
        // We'll validate against the allocated quantity in onSubmit
        return true;
      },
      {
        message: 'Used quantity cannot exceed allocated quantity',
      },
    ),
});

export const UpdateConsumableUsageDialog: React.FC<
  UpdateConsumableUsageDialogProps
> = ({ isOpen, onClose, consumable, onUsageUpdated }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof usageSchema>>({
    resolver: zodResolver(usageSchema),
    defaultValues: {
      used_quantity: consumable.used_quantity,
    },
  });

  const onSubmit = async (values: z.infer<typeof usageSchema>) => {
    // Validate that used quantity doesn't exceed allocated quantity
    if (values.used_quantity > consumable.allocated_quantity) {
      form.setError('used_quantity', {
        type: 'manual',
        message: 'Used quantity cannot exceed allocated quantity',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('convention_consumables')
        .update({
          used_quantity: values.used_quantity,
        })
        .eq('id', consumable.id);

      if (error) throw error;

      toast({
        title: 'Usage updated',
        description: `Usage updated to ${values.used_quantity} items`,
      });

      onUsageUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating consumable usage:', error);
      toast({
        title: 'Error updating usage',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Update Consumable Usage</DialogTitle>
          <DialogDescription>
            Update the used quantity for {consumable.items?.name || 'this item'}
            .
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Item</p>
              <p className="text-sm">
                {consumable.items?.name || 'Unknown Item'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Allocated Quantity</p>
              <p className="text-sm">{consumable.allocated_quantity}</p>
            </div>

            <FormField
              control={form.control}
              name="used_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Used Quantity*</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max={consumable.allocated_quantity}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How many have been used so far (max:{' '}
                    {consumable.allocated_quantity})
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
                {isLoading ? 'Updating...' : 'Update Usage'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

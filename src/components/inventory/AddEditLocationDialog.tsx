'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  address: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface AddEditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
  } | null;
  onSuccess: () => void;
}

export function AddEditLocationDialog({
  open,
  onOpenChange,
  location,
  onSuccess,
}: AddEditLocationDialogProps) {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  const isEdit = !!location;

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
    },
  });

  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        description: location.description || '',
        address: location.address || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        address: '',
      });
    }
  }, [location, form]);

  const onSubmit = async (data: LocationFormData) => {
    if (!currentAssociation) return;

    try {
      if (isEdit && location) {
        const { error } = await supabase
          .from('storage_locations')
          .update(data)
          .eq('id', location.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Location updated successfully',
        });
      } else {
        const { error } = await supabase.from('storage_locations').insert({
          ...data,
          association_id: currentAssociation.id,
        });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Location created successfully',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} location`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add'} Storage Location</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the storage location details'
              : 'Add a new storage location'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Warehouse A, Garage, Office Storage"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description of the location"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional physical address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEdit ? 'Update' : 'Create'} Location
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

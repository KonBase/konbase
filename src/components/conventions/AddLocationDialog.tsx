'use client';

import React, { useState, Dispatch, SetStateAction } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ConventionLocation } from '@/types/convention';

interface AddLocationDialogProps {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
  conventionId: string;
  onLocationAdded: () => void;
  location?: any;
  locationToEdit?: ConventionLocation | null;
  onSuccess?: () => void;
}

const locationSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Location name must be at least 2 characters' }),
  description: z.string().nullable().optional(),
  type: z.string().min(1, { message: 'Please select a location type' }),
  capacity: z.coerce.number().int().positive().nullable().optional(),
  floor: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
});

export const AddLocationDialog: React.FC<AddLocationDialogProps> = ({
  isOpen,
  onClose,
  conventionId,
  onLocationAdded,
  locationToEdit,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!locationToEdit;

  const form = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: locationToEdit?.name || '',
      description: locationToEdit?.description || '',
      type: locationToEdit?.type || 'room',
      capacity: locationToEdit?.capacity || null,
      floor: locationToEdit?.floor || '',
      building: locationToEdit?.building || '',
    },
  });

  React.useEffect(() => {
    if (isOpen && locationToEdit) {
      form.reset({
        name: locationToEdit.name,
        description: locationToEdit.description || '',
        type: locationToEdit.type || 'room',
        capacity: locationToEdit.capacity || null,
        floor: locationToEdit.floor || '',
        building: locationToEdit.building || '',
      });
    } else if (isOpen) {
      form.reset({
        name: '',
        description: '',
        type: 'room',
        capacity: null,
        floor: '',
        building: '',
      });
    }
  }, [isOpen, locationToEdit, form]);

  const onSubmit = async (values: z.infer<typeof locationSchema>) => {
    if (!conventionId) {
      toast({
        title: 'Error',
        description: 'Convention ID is missing',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(
        `${isEditing ? 'Updating' : 'Creating'} location for convention:`,
        conventionId,
      );

      let result;

      if (isEditing) {
        // Update existing location
        result = await supabase
          .from('convention_locations')
          .update({
            name: values.name,
            description: values.description || null,
            type: values.type,
            capacity: values.capacity,
            floor: values.floor || null,
            building: values.building || null,
          })
          .eq('id', locationToEdit.id)
          .select();
      } else {
        // Create new location
        result = await supabase
          .from('convention_locations')
          .insert({
            convention_id: conventionId,
            name: values.name,
            description: values.description || null,
            type: values.type,
            capacity: values.capacity,
            floor: values.floor || null,
            building: values.building || null,
          })
          .select();
      }

      const { data, error } = result;

      if (error) throw error;

      console.log(
        `Location ${isEditing ? 'updated' : 'added'} successfully:`,
        data,
      );

      // Log this action to convention_logs
      const { data: userData } = await supabase.auth.getUser();
      try {
        await supabase.from('convention_logs').insert({
          convention_id: conventionId,
          user_id: userData.user?.id,
          action: isEditing ? 'update' : 'create',
          entity_type: 'location',
          entity_id: isEditing ? locationToEdit.id : data[0]?.id,
          details: {
            name: values.name,
            type: values.type,
          },
        });
      } catch (logError) {
        console.error('Error logging location action:', logError);
        // Don't throw here, this is a non-critical action
      }

      toast({
        title: isEditing ? 'Location updated' : 'Location added',
        description: `${values.name} has been ${isEditing ? 'updated' : 'added'} successfully`,
      });

      // Reset form after successful submission
      form.reset();

      // Notify parent and close dialog
      onLocationAdded();
      onClose();
    } catch (error: any) {
      console.error(
        `Error ${isEditing ? 'updating' : 'adding'} location:`,
        error,
      );
      toast({
        title: `Error ${isEditing ? 'updating' : 'adding'} location`,
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Location' : 'Add New Location'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of this convention location.'
              : 'Add a new room or area to your convention.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Hall" {...field} />
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
                      placeholder="Brief description of the location"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Type*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="room">Room</SelectItem>
                        <SelectItem value="hall">Hall</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                        <SelectItem value="booth">Booth</SelectItem>
                        <SelectItem value="stage">Stage</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value === null ? '' : field.value}
                      />
                    </FormControl>
                    <FormDescription>Maximum number of people</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Building A"
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
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1st Floor"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Adding...'}
                  </>
                ) : isEditing ? (
                  'Update Location'
                ) : (
                  'Add Location'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

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

interface AddRequirementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conventionId: string;
  onRequirementAdded: () => void;
}

const requirementSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Requirement name must be at least 2 characters' }),
  description: z.string().nullable().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  notes: z.string().nullable().optional(),
});

export const AddRequirementDialog: React.FC<AddRequirementDialogProps> = ({
  isOpen,
  onClose,
  conventionId,
  onRequirementAdded,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof requirementSchema>>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 'medium',
      notes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof requirementSchema>) => {
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

      const { error } = await supabase.from('convention_requirements').insert({
        convention_id: conventionId,
        name: values.name,
        description: values.description || null,
        requested_by: user.id,
        status: 'requested',
        priority: values.priority,
        notes: values.notes || null,
      });

      if (error) throw error;

      toast({
        title: 'Requirement added',
        description: `${values.name} has been added successfully`,
      });

      form.reset();
      onRequirementAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding requirement:', error);
      toast({
        title: 'Error adding requirement',
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
          <DialogTitle>Add New Requirement</DialogTitle>
          <DialogDescription>
            Request equipment or resources for your convention.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement Name*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Extra chairs for main hall"
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
                      placeholder="Provide details about this requirement"
                      className="min-h-[100px]"
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
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How urgent is this requirement?
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
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information or context"
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
                {isLoading ? 'Adding...' : 'Add Requirement'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

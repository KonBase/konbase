'use client';

import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Category } from '@/hooks/useCategories';

interface AddEditCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category>) => Promise<void>;
  categoryToEdit?: Category | null;
}

const categorySchema = z.object({
  name: z.string().min(1, { message: 'Category name is required' }),
  description: z.string().optional(),
});

export const AddEditCategoryDialog: React.FC<AddEditCategoryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!categoryToEdit;

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen && categoryToEdit) {
      form.reset({
        name: categoryToEdit.name,
        description: categoryToEdit.description || '',
      });
    } else if (isOpen) {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [isOpen, categoryToEdit, form]);

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    setIsSubmitting(true);

    try {
      const categoryData = {
        ...(categoryToEdit ? { id: categoryToEdit.id } : {}),
        name: values.name,
        description: values.description || null,
      };

      await onSave(categoryData);

      toast({
        title: isEditing ? 'Category updated' : 'Category created',
        description: `${values.name} has been ${isEditing ? 'updated' : 'created'} successfully`,
      });

      form.reset();
      onClose();
    } catch (error: any) {
      console.error(
        `Error ${isEditing ? 'updating' : 'creating'} category:`,
        error,
      );
      toast({
        title: `Error ${isEditing ? 'updating' : 'creating'} category`,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of this category.'
              : 'Create a new category for organizing your inventory items.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Electronics" {...field} />
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
                      placeholder="Brief description of this category"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help identify items in this
                    category.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditing ? (
                  'Update Category'
                ) : (
                  'Create Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';

interface CreateTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: () => void;
  conventionId?: string;
}

const templateSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Template name must be at least 2 characters' }),
  description: z.string().optional(),
});

export const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
  conventionId,
}) => {
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    if (!currentAssociation) {
      toast({
        title: 'Error',
        description: 'No association selected',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('convention_templates')
        .insert({
          association_id: currentAssociation.id,
          name: values.name,
          description: values.description || null,
          convention_id: conventionId || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Template created',
        description: `${values.name} has been created successfully`,
      });

      form.reset();
      onTemplateCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error creating template',
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
          <DialogTitle>Create Template</DialogTitle>
          <DialogDescription>
            Create a reusable template for future conventions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Annual Convention Template"
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
                      placeholder="Brief description of what this template includes"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the purpose and contents of this template.
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
                    Creating...
                  </>
                ) : (
                  'Create Template'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

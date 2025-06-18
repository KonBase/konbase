'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import { ConventionFormData } from '@/types/convention';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useRouter } from '@/lib/navigation';

const CreateConventionDialog = ({
  onConventionCreated,
}: {
  onConventionCreated?: () => void;
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentAssociation } = useAssociation();
  const router = useRouter();

  const handleCreateConvention = async (data: ConventionFormData) => {
    if (!currentAssociation) {
      toast({
        title: 'Error',
        description: 'No association selected',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: createdConvention, error } = await supabase
        .from('conventions')
        .insert({
          name: data.name,
          description: data.description || null,
          start_date: format(data.start_date, "yyyy-MM-dd'T'HH:mm:ssXXX"),
          end_date: format(data.end_date, "yyyy-MM-dd'T'HH:mm:ssXXX"),
          location: data.location || null,
          association_id: currentAssociation.id,
          status: 'planned',
        })
        .select('id') // Pobierz ID nowo utworzonej konwencji
        .single();

      if (error) throw error;

      // Dodaj lokalizację "Storage" dla nowo utworzonej konwencji
      const { error: locationError } = await supabase
        .from('convention_locations')
        .insert({
          name: 'Storage',
          convention_id: createdConvention.id, // Użyj ID nowo utworzonej konwencji
        });

      if (locationError) throw locationError;

      toast({
        title: 'Convention created',
        description: `${data.name} has been created successfully.`,
      });

      setIsOpen(false);
      if (onConventionCreated) onConventionCreated();
      router.push(`/conventions/${createdConvention.id}`);
    } catch (error: unknown) {
      console.error('Error creating convention:', error);
      toast({
        title: 'Error creating convention',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Convention
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Convention</DialogTitle>
          <DialogDescription>
            Enter the details for your new convention.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const data: ConventionFormData = {
              name: formData.get('name') as string,
              description: formData.get('description') as string,
              start_date: new Date(), // Replace with actual date input handling
              end_date: new Date(), // Replace with actual date input handling
              location: '', // Replace with actual location input handling
            };
            handleCreateConvention(data);
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Convention name"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Convention description"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Convention'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateConventionDialog;

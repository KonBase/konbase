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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';

interface AddTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateAdded: () => void;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  category_id: string;
  is_consumable: boolean;
}

interface Category {
  id: string;
  name: string;
}

const templateSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Template name must be at least 2 characters' }),
  description: z.string().nullable().optional(),
  includeLocations: z.boolean().default(false),
  includeEquipment: z.boolean().default(false),
  includeConsumables: z.boolean().default(false),
  selectedLocations: z.array(z.string()).optional(),
  selectedEquipment: z.array(z.string()).optional(),
  selectedConsumables: z.array(z.string()).optional(),
});

export const AddTemplateDialog: React.FC<AddTemplateDialogProps> = ({
  isOpen,
  onClose,
  onTemplateAdded,
}) => {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [consumables, setConsumables] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      includeLocations: false,
      includeEquipment: false,
      includeConsumables: false,
      selectedLocations: [],
      selectedEquipment: [],
      selectedConsumables: [],
    },
  });

  const includeLocations = form.watch('includeLocations');
  const includeEquipment = form.watch('includeEquipment');
  const includeConsumables = form.watch('includeConsumables');
  const selectedLocations = form.watch('selectedLocations');
  const selectedEquipment = form.watch('selectedEquipment');
  const selectedConsumables = form.watch('selectedConsumables');

  // Fetch locations, equipment, and consumables
  useEffect(() => {
    if (!isOpen || !currentAssociation) return;

    const fetchTemplateData = async () => {
      try {
        // Fetch locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('id, name, type')
          .eq('association_id', currentAssociation.id)
          .order('name');

        if (locationsError) throw locationsError;
        setLocations(locationsData || []);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('association_id', currentAssociation.id)
          .order('name');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch equipment (non-consumable items)
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('items')
          .select('id, name, category_id, is_consumable')
          .eq('association_id', currentAssociation.id)
          .eq('is_consumable', false)
          .order('name');

        if (equipmentError) throw equipmentError;
        setEquipment(equipmentData || []);

        // Fetch consumables
        const { data: consumablesData, error: consumablesError } =
          await supabase
            .from('items')
            .select('id, name, category_id, is_consumable')
            .eq('association_id', currentAssociation.id)
            .eq('is_consumable', true)
            .order('name');

        if (consumablesError) throw consumablesError;
        setConsumables(consumablesData || []);
      } catch (error: any) {
        console.error('Error fetching template data:', error);
        toast({
          title: 'Error loading data',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    };

    fetchTemplateData();
  }, [isOpen, currentAssociation]);

  const onSubmit = async (values: z.infer<typeof templateSchema>) => {
    if (!currentAssociation) {
      toast({
        title: 'Error',
        description: 'Association data is missing',
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

      // Build the configuration object based on selected items
      const configuration: Record<string, any> = {};

      if (values.includeLocations && values.selectedLocations?.length) {
        configuration.locations = locations
          .filter((location) => values.selectedLocations?.includes(location.id))
          .map((location) => ({
            name: location.name,
            type: location.type,
          }));
      }

      if (values.includeEquipment && values.selectedEquipment?.length) {
        configuration.equipment = equipment
          .filter((item) => values.selectedEquipment?.includes(item.id))
          .map((item: EquipmentItem) => ({
            item_id: item.id,
            quantity: 1, // Default quantity
          }));
      }

      if (values.includeConsumables && values.selectedConsumables?.length) {
        configuration.consumables = consumables
          .filter((item) => values.selectedConsumables?.includes(item.id))
          .map((item: EquipmentItem) => ({
            item_id: item.id,
            allocated_quantity: 10, // Default quantity
            used_quantity: 0,
          }));
      }

      const { error } = await supabase.from('convention_templates').insert({
        association_id: currentAssociation.id,
        name: values.name,
        description: values.description || null,
        configuration,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Template created',
        description: `${values.name} has been created successfully`,
      });

      form.reset();
      onTemplateAdded();
      onClose();
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error creating template',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Convention Template</DialogTitle>
          <DialogDescription>
            Save your convention setup as a template for future use.
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
                      placeholder="e.g., Standard Gaming Convention"
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
                      placeholder="Describe what this template includes"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="py-2">
              <h3 className="text-lg font-medium mb-2">Include in Template</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="includeLocations"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Locations</FormLabel>
                        <FormDescription>
                          Include standard rooms and areas in your template
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeEquipment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Equipment</FormLabel>
                        <FormDescription>
                          Include standard equipment items in your template
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeConsumables"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Consumables</FormLabel>
                        <FormDescription>
                          Include standard consumable items in your template
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Tabs defaultValue="locations" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger
                  value="locations"
                  className="flex-1"
                  disabled={!includeLocations}
                >
                  Locations{' '}
                  {selectedLocations?.length
                    ? `(${selectedLocations.length})`
                    : ''}
                </TabsTrigger>
                <TabsTrigger
                  value="equipment"
                  className="flex-1"
                  disabled={!includeEquipment}
                >
                  Equipment{' '}
                  {selectedEquipment?.length
                    ? `(${selectedEquipment.length})`
                    : ''}
                </TabsTrigger>
                <TabsTrigger
                  value="consumables"
                  className="flex-1"
                  disabled={!includeConsumables}
                >
                  Consumables{' '}
                  {selectedConsumables?.length
                    ? `(${selectedConsumables.length})`
                    : ''}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="locations" className="mt-4">
                {!includeLocations ? (
                  <p className="text-muted-foreground text-center py-4">
                    Enable locations to select items
                  </p>
                ) : locations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No locations found in your inventory
                  </p>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="selectedLocations"
                      render={() => (
                        <FormItem>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {locations.map((location) => (
                              <FormField
                                key={location.id}
                                control={form.control}
                                name="selectedLocations"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={location.id}
                                      className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-2"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            location.id,
                                          )}
                                          onCheckedChange={(checked) => {
                                            const currentValues =
                                              field.value || [];
                                            if (checked) {
                                              // Add to selection
                                              field.onChange([
                                                ...currentValues,
                                                location.id,
                                              ]);
                                            } else {
                                              // Remove from selection
                                              field.onChange(
                                                currentValues.filter(
                                                  (value) =>
                                                    value !== location.id,
                                                ),
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <div className="leading-none">
                                        <FormLabel className="text-sm font-normal">
                                          {location.name}
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                          {location.type}
                                        </p>
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="equipment" className="mt-4">
                {!includeEquipment ? (
                  <p className="text-muted-foreground text-center py-4">
                    Enable equipment to select items
                  </p>
                ) : equipment.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No equipment found in your inventory
                  </p>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="selectedEquipment"
                      render={() => (
                        <FormItem>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {equipment.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="selectedEquipment"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-2"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            item.id,
                                          )}
                                          onCheckedChange={(checked) => {
                                            const currentValues =
                                              field.value || [];
                                            if (checked) {
                                              field.onChange([
                                                ...currentValues,
                                                item.id,
                                              ]);
                                            } else {
                                              field.onChange(
                                                currentValues.filter(
                                                  (value) => value !== item.id,
                                                ),
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <div className="leading-none">
                                        <FormLabel className="text-sm font-normal">
                                          {item.name}
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                          {getCategoryName(item.category_id)}
                                        </p>
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="consumables" className="mt-4">
                {!includeConsumables ? (
                  <p className="text-muted-foreground text-center py-4">
                    Enable consumables to select items
                  </p>
                ) : consumables.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No consumables found in your inventory
                  </p>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="selectedConsumables"
                      render={() => (
                        <FormItem>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {consumables.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="selectedConsumables"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-2"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            item.id,
                                          )}
                                          onCheckedChange={(checked) => {
                                            const currentValues =
                                              field.value || [];
                                            if (checked) {
                                              field.onChange([
                                                ...currentValues,
                                                item.id,
                                              ]);
                                            } else {
                                              field.onChange(
                                                currentValues.filter(
                                                  (value) => value !== item.id,
                                                ),
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <div className="leading-none">
                                        <FormLabel className="text-sm font-normal">
                                          {item.name}
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                          {getCategoryName(item.category_id)}
                                        </p>
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

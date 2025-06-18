import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  associationId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentAssociation } = useAssociation();

  useEffect(() => {
    if (currentAssociation) {
      fetchCategories();
    } else {
      setCategories([]);
      setLoading(false);
    }
  }, [currentAssociation]);

  const fetchCategories = async () => {
    if (!currentAssociation) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .order('name');

      if (error) throw error;

      const formattedCategories = data.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        associationId: cat.association_id,
        parentId: cat.parent_id,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at,
      }));

      setCategories(formattedCategories);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (
    name: string,
    description?: string,
    parentId?: string,
  ) => {
    if (!currentAssociation) {
      toast({
        title: 'Error',
        description: 'No association selected.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const { error } = await supabase.from('categories').insert({
        id,
        name,
        description: description || null,
        association_id: currentAssociation.id,
        parent_id: parentId || null,
        created_at: now,
        updated_at: now,
      });

      if (error) throw error;

      // Fetch the newly created category
      const { data: newCategoryData, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const newCategory: Category = {
        id: newCategoryData.id,
        name: newCategoryData.name,
        description: newCategoryData.description,
        associationId: newCategoryData.association_id,
        parentId: newCategoryData.parent_id,
        createdAt: newCategoryData.created_at,
        updatedAt: newCategoryData.updated_at,
      };

      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCategory = async (
    id: string,
    updates: { name?: string; description?: string; parentId?: string | null },
  ) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: updates.name,
          description: updates.description,
          parent_id: updates.parentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id
            ? {
                ...cat,
                name: updates.name || cat.name,
                description:
                  updates.description !== undefined
                    ? updates.description
                    : cat.description,
                parentId:
                  updates.parentId !== undefined
                    ? updates.parentId
                    : cat.parentId,
                updatedAt: new Date().toISOString(),
              }
            : cat,
        ),
      );

      return true;
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Check if category has items
      const { count, error: countError } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast({
          title: 'Cannot Delete',
          description: `This category has ${count} items assigned to it. Please reassign or delete these items first.`,
          variant: 'destructive',
        });
        return false;
      }

      // Check if category has children
      const { count: childCount, error: childCountError } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', id);

      if (childCountError) throw childCountError;

      if (childCount && childCount > 0) {
        toast({
          title: 'Cannot Delete',
          description: `This category has ${childCount} subcategories. Please delete or reassign these subcategories first.`,
          variant: 'destructive',
        });
        return false;
      }

      // Proceed with deletion
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) throw error;

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    categories,
    loading,
    refreshCategories: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

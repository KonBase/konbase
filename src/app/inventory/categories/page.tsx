'use client';

import React from 'react';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { useAssociation } from '@/contexts/AssociationContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CategoryManager from '@/components/inventory/CategoryManager';
import { FolderTree } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Edit, Trash2 } from 'lucide-react';
import { AddEditCategoryDialog } from '@/components/inventory/AddEditCategoryDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/hooks/useCategories';

export default function InventoryCategoriesPage() {
  const { currentAssociation, isLoading } = useAssociation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('item_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch item counts for each category
      const { data: itemCounts, error: countError } = await supabase
        .from('items')
        .select('category_id')
        .in(
          'category_id',
          categoriesData.map((c: { id: string }) => c.id),
        );

      if (!countError && itemCounts) {
        interface ItemCount {
          category_id: string;
        }

        interface CountMap {
          [categoryId: string]: number;
        }

        const countMap: CountMap = itemCounts.reduce(
          (acc: CountMap, item: ItemCount) => {
            acc[item.category_id] = (acc[item.category_id] || 0) + 1;
            return acc;
          },
          {} as CountMap,
        );

        const categoriesWithCounts: Category[] = categoriesData.map(
          (category: Omit<Category, 'item_count'>) => ({
            ...category,
            item_count: countMap[category.id] || 0,
          }),
        );

        setCategories(categoriesWithCounts);
      } else {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabase
        .from('item_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description:
          'Failed to delete category. Make sure no items are using this category.',
        variant: 'destructive',
      });
    } finally {
      setCategoryToDelete(null);
    }
  };

  const renderCategoryTree = (parentId: string | null = null, level = 0) => {
    return categories
      .filter((cat) => cat.parentId === parentId)
      .map((category) => (
        <div key={category.id} style={{ marginLeft: `${level * 2}rem` }}>
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {(category as Category & { item_count?: number }).item_count || 0} items
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCategoryToDelete(category)}
                    disabled={((category as Category & { item_count?: number }).item_count || 0) > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
          {renderCategoryTree(category.id, level + 1)}
        </div>
      ));
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="h-4 w-96 bg-muted rounded animate-pulse mb-6"></div>
          <div className="border rounded-lg p-4 animate-pulse">
            <div className="h-10 bg-muted rounded w-full mb-4"></div>
            <div className="h-40 bg-muted rounded w-full"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!currentAssociation) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>No Association Selected</CardTitle>
              <CardDescription>
                Please select or create an association to manage item
                categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/association">Go to Associations</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <FolderTree className="h-6 w-6" /> Item Categories
            </h1>
            <p className="text-muted-foreground">
              Group your inventory items using categories for better
              organization and filtering.
            </p>
          </div>
        </div>
        <CategoryManager />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Item Categories</h1>
            <p className="text-muted-foreground">
              Organize your inventory with categories
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first category to organize your inventory
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>{renderCategoryTree()}</div>
        )}

        <AddEditCategoryDialog
          isOpen={isAddDialogOpen}
          categoryToEdit={selectedCategory}
          onClose={() => {
            setIsAddDialogOpen(false);
            setSelectedCategory(null);
          }}
          onSave={async (category) => {
            try {
              const isEditing = !!category.id;
              const { error } = isEditing
                ? await supabase
                    .from('item_categories')
                    .update({
                      name: category.name,
                      description: category.description,
                    })
                    .eq('id', category.id)
                : await supabase.from('item_categories').insert([
                    {
                      name: category.name,
                      description: category.description,
                    },
                  ]);

              if (error) throw error;

              fetchCategories();
              return Promise.resolve();
            } catch (error) {
              console.error('Error saving category:', error);
              toast({
                title: 'Error',
                description: 'Failed to save category',
                variant: 'destructive',
              });
              return Promise.reject(error);
            }
          }}
        />

        <AlertDialog
          open={!!categoryToDelete}
          onOpenChange={() => setCategoryToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{categoryToDelete?.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  );
}

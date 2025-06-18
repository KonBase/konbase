'use client';

import React, { useState } from 'react';
import { useCategories, Category } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Pencil, Trash, FolderTree, FileBox } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Define a constant for the special 'no parent' value
const NO_PARENT_VALUE = '__NONE__';

// Helper function to build a tree structure from flat categories
const buildCategoryTree = (
  categories: Category[],
): (Category & { children: Category[] })[] => {
  const categoriesMap: Record<string, Category & { children: Category[] }> = {};

  // Initialize map with all categories
  categories.forEach((category) => {
    categoriesMap[category.id] = { ...category, children: [] };
  });

  // Build the tree structure
  const rootCategories: (Category & { children: Category[] })[] = [];

  categories.forEach((category) => {
    if (category.parentId) {
      // Add to parent's children if parent exists
      if (categoriesMap[category.parentId]) {
        categoriesMap[category.parentId].children.push(
          categoriesMap[category.id],
        );
      } else {
        // If parent doesn't exist (data inconsistency), add to root
        rootCategories.push(categoriesMap[category.id]);
      }
    } else {
      // Add to root categories if no parent
      rootCategories.push(categoriesMap[category.id]);
    }
  });

  return rootCategories;
};

export function CategoryManager() {
  const {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: null as string | null, // Initialize parentId as null
  });

  // Prepare the tree view data when in tree mode
  const categoryTree = buildCategoryTree(categories);

  const resetFormData = () => {
    setFormData({ name: '', description: '', parentId: null }); // Reset parentId to null
  };

  const openAddDialog = () => {
    resetFormData(); // Ensure parentId is null when opening add dialog
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId, // parentId from category is already string | null
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleAddCategory = async () => {
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createCategory(
        formData.name,
        formData.description,
        formData.parentId, // Pass parentId directly (it's null or a string ID)
      );

      setIsAddDialogOpen(false);
      resetFormData();

      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
    } catch (error) {
      // Error handling is inside createCategory hook
    }
  };

  const handleUpdateCategory = async () => {
    if (!currentCategory || !formData.name) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateCategory(currentCategory.id, {
        name: formData.name,
        description: formData.description,
        parentId: formData.parentId, // Pass parentId directly (it's null or a string ID)
      });

      setIsEditDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!currentCategory) return;

    try {
      const success = await deleteCategory(currentCategory.id);

      if (success) {
        setIsDeleteDialogOpen(false);

        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const renderCategoryTreeItem = (
    category: Category & { children: Category[] },
    depth = 0,
  ) => {
    return (
      <React.Fragment key={category.id}>
        <TableRow>
          <TableCell className="font-medium">
            <div
              style={{ paddingLeft: `${depth * 1.5}rem` }}
              className="flex items-center"
            >
              <FileBox className="h-4 w-4 mr-2" />
              {category.name}
            </div>
          </TableCell>
          <TableCell>{category.description || '-'}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(category)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {category.children &&
          category.children.map((child) =>
            renderCategoryTreeItem(
              child as Category & { children: Category[] },
              depth + 1,
            ),
          )}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Categories</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
            >
              {viewMode === 'list' ? (
                <>
                  <FolderTree className="h-4 w-4 mr-2" />
                  Tree View
                </>
              ) : (
                <>
                  <FileBox className="h-4 w-4 mr-2" />
                  List View
                </>
              )}
            </Button>
            <Button size="sm" onClick={openAddDialog}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-6">
              <FileBox className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No Categories Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Categories help you organize your inventory items.
              </p>
              <Button className="mt-4" onClick={openAddDialog}>
                Create Your First Category
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewMode === 'list'
                    ? categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FileBox className="h-4 w-4 mr-2" />
                              {category.name}
                              {category.parentId && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (Subcategory)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{category.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(category)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : categoryTree.map((category) =>
                        renderCategoryTreeItem(category),
                      )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your inventory items.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter category name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter category description"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Category (Optional)</Label>
              <Select
                value={formData.parentId ?? NO_PARENT_VALUE} // Map null/undefined to NO_PARENT_VALUE
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parentId: value === NO_PARENT_VALUE ? null : value,
                  })
                } // Map NO_PARENT_VALUE back to null
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT_VALUE}>No Parent</SelectItem>{' '}
                  {/* Use special value */}
                  {categories
                    .filter(
                      (cat) =>
                        !currentCategory || cat.id !== currentCategory.id,
                    ) // Prevent self-parenting during edit
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-parent">Parent Category (Optional)</Label>
              <Select
                value={formData.parentId ?? NO_PARENT_VALUE} // Map null/undefined to NO_PARENT_VALUE
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parentId: value === NO_PARENT_VALUE ? null : value,
                  })
                } // Map NO_PARENT_VALUE back to null
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT_VALUE}>No Parent</SelectItem>{' '}
                  {/* Use special value */}
                  {categories
                    .filter(
                      (cat) =>
                        !currentCategory || cat.id !== currentCategory.id,
                    ) // Prevent self-parenting
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? Any subcategories
              or items assigned to this category must be updated first.
            </DialogDescription>
          </DialogHeader>

          {currentCategory && (
            <div className="py-4">
              <p className="font-medium">{currentCategory.name}</p>
              {currentCategory.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentCategory.description}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CategoryManager;

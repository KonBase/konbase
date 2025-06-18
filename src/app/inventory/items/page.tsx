'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAssociation } from '@/contexts/AssociationContext';
import { useInventoryItems, NewInventoryItem } from '@/hooks/useInventoryItems';
import { InventoryItemList } from '@/components/inventory/InventoryItemList';
import { InventoryFilters } from '@/components/inventory/InventoryFilters';
import { CreateItemDialog } from '@/components/inventory/CreateItemDialog';
import { ArrowLeft, Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';

export default function InventoryItemsPage() {
  const { currentAssociation, isLoading: isAssociationLoading } =
    useAssociation();
  const {
    items,
    loading: isItemsLoading,
    refreshItems,
    createItem,
    updateItem,
    deleteItem,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sort,
    setSort,
  } = useInventoryItems();
  const { categories, loading: categoriesLoading } = useCategories();
  const { locations, loading: locationsLoading } = useLocations();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (currentAssociation) {
      refreshItems();
    }
  }, [currentAssociation, refreshItems]);

  const handleCreateItem = async (item: NewInventoryItem) => {
    const success = await createItem(item);
    if (success) {
      setIsCreateDialogOpen(false);
    }
    return success;
  };

  const handleUpdateItem = async (id: string, updates: Partial<NewInventoryItem>) => {
    const success = await updateItem(id, updates);
    return success;
  };

  const handleDeleteItem = async (id: string) => {
    const success = await deleteItem(id);
    return success;
  };

  if (isAssociationLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4 md:p-6 space-y-6">
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
          <div className="border rounded-lg p-4 mt-6 animate-pulse">
            <div className="h-10 bg-muted rounded w-full mb-4"></div>
            <div className="h-64 bg-muted rounded w-full"></div>
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
                Please select or create an association to manage inventory
                items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/associations">Go to Associations</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  const isLoading = isItemsLoading || categoriesLoading || locationsLoading;

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Package className="h-6 w-6" /> Inventory Items
              </h1>
              <p className="text-muted-foreground">
                Manage and track all items in your inventory
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <InventoryFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          categories={categories || []}
          locations={locations || []}
        />

        <InventoryItemList
          items={items}
          loading={isLoading}
          createItem={handleCreateItem}
          updateItem={handleUpdateItem}
          deleteItem={handleDeleteItem}
          categories={categories || []}
          locations={locations || []}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
          isAddDialogOpen={isCreateDialogOpen}
          setIsAddDialogOpen={setIsCreateDialogOpen}
          refreshItems={refreshItems}
        />

        <CreateItemDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
          }}
        />
      </div>
    </AuthGuard>
  );
}

// Removed duplicate InventoryPage component

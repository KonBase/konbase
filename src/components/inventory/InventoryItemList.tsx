'use client';

import React from 'react';
import InventoryItemsComponent from '@/components/inventory/InventoryItems';
import {
  InventoryItem,
  NewInventoryItem,
  InventoryFilters,
  InventorySort,
} from '@/hooks/useInventoryItems';
import { Category } from '@/hooks/useCategories';
import { Location } from '@/hooks/useLocations';

interface InventoryItemListProps {
  items: InventoryItem[];
  loading: boolean;
  createItem: (item: NewInventoryItem) => Promise<boolean | null>;
  updateItem: (
    id: string,
    updates: Partial<NewInventoryItem>,
  ) => Promise<boolean | null>;
  deleteItem: (id: string) => Promise<boolean | null>;
  categories: Category[];
  locations: Location[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: InventoryFilters;
  setFilters: (filters: InventoryFilters) => void;
  sort: InventorySort;
  setSort: (sort: InventorySort) => void;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (isOpen: boolean) => void;
  refreshItems: () => void;
}

export const InventoryItemList: React.FC<InventoryItemListProps> = (props) => {
  // Re-export InventoryItemsComponent with the expected name
  return <InventoryItemsComponent {...props} />;
};

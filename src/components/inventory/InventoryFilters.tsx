'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { Category } from '@/hooks/useCategories';
import { Location } from '@/hooks/useLocations';
import { InventoryFilters as InventoryFiltersType } from '@/hooks/useInventoryItems';

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: InventoryFiltersType;
  setFilters: (filters: InventoryFiltersType) => void;
  categories: Category[];
  locations: Location[];
  isConsumable?: boolean;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  categories,
  locations,
  isConsumable = false,
}) => {
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some((v) => v);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0.5 top-0.5 h-8 w-8 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <Select
            value={filters.categoryId || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                categoryId: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.locationId || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                locationId: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.condition || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                condition: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={
              filters.isConsumable === true
                ? 'consumable'
                : filters.isConsumable === false
                  ? 'asset'
                  : 'all'
            }
            onValueChange={(value) =>
              setFilters({
                ...filters,
                isConsumable:
                  value === 'all' ? undefined : value === 'consumable',
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="asset">Assets</SelectItem>
              <SelectItem value="consumable">Consumables</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

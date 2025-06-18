'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  FileText,
  MapPin,
  Box,
  FileWarning,
  Archive,
  BarChart,
  Calendar,
  Search,
  Briefcase,
  Bookmark,
  Settings,
  Users,
  AlertCircle,
} from 'lucide-react';

import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/components/ui/use-toast';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { logDebug } from '@/utils/debug';

// Types for search results
interface SearchResult {
  id: string;
  name: string;
  type:
    | 'item'
    | 'location'
    | 'category'
    | 'set'
    | 'warranty'
    | 'document'
    | 'report'
    | 'archive'
    | 'convention'
    | 'consumable'
    | 'member'
    | 'settings';
  description?: string;
  path: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

// Props for the GlobalSearch component
interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const router = useRouter();
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  const { profile } = useUserProfile();

  // User role and permissions
  const userRole = profile?.role || 'guest';
  const canAccessAdmin = ['admin', 'system_admin', 'super_admin'].includes(
    userRole,
  );
  const canAccessManagement = [
    ...['admin', 'system_admin', 'super_admin'],
    'manager',
  ].includes(userRole);

  // Keyboard shortcut to open command
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Icon mapping for result types
  const getIconForType = (type: string) => {
    switch (type) {
      case 'item':
        return <Package className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'category':
        return <Bookmark className="h-4 w-4" />;
      case 'set':
        return <Box className="h-4 w-4" />;
      case 'warranty':
        return <FileWarning className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'report':
        return <BarChart className="h-4 w-4" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
      case 'convention':
        return <Calendar className="h-4 w-4" />;
      case 'consumable':
        return <Briefcase className="h-4 w-4" />;
      case 'member':
        return <Users className="h-4 w-4" />;
      case 'settings':
        return <Settings className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  // Search function
  const performSearch = useCallback(async () => {
    if (!currentAssociation || !debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const associationId = currentAssociation.id;
    const searchResults: SearchResult[] = [];

    try {
      // Search inventory items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, name, description, is_consumable, category_id')
        .eq('association_id', associationId)
        .or(
          `name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`,
        )
        .limit(5);

      if (itemsError) throw itemsError;

      if (itemsData) {
        // Get categories for items in a separate query to avoid join errors
        const itemIds = itemsData
          .map((item) => item.category_id)
          .filter(Boolean);

        let categoryNames: Record<string, string> = {};
        if (itemIds.length > 0) {
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', itemIds);

          if (categoriesData) {
            categoryNames = categoriesData.reduce(
              (acc, cat) => {
                acc[cat.id] = cat.name;
                return acc;
              },
              {} as Record<string, string>,
            );
          }
        }

        itemsData.forEach((item) => {
          const resultType = item.is_consumable ? 'consumable' : 'item';
          const categoryName = item.category_id
            ? categoryNames[item.category_id]
            : null;

          searchResults.push({
            id: item.id,
            name: item.name,
            type: resultType,
            description:
              categoryName || item.description?.substring(0, 40) || '',
            path: `/inventory/items?id=${item.id}`,
            badge: item.is_consumable ? 'Consumable' : 'Equipment',
            badgeVariant: item.is_consumable ? 'secondary' : 'default',
          });
        });
      }

      // Search categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, description')
        .eq('association_id', associationId)
        .or(
          `name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`,
        )
        .limit(3);

      if (categoriesError) throw categoriesError;

      if (categoriesData) {
        categoriesData.forEach((category) => {
          searchResults.push({
            id: category.id,
            name: category.name,
            type: 'category',
            description:
              category.description?.substring(0, 40) || 'Inventory category',
            path: `/inventory/categories?id=${category.id}`,
            badge: 'Category',
          });
        });
      }

      // Search locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, description')
        .eq('association_id', associationId)
        .or(
          `name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`,
        )
        .limit(3);

      if (locationsError) throw locationsError;

      if (locationsData) {
        locationsData.forEach((location) => {
          searchResults.push({
            id: location.id,
            name: location.name,
            type: 'location',
            description:
              location.description?.substring(0, 40) || 'Storage location',
            path: `/inventory/locations?id=${location.id}`,
            badge: 'Location',
          });
        });
      }

      // Search equipment sets - fix the table name
      const { data: setsData, error: setsError } = await supabase
        .from('equipment_sets')
        .select('id, name, description')
        .eq('association_id', associationId)
        .or(
          `name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`,
        )
        .limit(3);

      if (setsError) throw setsError;

      if (setsData) {
        setsData.forEach((set) => {
          searchResults.push({
            id: set.id,
            name: set.name,
            type: 'set',
            description: set.description?.substring(0, 40) || 'Equipment set',
            path: `/inventory/equipment-sets?id=${set.id}`,
            badge: 'Set',
          });
        });
      }

      // Search documents and warranties, avoiding complex joins that might cause 404 errors
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, name, file_type, item_id')
        .or(`name.ilike.%${debouncedQuery}%`)
        .limit(3);

      if (documentsError) throw documentsError;

      if (documentsData && documentsData.length > 0) {
        // Get item names separately to avoid join issues
        const itemIds = documentsData.map((doc) => doc.item_id).filter(Boolean);
        let itemNames: Record<string, string> = {};

        if (itemIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('items')
            .select('id, name')
            .in('id', itemIds);

          if (itemsData) {
            itemNames = itemsData.reduce(
              (acc, item) => {
                acc[item.id] = item.name;
                return acc;
              },
              {} as Record<string, string>,
            );
          }
        }

        documentsData.forEach((doc) => {
          const isWarranty = doc.name.toLowerCase().includes('warranty');
          const itemName = doc.item_id ? itemNames[doc.item_id] : 'item';

          searchResults.push({
            id: doc.id,
            name: doc.name,
            type: isWarranty ? 'warranty' : 'document',
            description: `Document for ${itemName || 'item'}`,
            path: `/inventory/documents?id=${doc.id}`,
            badge: isWarranty ? 'Warranty' : 'Document',
            badgeVariant: isWarranty ? 'destructive' : 'outline',
          });
        });
      }

      // Search conventions if user has permission
      if (canAccessManagement) {
        const { data: conventionsData, error: conventionsError } =
          await supabase
            .from('conventions')
            .select('id, name, description, status')
            .eq('association_id', associationId)
            .or(
              `name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`,
            )
            .order('start_date', { ascending: false })
            .limit(3);

        if (conventionsError) throw conventionsError;

        if (conventionsData) {
          conventionsData.forEach((convention) => {
            const isArchived = convention.status?.toLowerCase() === 'archived';
            searchResults.push({
              id: convention.id,
              name: convention.name,
              type: isArchived ? 'archive' : 'convention',
              description:
                convention.description?.substring(0, 40) ||
                `Status: ${convention.status || 'Unknown'}`,
              path: `/conventions/${convention.id}`,
              badge: convention.status || 'Unknown',
              badgeVariant:
                convention.status?.toLowerCase() === 'active'
                  ? 'default'
                  : convention.status?.toLowerCase() === 'archived'
                    ? 'secondary'
                    : convention.status?.toLowerCase() === 'planning'
                      ? 'outline'
                      : 'default',
            });
          });
        }
      }

      // Search members if admin, without complex joins
      if (canAccessAdmin) {
        const { data: membersData, error: membersError } = await supabase
          .from('association_members')
          .select('user_id')
          .eq('association_id', associationId)
          .limit(5);

        if (membersError) throw membersError;

        if (membersData && membersData.length > 0) {
          const userIds = membersData
            .map((member) => member.user_id)
            .filter(Boolean);

          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, name, email, role')
              .in('id', userIds)
              .or(
                `name.ilike.%${debouncedQuery}%,email.ilike.%${debouncedQuery}%`,
              )
              .limit(3);

            if (profilesData) {
              profilesData.forEach((profile) => {
                searchResults.push({
                  id: profile.id,
                  name: profile.name || profile.email || 'Unknown member',
                  type: 'member',
                  description: `Role: ${profile.role || 'member'}`,
                  path: `/association/members?id=${profile.id}`,
                  badge: profile.role || 'member',
                  badgeVariant: [
                    'admin',
                    'system_admin',
                    'super_admin',
                  ].includes(profile.role || '')
                    ? 'destructive'
                    : profile.role === 'manager'
                      ? 'default'
                      : 'secondary',
                });
              });
            }
          }
        }
      }

      // Add quick links for common pages based on search
      if (debouncedQuery.toLowerCase().includes('report')) {
        searchResults.push({
          id: 'reports',
          name: 'Reports Dashboard',
          type: 'report',
          description: 'View all reports',
          path: '/reports',
          badge: 'Page',
        });
      }

      if (debouncedQuery.toLowerCase().includes('setting')) {
        searchResults.push({
          id: 'settings',
          name: 'Settings',
          type: 'settings',
          description: 'Manage your settings',
          path: '/settings',
          badge: 'Page',
        });
      }

      setResults(searchResults);

      // Log debug info
      logDebug(
        'Global search results',
        {
          query: debouncedQuery,
          resultsCount: searchResults.length,
        },
        'info',
      );
    } catch (error) {
      console.error('Error performing search:', error);
      toast({
        title: 'Search Error',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedQuery,
    currentAssociation,
    canAccessManagement,
    canAccessAdmin,
    toast,
  ]);

  // Run search when query changes
  useEffect(() => {
    performSearch();
  }, [debouncedQuery, performSearch]);

  // Navigate to selected result and close dialog
  const handleSelect = (result: SearchResult) => {
    router.push(result.path);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Button
        variant="outline"
        className={`relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:w-64 md:w-80 ${className}`}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search everything...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search items, locations, equipment sets, documents, conventions..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : query.length > 0 && results.length === 0 ? (
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p>No results found for "{query}"</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try searching for items, categories, locations, or conventions
                </p>
              </div>
            </CommandEmpty>
          ) : (
            <>
              {query.length === 0 && (
                <div className="px-4 py-6 text-center text-sm">
                  <p className="text-muted-foreground">
                    Start typing to search across all data in your association
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <>
                  {/* Equipment and Inventory Group */}
                  {results.filter((r) =>
                    [
                      'item',
                      'consumable',
                      'category',
                      'location',
                      'set',
                    ].includes(r.type),
                  ).length > 0 && (
                    <CommandGroup heading="Inventory">
                      {results
                        .filter((r) =>
                          [
                            'item',
                            'consumable',
                            'category',
                            'location',
                            'set',
                          ].includes(r.type),
                        )
                        .map((result) => (
                          <CommandItem
                            key={`${result.type}-${result.id}`}
                            value={`${result.type}-${result.name}-${result.id}`}
                            onSelect={() => handleSelect(result)}
                          >
                            <div className="flex items-center">
                              <span className="mr-2 flex items-center justify-center">
                                {getIconForType(result.type)}
                              </span>
                              <span>
                                {result.name}
                                {result.description && (
                                  <span className="text-xs text-muted-foreground block">
                                    {result.description}
                                  </span>
                                )}
                              </span>
                              <div className="ml-auto">
                                {result.badge && (
                                  <Badge
                                    variant={result.badgeVariant || 'secondary'}
                                    className="ml-2 text-xs"
                                  >
                                    {result.badge}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}

                  {/* Documents Group */}
                  {results.filter((r) =>
                    ['document', 'warranty'].includes(r.type),
                  ).length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Documents">
                        {results
                          .filter((r) =>
                            ['document', 'warranty'].includes(r.type),
                          )
                          .map((result) => (
                            <CommandItem
                              key={`${result.type}-${result.id}`}
                              value={`${result.type}-${result.name}-${result.id}`}
                              onSelect={() => handleSelect(result)}
                            >
                              <div className="flex items-center">
                                <span className="mr-2 flex items-center justify-center">
                                  {getIconForType(result.type)}
                                </span>
                                <span>
                                  {result.name}
                                  {result.description && (
                                    <span className="text-xs text-muted-foreground block">
                                      {result.description}
                                    </span>
                                  )}
                                </span>
                                <div className="ml-auto">
                                  {result.badge && (
                                    <Badge
                                      variant={
                                        result.badgeVariant || 'secondary'
                                      }
                                      className="ml-2 text-xs"
                                    >
                                      {result.badge}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </>
                  )}

                  {/* Conventions Group */}
                  {results.filter((r) =>
                    ['convention', 'archive'].includes(r.type),
                  ).length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Conventions">
                        {results
                          .filter((r) =>
                            ['convention', 'archive'].includes(r.type),
                          )
                          .map((result) => (
                            <CommandItem
                              key={`${result.type}-${result.id}`}
                              value={`${result.type}-${result.name}-${result.id}`}
                              onSelect={() => handleSelect(result)}
                            >
                              <div className="flex items-center">
                                <span className="mr-2 flex items-center justify-center">
                                  {getIconForType(result.type)}
                                </span>
                                <span>
                                  {result.name}
                                  {result.description && (
                                    <span className="text-xs text-muted-foreground block">
                                      {result.description}
                                    </span>
                                  )}
                                </span>
                                <div className="ml-auto">
                                  {result.badge && (
                                    <Badge
                                      variant={
                                        result.badgeVariant || 'secondary'
                                      }
                                      className="ml-2 text-xs"
                                    >
                                      {result.badge}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </>
                  )}

                  {/* Reports Group */}
                  {results.filter((r) => ['report'].includes(r.type)).length >
                    0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Reports">
                        {results
                          .filter((r) => ['report'].includes(r.type))
                          .map((result) => (
                            <CommandItem
                              key={`${result.type}-${result.id}`}
                              value={`${result.type}-${result.name}-${result.id}`}
                              onSelect={() => handleSelect(result)}
                            >
                              <div className="flex items-center">
                                <span className="mr-2 flex items-center justify-center">
                                  {getIconForType(result.type)}
                                </span>
                                <span>{result.name}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </>
                  )}

                  {/* Members Group - Only shown for admins */}
                  {canAccessAdmin &&
                    results.filter((r) => ['member'].includes(r.type)).length >
                      0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup heading="Association Members">
                          {results
                            .filter((r) => ['member'].includes(r.type))
                            .map((result) => (
                              <CommandItem
                                key={`${result.type}-${result.id}`}
                                value={`${result.type}-${result.name}-${result.id}`}
                                onSelect={() => handleSelect(result)}
                              >
                                <div className="flex items-center">
                                  <span className="mr-2 flex items-center justify-center">
                                    {getIconForType(result.type)}
                                  </span>
                                  <span>
                                    {result.name}
                                    {result.description && (
                                      <span className="text-xs text-muted-foreground block">
                                        {result.description}
                                      </span>
                                    )}
                                  </span>
                                  <div className="ml-auto">
                                    {result.badge && (
                                      <Badge
                                        variant={
                                          result.badgeVariant || 'secondary'
                                        }
                                        className="ml-2 text-xs"
                                      >
                                        {result.badge}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </>
                    )}
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

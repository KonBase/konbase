'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  PlusIcon,
  Pencil,
  Loader2,
  MapPin,
  PackagePlus,
  PackageMinus,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionConsumable } from '@/types/convention';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AddConsumableDialog } from '@/components/conventions/AddConsumableDialog';
import { UpdateConsumableUsageDialog } from '@/components/conventions/UpdateConsumableUsageDialog';

interface ConventionConsumablesPageProps {
  params: Promise<{ id: string }>;
}

export default function ConventionConsumablesPage({
  params,
}: ConventionConsumablesPageProps) {
  const { id } = use(params);
  const { currentAssociation } = useAssociation();
  const [consumables, setConsumables] = useState<ConventionConsumable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddConsumableOpen, setIsAddConsumableOpen] = useState(false);
  const [isUpdateUsageOpen, setIsUpdateUsageOpen] = useState(false);
  const [selectedConsumable, setSelectedConsumable] =
    useState<ConventionConsumable | null>(null);
  const { toast } = useToast();

  const fetchConsumables = async () => {
    if (!id || !currentAssociation) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_consumables')
        .select(
          `
          *,
          items:item_id(id, name, barcode, category_id),
          locations:location_id(id, name)
        `,
        )
        .eq('convention_id', id);

      if (error) throw error;

      setConsumables(data || []);
    } catch (error: any) {
      console.error('Error loading consumables:', error);
      toast({
        title: 'Error loading consumables',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumables();
  }, [id, currentAssociation]);

  const handleConsumableAdded = () => {
    fetchConsumables();
  };

  const handleUsageUpdated = () => {
    fetchConsumables();
  };

  const openUpdateUsageDialog = (consumable: ConventionConsumable) => {
    setSelectedConsumable(consumable);
    setIsUpdateUsageOpen(true);
  };

  const getUsagePercentage = (used: number, allocated: number) => {
    if (allocated <= 0) return 0;
    return Math.min(Math.max(0, Math.round((used / allocated) * 100)), 100);
  };

  // Calculate totals
  const totalTypes = consumables.length;
  const totalAllocated = consumables.reduce(
    (sum, item) => sum + item.allocated_quantity,
    0,
  );
  const totalUsed = consumables.reduce(
    (sum, item) => sum + item.used_quantity,
    0,
  );
  const overallUsagePercentage = getUsagePercentage(totalUsed, totalAllocated);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Consumables Tracking
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage usage of consumable items for this convention.
          </p>
          <Button variant="link" asChild className="p-0 h-auto text-sm">
            <Link href={`/conventions/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Convention Details
            </Link>
          </Button>
        </div>
        <Button onClick={() => setIsAddConsumableOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add/Allocate Consumable
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consumable Types
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTypes}</div>
            <p className="text-xs text-muted-foreground">
              Different types allocated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Allocated
            </CardTitle>
            <PackagePlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllocated}</div>
            <p className="text-xs text-muted-foreground">
              Total units allocated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Used</CardTitle>
            <PackageMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsed}</div>
            <p className="text-xs text-muted-foreground">
              ({overallUsagePercentage}% overall usage)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Consumables List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Consumables List</CardTitle>
          <CardDescription>
            Detailed list of consumable items and their usage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Loading consumables...
              </span>
            </div>
          ) : consumables.length === 0 ? (
            <div className="text-center py-10">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No Consumables Allocated
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Allocate consumable items to track their usage during the
                convention.
              </p>
              <Button
                variant="default"
                className="mt-4"
                onClick={() => setIsAddConsumableOpen(true)}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add First Consumable
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="w-[200px]">Usage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumables.map((consumable) => {
                    const usagePercent = getUsagePercentage(
                      consumable.used_quantity,
                      consumable.allocated_quantity,
                    );
                    return (
                      <TableRow key={consumable.id}>
                        <TableCell className="font-medium">
                          {consumable.items?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {consumable.locations?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {consumable.allocated_quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {consumable.used_quantity}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={usagePercent}
                              className="h-2 flex-1"
                              aria-label={`${usagePercent}% used`}
                            />
                            <span className="text-xs font-medium w-10 text-right">
                              {usagePercent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUpdateUsageDialog(consumable)}
                            aria-label={`Update usage for ${consumable.items?.name || 'item'}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddConsumableDialog
        isOpen={isAddConsumableOpen}
        onClose={() => setIsAddConsumableOpen(false)}
        conventionId={id}
        onConsumableAdded={handleConsumableAdded}
      />

      {selectedConsumable && (
        <UpdateConsumableUsageDialog
          isOpen={isUpdateUsageOpen}
          onClose={() => setIsUpdateUsageOpen(false)}
          consumable={selectedConsumable}
          onUsageUpdated={handleUsageUpdated}
        />
      )}
    </div>
  );
}

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
import { StorageLocationManager } from '@/components/inventory/StorageLocationManager';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/guards/AuthGuard';

export default function InventoryStoragePage() {
  const { currentAssociation, isLoading } = useAssociation();

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
                Please select or create an association to manage storage
                locations.
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
                <MapPin className="h-6 w-6" /> Storage Locations
              </h1>
              <p className="text-muted-foreground">
                Organize inventory items by their physical storage locations
              </p>
            </div>
          </div>
        </div>

        <StorageLocationManager />

        <Card>
          <CardHeader>
            <CardTitle>About Storage Locations</CardTitle>
            <CardDescription>
              Efficiently track where your inventory items are stored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p>
                Storage locations help you organize and quickly find inventory
                items by defining specific areas where items are stored.
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  Create hierarchical locations (e.g., "Warehouse A → Shelf 3 →
                  Bin 5")
                </li>
                <li>Assign items to specific storage locations</li>
                <li>Track capacity and utilization of storage areas</li>
                <li>Quickly locate items when preparing for events</li>
              </ul>
              <p className="text-sm">
                Well-organized storage locations save time during event setup
                and inventory audits.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

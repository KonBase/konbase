'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BoxIcon, ArrowLeft, PackagePlus } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';
import EquipmentSetManager from '@/components/inventory/EquipmentSetManager';
import Link from 'next/link';
import { AuthGuard } from '@/components/guards/AuthGuard';

export default function EquipmentSetsPage() {
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
          <div className="border rounded-lg p-4 animate-pulse mb-6">
            <div className="h-10 bg-muted rounded w-full mb-4"></div>
            <div className="h-40 bg-muted rounded w-full"></div>
          </div>
          <div className="border rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
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
                Please select or create an association to manage equipment sets.
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                <PackagePlus className="h-6 w-6" /> Equipment Sets
              </h1>
              <p className="text-muted-foreground">
                Create and manage reusable bundles of equipment for conventions
                and events.
              </p>
            </div>
          </div>
        </div>
        <EquipmentSetManager />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BoxIcon className="h-5 w-5" />
              About Equipment Sets
            </CardTitle>
            <CardDescription>
              Streamline your event setup by grouping commonly used items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p>
                Equipment sets allow you to pre-define collections of inventory
                items (like a "Standard Projector Kit" or "Registration Desk
                Setup") that are frequently used together.
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
                <li>Assign sets to convention rooms or event areas quickly.</li>
                <li>Ensure consistency across similar setups.</li>
                <li>Simplify packing lists and resource allocation.</li>
                <li>Track related equipment as a logical unit.</li>
              </ul>
              <p className="text-sm">
                Create a set, add items from your inventory, and then easily
                apply these sets during convention planning.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

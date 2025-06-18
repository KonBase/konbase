'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAssociation } from '@/contexts/AssociationContext';
import { AuthGuard } from '@/components/guards/AuthGuard';
import Link from 'next/link';
import {
  Package,
  FolderTree,
  MapPin,
  FileText,
  PackagePlus,
  FileSpreadsheet,
} from 'lucide-react';

export default function InventoryPage() {
  const { currentAssociation, isLoading } = useAssociation();

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4 md:p-6 space-y-6">
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-10 bg-muted rounded w-full mb-4"></div>
                <div className="h-20 bg-muted rounded w-full"></div>
              </div>
            ))}
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
                Please select or create an association to manage inventory.
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

  const inventoryModules = [
    {
      title: 'Inventory Items',
      description: 'Manage and track all items in your inventory',
      href: '/inventory/items',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Categories',
      description: 'Organize items into logical categories',
      href: '/inventory/categories',
      icon: FolderTree,
      color: 'text-green-600',
    },
    {
      title: 'Storage Locations',
      description: 'Track where items are physically stored',
      href: '/inventory/storage',
      icon: MapPin,
      color: 'text-orange-600',
    },
    {
      title: 'Warranties & Documents',
      description: 'Manage warranties, manuals, and receipts',
      href: '/inventory/warranties',
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      title: 'Equipment Sets',
      description: 'Create reusable bundles of equipment',
      href: '/inventory/sets',
      icon: PackagePlus,
      color: 'text-indigo-600',
    },
    {
      title: 'Import/Export',
      description: 'Bulk import or export inventory data',
      href: '/inventory/import-export',
      icon: FileSpreadsheet,
      color: 'text-red-600',
    },
  ];

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Comprehensive tools to manage your association's inventory and
            equipment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventoryModules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.href}
                className="hover:shadow-lg transition-shadow"
              >
                <Link href={module.href}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${module.color}`} />
                      {module.title}
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}

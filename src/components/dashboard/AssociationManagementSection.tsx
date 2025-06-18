'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Building2,
  Package,
  Users,
  FileBox,
  MapPin,
  BoxIcon,
  FileWarning,
  ArrowUpDown,
} from 'lucide-react';

interface AssociationManagementSectionProps {
  onShowLocationManager: () => void;
}

const AssociationManagementSection: React.FC<
  AssociationManagementSectionProps
> = ({ onShowLocationManager }) => {
  return (
    <div className="mb-6 md:mb-8">
      <h2 className="text-2xl font-bold tracking-tight mb-4">
        Association Management
      </h2>
      <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/association/profile" className="block p-6">
            <div className="flex items-center space-x-4">
              <Building2 className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Association Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Manage association details
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/inventory/items" className="block p-6">
            <div className="flex items-center space-x-4">
              <Package className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Inventory</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your equipment
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/association/members" className="block p-6">
            <div className="flex items-center space-x-4">
              <Users className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage members and permissions
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/inventory/categories" className="block p-6">
            <div className="flex items-center space-x-4">
              <FileBox className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Manage item categories
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card
          className="hover:bg-accent/50 cursor-pointer transition-colors"
          onClick={onShowLocationManager}
        >
          <div className="block p-6">
            <div className="flex items-center space-x-4">
              <MapPin className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Locations</h3>
                <p className="text-sm text-muted-foreground">
                  Manage storage locations
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/inventory/sets" className="block p-6">
            <div className="flex items-center space-x-4">
              <BoxIcon className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Equipment Sets</h3>
                <p className="text-sm text-muted-foreground">
                  Manage predefined sets
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/inventory/warranties" className="block p-6">
            <div className="flex items-center space-x-4">
              <FileWarning className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Warranties</h3>
                <p className="text-sm text-muted-foreground">
                  Track warranties and docs
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/inventory/import-export" className="block p-6">
            <div className="flex items-center space-x-4">
              <ArrowUpDown className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Import/Export</h3>
                <p className="text-sm text-muted-foreground">
                  Data import and export
                </p>
              </div>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default AssociationManagementSection;

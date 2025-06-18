'use client';

import React from 'react';
import LocationManager from '@/components/inventory/LocationManager';
import { Association } from '@/types/association';

interface LocationManagerViewProps {
  onBack: () => void;
  currentAssociation: Association;
}

const LocationManagerView: React.FC<LocationManagerViewProps> = ({
  onBack,
  currentAssociation,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Storage Locations
          </h1>
          <p className="text-muted-foreground">
            {currentAssociation.name} - Managing your storage locations
          </p>
        </div>
      </div>
      <LocationManager />
    </div>
  );
};

export default LocationManagerView;

'use client';

import React from 'react';
import LocationManagerView from '@/components/dashboard/LocationManagerView';
import { Association } from '@/types/association';

interface DashboardLocationViewProps {
  currentAssociation: Association;
  onBack: () => void;
}

const DashboardLocationView: React.FC<DashboardLocationViewProps> = ({
  currentAssociation,
  onBack,
}) => {
  return (
    <div className="container mx-auto py-6">
      <LocationManagerView
        onBack={onBack}
        currentAssociation={currentAssociation}
      />
    </div>
  );
};

export default DashboardLocationView;

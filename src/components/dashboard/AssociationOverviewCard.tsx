'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Association } from '@/types/association';

interface AssociationOverviewCardProps {
  association: Association | null;
}

const AssociationOverviewCard: React.FC<AssociationOverviewCardProps> = ({
  association,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Association Overview</CardTitle>
        <CardDescription>Current status of your association</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {association ? (
            <>
              <p>
                <span className="font-medium">Name:</span> {association.name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{' '}
                {association.contactEmail || 'Not provided'}
              </p>
              {association.description && (
                <p>
                  <span className="font-medium">Description:</span>{' '}
                  {association.description}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Manage your association details, members and equipment
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssociationOverviewCard;

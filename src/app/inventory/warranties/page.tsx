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
import { WarrantiesDocumentsManager } from '@/components/inventory/WarrantiesDocumentsManager';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InventoryWarrantiesPage() {
  const { currentAssociation, isLoading } = useAssociation();
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);

  useEffect(() => {
    // Fetch warranties expiring soon
    if (currentAssociation) {
      // This would be replaced with actual API call
      setExpiringSoonCount(3);
    }
  }, [currentAssociation]);

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
                Please select or create an association to manage warranties and
                documents.
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
                <FileText className="h-6 w-6" /> Warranties & Documents
              </h1>
              <p className="text-muted-foreground">
                Manage warranties, manuals, and important documents for your
                inventory
              </p>
            </div>
          </div>
        </div>

        {expiringSoonCount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {expiringSoonCount} warranties expiring in the next 30
              days.
            </AlertDescription>
          </Alert>
        )}

        <WarrantiesDocumentsManager />

        <Card>
          <CardHeader>
            <CardTitle>Document Management</CardTitle>
            <CardDescription>
              Keep track of important documentation for your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p>
                Store and organize warranties, user manuals, receipts, and other
                important documents related to your inventory items.
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground">
                <li>Upload and attach documents to specific inventory items</li>
                <li>Track warranty expiration dates and get notifications</li>
                <li>Store purchase receipts and invoices</li>
                <li>
                  Keep user manuals and technical specifications accessible
                </li>
                <li>Maintain service records and maintenance schedules</li>
              </ul>
              <p className="text-sm">
                Having documentation readily available helps with maintenance,
                repairs, and warranty claims when needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

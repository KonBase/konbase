import React from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DocumentManager from '@/components/inventory/DocumentManager';
import { ArrowLeft, FileText } from 'lucide-react'; // Added icons

const WarrantiesDocuments = () => {
  const { currentAssociation, isLoading } = useAssociation(); // Added isLoading

  // Consistent Loading State
  if (isLoading) {
     return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
           <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
           <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-96 bg-muted rounded animate-pulse mb-6"></div>
        <div className="border rounded-lg p-4 animate-pulse">
          <div className="h-10 bg-muted rounded w-full mb-4"></div>
          <div className="h-40 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Consistent No Association State
  if (!currentAssociation) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Association Selected</CardTitle>
            <CardDescription>
              Please select or create an association to manage documents and warranties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/association">Go to Associations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    // Use container for consistent padding
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
           {/* Optional Back Button */}
           <Button variant="ghost" size="icon" asChild className="h-8 w-8">
             <Link to="/inventory"> {/* Adjust link as needed */}
               <ArrowLeft className="h-4 w-4" />
             </Link>
           </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6" /> Warranties & Documents
            </h1>
            <p className="text-muted-foreground">
              Upload and manage warranties, manuals, receipts, and other documents related to your inventory items.
            </p>
          </div>
        </div>
        {/* Add Document button might be inside DocumentManager, if not, add here */}
      </div>

      {/* Render the manager component */}
      <DocumentManager />
    </div>
  );
};

export default WarrantiesDocuments;

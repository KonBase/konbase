'use client';

import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ImportExportPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);

    try {
      // Process CSV import
      const formData = new FormData();
      formData.append('file', file);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setImportResult({
        success: true,
        imported: 150,
        errors: 5,
        warnings: 10,
      });

      toast({
        title: 'Import completed',
        description: 'Your inventory has been imported successfully.',
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import inventory.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create and download CSV
      const csvContent =
        'data:text/csv;charset=utf-8,ID,Name,Category,Quantity,Status\n1,Sample Item,Equipment,5,Available';
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `inventory_export_${new Date().toISOString().split('T')[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export completed',
        description: 'Your inventory has been exported successfully.',
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export inventory.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import & Export</h1>
        <p className="text-muted-foreground">
          Manage your inventory data with bulk operations
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Import Inventory
              </CardTitle>
              <CardDescription>
                Upload a CSV file to import inventory items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure your CSV file has the following columns: Name,
                  Category, Quantity, Status, Description
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Select CSV File</Label>
                <div className="flex space-x-2">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={handleFileSelect}
                    disabled={isImporting}
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              </div>

              {isImporting && (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" className="mr-2" />
                  <span>Importing data...</span>
                </div>
              )}

              {importResult && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Import Results</h4>
                  <ul className="space-y-1 text-sm">
                    <li>
                      ✅ {importResult.imported} items imported successfully
                    </li>
                    {importResult.errors > 0 && (
                      <li>❌ {importResult.errors} items failed to import</li>
                    )}
                    {importResult.warnings > 0 && (
                      <li>
                        ⚠️ {importResult.warnings} items imported with warnings
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Export Inventory
              </CardTitle>
              <CardDescription>
                Download your inventory data as a CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The export will include all inventory items with their current
                  status and details.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export All Items
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

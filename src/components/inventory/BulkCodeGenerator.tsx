import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { 
  QrCode, 
  Download, 
  Printer, 
  CheckSquare, 
  Square,
  RefreshCw,
  FileText,
  Image,
  Package
} from 'lucide-react';
import { 
  generateBulkCodes, 
  GeneratedCode, 
  exportCodes, 
  printLabels, 
  generateLabelData,
  CodePrefix
} from '@/utils/qr-barcode-utils';
import { LabelData } from '@/utils/label-printing';
import LabelPrintDialog from './LabelPrintDialog';

interface InventoryItem {
  id: string;
  name: string;
  serial_number?: string | null;
  barcode?: string | null;
  category_id?: string | null;
  location_id?: string | null;
  categories?: { name: string };
  locations?: { name: string };
}

const BulkCodeGenerator: React.FC = () => {
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [prefixes, setPrefixes] = useState<CodePrefix[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedPrefix, setSelectedPrefix] = useState<string>('');
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  useEffect(() => {
    if (currentAssociation) {
      fetchItems();
      fetchPrefixes();
    }
  }, [currentAssociation]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          name,
          serial_number,
          barcode,
          category_id,
          location_id,
          categories:category_id (name),
          locations:location_id (name)
        `)
        .eq('association_id', currentAssociation?.id)
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory items.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrefixes = async () => {
    try {
      const { data, error } = await supabase
        .from('code_prefixes')
        .select('*')
        .eq('association_id', currentAssociation?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPrefixes(data || []);
    } catch (error: any) {
      console.error('Error fetching prefixes:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleGenerateCodes = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select at least one item to generate codes.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedPrefix) {
      toast({
        title: 'No Prefix Selected',
        description: 'Please select a prefix for code generation.',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      const selectedItemsData = items.filter(item => selectedItems.has(item.id));
      const itemsWithPrefix = selectedItemsData.map(item => ({
        id: item.id,
        name: item.name,
        prefix: selectedPrefix
      }));

      // Generate codes with progress tracking
      const codes = await generateBulkCodes(itemsWithPrefix);
      
      // Update progress
      setProgress(100);
      
      setGeneratedCodes(codes);
      setShowResults(true);

      toast({
        title: 'Success',
        description: `Generated ${codes.length} codes successfully.`
      });
    } catch (error: any) {
      console.error('Error generating codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate codes.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const handleExportCodes = (format: 'csv' | 'json') => {
    if (generatedCodes.length === 0) {
      toast({
        title: 'No Codes',
        description: 'No codes to export.',
        variant: 'destructive'
      });
      return;
    }

    exportCodes(generatedCodes, format);
    toast({
      title: 'Export Started',
      description: `Exporting ${generatedCodes.length} codes as ${format.toUpperCase()}.`
    });
  };

  const handlePrintLabels = (format: 'small' | 'medium' | 'large') => {
    if (generatedCodes.length === 0) {
      toast({
        title: 'No Codes',
        description: 'No codes to print.',
        variant: 'destructive'
      });
      return;
    }

    const labelData = generatedCodes.map(code => {
      const item = items.find(i => i.id === code.itemId);
      return generateLabelData(
        {
          id: code.itemId,
          name: code.itemName,
          serial_number: item?.serial_number,
          barcode: item?.barcode,
          categoryName: item?.categories?.name,
          locationName: item?.locations?.name
        },
        code.code,
        code.qrCodeDataUrl,
        code.barcodeDataUrl
      );
    });

    printLabels(labelData, format);
    toast({
      title: 'Print Started',
      description: `Printing ${labelData.length} labels in ${format} format.`
    });
  };

  const convertToLabelData = (codes: GeneratedCode[]): LabelData[] => {
    return codes.map(code => {
      const item = items.find(i => i.id === code.itemId);
      return {
        itemId: code.itemId,
        itemName: code.itemName,
        itemCode: code.code,
        qrCodeDataUrl: code.qrCodeDataUrl,
        barcodeDataUrl: code.barcodeDataUrl,
        category: item?.categories?.name,
        location: item?.locations?.name,
        serialNumber: item?.serial_number || undefined
      };
    });
  };

  const handleUpdateItemCodes = async () => {
    if (generatedCodes.length === 0) return;

    try {
      // Update each item individually to avoid NOT NULL constraint issues
      const updatePromises = generatedCodes.map(async (code) => {
        const { error } = await supabase
          .from('items')
          .update({ 
            barcode: code.code,
            updated_at: new Date().toISOString()
          })
          .eq('id', code.itemId);

        if (error) throw error;
        return code.itemId;
      });

      await Promise.all(updatePromises);

      toast({
        title: 'Success',
        description: 'Item codes updated in database.'
      });

      // Refresh items to show updated codes
      fetchItems();
    } catch (error: any) {
      console.error('Error updating item codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item codes in database.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bulk Code Generation</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Items for Code Generation
          </CardTitle>
          <CardDescription>
            Choose items and a prefix to generate QR codes and barcodes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prefix Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Code Prefix</label>
            <Select value={selectedPrefix} onValueChange={setSelectedPrefix}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a prefix" />
              </SelectTrigger>
              <SelectContent>
                {prefixes.map(prefix => (
                  <SelectItem key={prefix.id} value={prefix.prefix}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{prefix.prefix}</Badge>
                      <span>{prefix.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size === items.length && items.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.categories?.name || (
                        <span className="text-muted-foreground">No category</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.locations?.name || (
                        <span className="text-muted-foreground">No location</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.barcode ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.barcode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">No code</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedItems.size} of {items.length} items selected
              </span>
              {selectedPrefix && (
                <Badge variant="outline">{selectedPrefix}</Badge>
              )}
            </div>
            <Button
              onClick={handleGenerateCodes}
              disabled={selectedItems.size === 0 || !selectedPrefix || generating}
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Codes
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {generating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating codes...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Generated Codes ({generatedCodes.length})
            </DialogTitle>
            <DialogDescription>
              Review and manage the generated QR codes and barcodes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleExportCodes('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExportCodes('json')}>
                <FileText className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => setShowPrintDialog(true)}>
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
              <Button onClick={handleUpdateItemCodes}>
                <Download className="h-4 w-4 mr-2" />
                Save to Database
              </Button>
            </div>

            {/* Codes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedCodes.map((code) => (
                <Card key={code.itemId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{code.itemName}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {code.code}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <div className="text-center flex-1">
                        <img
                          src={code.qrCodeDataUrl}
                          alt="QR Code"
                          className="w-16 h-16 mx-auto border rounded"
                        />
                        <p className="text-xs text-muted-foreground mt-1">QR</p>
                      </div>
                      <div className="text-center flex-1">
                        <img
                          src={code.barcodeDataUrl}
                          alt="Barcode"
                          className="h-16 mx-auto border rounded"
                        />
                        <p className="text-xs text-muted-foreground mt-1">BC</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Label Print Dialog */}
      <LabelPrintDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        labels={convertToLabelData(generatedCodes)}
        onPrintComplete={() => {
          toast({
            title: 'Print Complete',
            description: 'Labels have been sent to printer.'
          });
        }}
      />
    </div>
  );
};

export default BulkCodeGenerator;

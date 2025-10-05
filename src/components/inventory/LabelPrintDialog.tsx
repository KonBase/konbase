import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Printer, Download, Settings } from 'lucide-react';
import { 
  LabelData, 
  LabelTemplate, 
  PrintOptions, 
  DEFAULT_PRINT_OPTIONS, 
  LABEL_TEMPLATES,
  printLabels,
  downloadLabelsAsPDF,
  downloadLabelsAsPDFBlob,
  validatePrintOptions,
  getTemplateById
} from '@/utils/label-printing';

interface LabelPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  labels: LabelData[];
  onPrintComplete?: () => void;
}

const LabelPrintDialog: React.FC<LabelPrintDialogProps> = ({
  isOpen,
  onClose,
  labels,
  onPrintComplete
}) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<PrintOptions>(DEFAULT_PRINT_OPTIONS);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (labels.length === 0) {
      toast({
        title: 'No Labels',
        description: 'No labels to print.',
        variant: 'destructive'
      });
      return;
    }

    setIsPrinting(true);
    
    try {
      const template = getTemplateById(options.template);
      if (!template) {
        throw new Error('Invalid template selected');
      }

      const validatedOptions = validatePrintOptions(options);
      
      // Create copies of labels based on the copies option
      const labelsToPrint: LabelData[] = [];
      for (let i = 0; i < validatedOptions.copies; i++) {
        labelsToPrint.push(...labels);
      }

      await printLabels(labelsToPrint, template, validatedOptions);
      
      toast({
        title: 'Print Started',
        description: `Printing ${labelsToPrint.length} labels using ${template.name}.`
      });
      
      onPrintComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Print error:', error);
      toast({
        title: 'Print Failed',
        description: error.message || 'Failed to print labels.',
        variant: 'destructive'
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (labels.length === 0) {
      toast({
        title: 'No Labels',
        description: 'No labels to download.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const template = getTemplateById(options.template);
      if (!template) {
        throw new Error('Invalid template selected');
      }

      const validatedOptions = validatePrintOptions(options);
      
      // Create copies of labels based on the copies option
      const labelsToDownload: LabelData[] = [];
      for (let i = 0; i < validatedOptions.copies; i++) {
        labelsToDownload.push(...labels);
      }

      // Try the improved PDF generation first
      await downloadLabelsAsPDF(labelsToDownload, template, validatedOptions);
      
      toast({
        title: 'PDF Download Started',
        description: `Generating PDF with ${labelsToDownload.length} labels.`
      });
      
    } catch (error: any) {
      console.error('PDF download error:', error);
      
      // Fallback to HTML download
      try {
        const template = getTemplateById(options.template);
        if (!template) {
          throw new Error('Invalid template selected');
        }

        const validatedOptions = validatePrintOptions(options);
        
        // Create copies of labels based on the copies option
        const labelsToDownload: LabelData[] = [];
        for (let i = 0; i < validatedOptions.copies; i++) {
          labelsToDownload.push(...labels);
        }

        await downloadLabelsAsPDFBlob(labelsToDownload, template, validatedOptions);
        
        toast({
          title: 'HTML File Downloaded',
          description: 'Downloaded HTML file that can be opened and printed as PDF.'
        });
        
      } catch (fallbackError: any) {
        toast({
          title: 'Download Failed',
          description: 'Failed to download PDF. Please try printing instead.',
          variant: 'destructive'
        });
      }
    }
  };

  const updateOption = <K extends keyof PrintOptions>(key: K, value: PrintOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Labels
          </DialogTitle>
          <DialogDescription>
            Configure print settings for {labels.length} label{labels.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Label Template</Label>
            <Select value={options.template} onValueChange={(value) => updateOption('template', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LABEL_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Copies */}
          <div className="space-y-2">
            <Label htmlFor="copies">Copies per Label</Label>
            <Input
              id="copies"
              type="number"
              min="1"
              max="100"
              value={options.copies}
              onChange={(e) => updateOption('copies', parseInt(e.target.value) || 1)}
            />
          </div>

          <Separator />

          {/* Display Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showItemName">Show Item Name</Label>
              <Switch
                id="showItemName"
                checked={options.showItemName}
                onCheckedChange={(checked) => updateOption('showItemName', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showCode">Show Code</Label>
              <Switch
                id="showCode"
                checked={options.showCode}
                onCheckedChange={(checked) => updateOption('showCode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showCategory">Show Category</Label>
              <Switch
                id="showCategory"
                checked={options.showCategory}
                onCheckedChange={(checked) => updateOption('showCategory', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showLocation">Show Location</Label>
              <Switch
                id="showLocation"
                checked={options.showLocation}
                onCheckedChange={(checked) => updateOption('showLocation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showSerialNumber">Show Serial Number</Label>
              <Switch
                id="showSerialNumber"
                checked={options.showSerialNumber}
                onCheckedChange={(checked) => updateOption('showSerialNumber', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select value={options.fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => updateOption('fontSize', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Print Preview</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Template: {getTemplateById(options.template)?.name}</p>
              <p>Total Labels: {labels.length * options.copies}</p>
              <p>Size: {getTemplateById(options.template)?.width}mm × {getTemplateById(options.template)?.height}mm</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            disabled={isPrinting}
          >
            <Download className="h-4 w-4 mr-2" />
            Save as PDF
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Printing...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrintDialog;

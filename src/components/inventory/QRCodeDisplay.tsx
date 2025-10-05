import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  QrCode, 
  Barcode, 
  Download, 
  Printer, 
  Copy, 
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';
import { 
  generateQRCode, 
  generateBarcode, 
  generateUniqueCode,
  GeneratedCode,
  QRCodeConfig,
  BarcodeConfig
} from '@/utils/qr-barcode-utils';
import { LabelData } from '@/utils/label-printing';
import LabelPrintDialog from './LabelPrintDialog';

interface QRCodeDisplayProps {
  itemId: string;
  itemName: string;
  itemCode?: string | null;
  prefix?: string;
  onCodeGenerated?: (code: string) => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  itemId,
  itemName,
  itemCode,
  prefix = 'ITEM',
  onCodeGenerated
}) => {
  const { toast } = useToast();
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [qrConfig, setQrConfig] = useState<QRCodeConfig>({
    width: 200,
    height: 200,
    margin: 2,
    errorCorrectionLevel: 'M'
  });
  const [barcodeConfig, setBarcodeConfig] = useState<BarcodeConfig>({
    width: 2,
    height: 100,
    margin: 10,
    fontSize: 12,
    format: 'CODE128'
  });

  useEffect(() => {
    if (itemCode) {
      generateCodes(itemCode);
    } else {
      // Check if item has an existing barcode code
      checkExistingCode();
    }
  }, [itemCode, itemId]);

  const checkExistingCode = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('barcode')
        .eq('id', itemId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing code:', error);
        return;
      }

      if (data?.barcode) {
        // Use existing barcode code
        generateCodes(data.barcode);
      }
    } catch (error) {
      console.error('Error checking existing code:', error);
    }
  };

  const saveCodeToDatabase = async (code: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ 
          barcode: code,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      console.log('Code saved to database:', code);
    } catch (error: any) {
      console.error('Error saving code to database:', error);
      toast({
        title: 'Warning',
        description: 'Code generated but not saved to database.',
        variant: 'destructive'
      });
    }
  };

  const generateCodes = async (code?: string) => {
    setLoading(true);
    try {
      const finalCode = code || generateUniqueCode(prefix, itemId);
      
      const [qrCodeDataUrl, barcodeDataUrl] = await Promise.all([
        generateQRCode(finalCode, qrConfig),
        Promise.resolve(generateBarcode(finalCode, barcodeConfig))
      ]);

      const newGeneratedCode: GeneratedCode = {
        itemId,
        itemName,
        code: finalCode,
        qrCodeDataUrl,
        barcodeDataUrl,
        prefix,
        generatedAt: new Date().toISOString()
      };

      setGeneratedCode(newGeneratedCode);
      
      // Save code to database if it's a new code
      if (!code) {
        await saveCodeToDatabase(finalCode);
      }
      
      onCodeGenerated?.(finalCode);
    } catch (error: any) {
      console.error('Error generating codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code and barcode.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
      toast({
        title: 'Copied',
        description: 'Code copied to clipboard.'
      });
    }
  };

  const handleDownloadQR = () => {
    if (generatedCode) {
      const link = document.createElement('a');
      link.href = generatedCode.qrCodeDataUrl;
      link.download = `${itemName}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadBarcode = () => {
    if (generatedCode) {
      const link = document.createElement('a');
      link.href = generatedCode.barcodeDataUrl;
      link.download = `${itemName}-barcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const convertToLabelData = (): LabelData | null => {
    if (!generatedCode) return null;
    
    return {
      itemId: generatedCode.itemId,
      itemName: generatedCode.itemName,
      itemCode: generatedCode.code,
      qrCodeDataUrl: generatedCode.qrCodeDataUrl,
      barcodeDataUrl: generatedCode.barcodeDataUrl,
      category: undefined, // Could be fetched if needed
      location: undefined, // Could be fetched if needed
      serialNumber: undefined // Could be fetched if needed
    };
  };

  const handlePrintLabel = () => {
    if (generatedCode) {
      setShowPrintDialog(true);
    }
  };

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code & Barcode
        </CardTitle>
        <CardDescription>
          Unique identification codes for this inventory item
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Generating codes...</span>
          </div>
        ) : generatedCode ? (
          <>
            {/* Code Display */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-mono text-sm">{generatedCode.code}</p>
                <Badge variant="outline" className="mt-1">
                  {generatedCode.prefix}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Codes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* QR Code */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <QrCode className="h-4 w-4" />
                  <span className="text-sm font-medium">QR Code</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <img
                    src={generatedCode.qrCodeDataUrl}
                    alt="QR Code"
                    className="w-24 h-24 mx-auto"
                  />
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                    <Download className="h-3 w-3 mr-1" />
                    QR
                  </Button>
                </div>
              </div>

              {/* Barcode */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Barcode className="h-4 w-4" />
                  <span className="text-sm font-medium">Barcode</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <img
                    src={generatedCode.barcodeDataUrl}
                    alt="Barcode"
                    className="h-16 mx-auto"
                  />
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleDownloadBarcode}>
                    <Download className="h-3 w-3 mr-1" />
                    BC
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowFullView(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Full View
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintLabel}>
                <Printer className="h-4 w-4 mr-2" />
                Print Label
              </Button>
              <Button variant="outline" size="sm" onClick={() => generateCodes()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No codes generated yet</p>
            <Button onClick={() => generateCodes()}>
              <QrCode className="h-4 w-4 mr-2" />
              Generate Codes
            </Button>
          </div>
        )}

        {/* Full View Dialog */}
        <Dialog open={showFullView} onOpenChange={setShowFullView}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>QR Code & Barcode - {itemName}</DialogTitle>
              <DialogDescription>
                High-resolution codes for printing and scanning
              </DialogDescription>
            </DialogHeader>
            
            {generatedCode && (
              <div className="space-y-6">
                {/* Code Info */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-lg font-semibold">{generatedCode.code}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{generatedCode.prefix}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Generated: {new Date(generatedCode.generatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Large QR Code */}
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">QR Code</h3>
                  <div className="bg-white p-4 rounded border inline-block">
                    <img
                      src={generatedCode.qrCodeDataUrl}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <Button onClick={handleDownloadQR}>
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>

                <Separator />

                {/* Large Barcode */}
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Barcode</h3>
                  <div className="bg-white p-4 rounded border inline-block">
                    <img
                      src={generatedCode.barcodeDataUrl}
                      alt="Barcode"
                      className="h-24"
                    />
                  </div>
                  <Button onClick={handleDownloadBarcode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Barcode
                  </Button>
                </div>

                <Separator />

                {/* Print Actions */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Print Labels</h3>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={() => {
                      import('@/utils/qr-barcode-utils').then(({ printLabels, generateLabelData }) => {
                        const labelData = generateLabelData(
                          { id: itemId, name: itemName },
                          generatedCode.code,
                          generatedCode.qrCodeDataUrl,
                          generatedCode.barcodeDataUrl
                        );
                        printLabels([labelData], 'small');
                      });
                    }}>
                      Small Label
                    </Button>
                    <Button variant="outline" onClick={handlePrintLabel}>
                      Medium Label
                    </Button>
                    <Button variant="outline" onClick={() => {
                      import('@/utils/qr-barcode-utils').then(({ printLabels, generateLabelData }) => {
                        const labelData = generateLabelData(
                          { id: itemId, name: itemName },
                          generatedCode.code,
                          generatedCode.qrCodeDataUrl,
                          generatedCode.barcodeDataUrl
                        );
                        printLabels([labelData], 'large');
                      });
                    }}>
                      Large Label
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    
    {/* Label Print Dialog */}
    {convertToLabelData() && (
      <LabelPrintDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        labels={[convertToLabelData()!]}
        onPrintComplete={() => {
          toast({
            title: 'Print Complete',
            description: 'Label has been sent to printer.'
          });
        }}
      />
      )}
    </>
  );
};

export default QRCodeDisplay;

import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export interface QRCodeConfig {
  width?: number;
  height?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface BarcodeConfig {
  width?: number;
  height?: number;
  margin?: number;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  textPosition?: 'bottom' | 'top';
  textMargin?: number;
  background?: string;
  lineColor?: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14' | 'MSI' | 'pharmacode' | 'codabar';
}

export interface CodePrefix {
  id: string;
  name: string;
  prefix: string;
  description?: string;
  categoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedCode {
  itemId: string;
  itemName: string;
  code: string;
  qrCodeDataUrl: string;
  barcodeDataUrl: string;
  prefix: string;
  generatedAt: string;
}

/**
 * Generate QR code as data URL
 */
export const generateQRCode = async (
  data: string, 
  config: QRCodeConfig = {}
): Promise<string> => {
  const defaultConfig: QRCodeConfig = {
    width: 200,
    height: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M',
    ...config
  };

  try {
    return await QRCode.toDataURL(data, defaultConfig);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate barcode as data URL
 */
export const generateBarcode = (
  data: string,
  config: BarcodeConfig = {}
): string => {
  const defaultConfig: BarcodeConfig = {
    width: 2,
    height: 100,
    margin: 10,
    fontSize: 12,
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 2,
    background: '#FFFFFF',
    lineColor: '#000000',
    format: 'CODE128',
    ...config
  };

  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, data, defaultConfig);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw new Error('Failed to generate barcode');
  }
};

/**
 * Generate unique code with prefix
 */
export const generateUniqueCode = (
  prefix: string,
  itemId: string,
  timestamp?: number
): string => {
  const now = timestamp || Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${now.toString(36).toUpperCase()}-${randomSuffix}`;
};

/**
 * Parse code to extract prefix and data
 */
export const parseCode = (code: string): { prefix: string; data: string } | null => {
  const parts = code.split('-');
  if (parts.length >= 2) {
    return {
      prefix: parts[0],
      data: parts.slice(1).join('-')
    };
  }
  return null;
};

/**
 * Validate code format
 */
export const validateCode = (code: string, expectedPrefix?: string): boolean => {
  const parsed = parseCode(code);
  if (!parsed) return false;
  
  if (expectedPrefix && parsed.prefix !== expectedPrefix) {
    return false;
  }
  
  return parsed.prefix.length > 0 && parsed.data.length > 0;
};

/**
 * Generate codes for multiple items
 */
export const generateBulkCodes = async (
  items: Array<{ id: string; name: string; prefix: string }>,
  qrConfig?: QRCodeConfig,
  barcodeConfig?: BarcodeConfig
): Promise<GeneratedCode[]> => {
  const results: GeneratedCode[] = [];
  
  for (const item of items) {
    try {
      const code = generateUniqueCode(item.prefix, item.id);
      const [qrCodeDataUrl, barcodeDataUrl] = await Promise.all([
        generateQRCode(code, qrConfig),
        Promise.resolve(generateBarcode(code, barcodeConfig))
      ]);
      
      results.push({
        itemId: item.id,
        itemName: item.name,
        code,
        qrCodeDataUrl,
        barcodeDataUrl,
        prefix: item.prefix,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error generating codes for item ${item.id}:`, error);
      // Continue with other items even if one fails
    }
  }
  
  return results;
};

/**
 * Generate label data for printing
 */
export interface LabelData {
  itemName: string;
  itemCode: string;
  qrCodeDataUrl: string;
  barcodeDataUrl: string;
  category?: string;
  location?: string;
  serialNumber?: string;
  barcode?: string;
  generatedAt: string;
}

export const generateLabelData = (
  item: {
    id: string;
    name: string;
    serial_number?: string | null;
    barcode?: string | null;
    categoryName?: string;
    locationName?: string;
  },
  code: string,
  qrCodeDataUrl: string,
  barcodeDataUrl: string
): LabelData => {
  return {
    itemName: item.name,
    itemCode: code,
    qrCodeDataUrl,
    barcodeDataUrl,
    category: item.categoryName,
    location: item.locationName,
    serialNumber: item.serial_number || undefined,
    barcode: item.barcode || undefined,
    generatedAt: new Date().toISOString()
  };
};

/**
 * Print utilities
 */
export const printLabels = (labels: LabelData[], format: 'small' | 'medium' | 'large' = 'medium') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check your popup blocker.');
  }

  const styles = getPrintStyles(format);
  const content = generatePrintHTML(labels, styles);
  
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

const getPrintStyles = (format: string) => {
  const formats = {
    small: {
      labelWidth: '1.5in',
      labelHeight: '1in',
      fontSize: '8px',
      qrSize: '40px',
      barcodeHeight: '30px'
    },
    medium: {
      labelWidth: '2in',
      labelHeight: '1.5in',
      fontSize: '10px',
      qrSize: '60px',
      barcodeHeight: '40px'
    },
    large: {
      labelWidth: '3in',
      labelHeight: '2in',
      fontSize: '12px',
      qrSize: '80px',
      barcodeHeight: '50px'
    }
  };
  
  return formats[format as keyof typeof formats] || formats.medium;
};

const generatePrintHTML = (labels: LabelData[], styles: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Inventory Labels</title>
      <style>
        @page {
          margin: 0.5in;
          size: letter;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        
        .label-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(${styles.labelWidth}, 1fr));
          gap: 0.1in;
          padding: 0.1in;
        }
        
        .label {
          width: ${styles.labelWidth};
          height: ${styles.labelHeight};
          border: 1px solid #ccc;
          padding: 0.1in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-inside: avoid;
          font-size: ${styles.fontSize};
        }
        
        .label-header {
          text-align: center;
          font-weight: bold;
          margin-bottom: 0.05in;
        }
        
        .label-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
        }
        
        .label-codes {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.05in;
        }
        
        .label-info {
          display: flex;
          flex-direction: column;
          font-size: ${parseInt(styles.fontSize) - 2}px;
          color: #666;
        }
        
        .qr-code {
          width: ${styles.qrSize};
          height: ${styles.qrSize};
        }
        
        .barcode {
          height: ${styles.barcodeHeight};
        }
        
        .label-footer {
          text-align: center;
          font-size: ${parseInt(styles.fontSize) - 2}px;
          color: #999;
          margin-top: 0.05in;
        }
        
        @media print {
          .label-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      </style>
    </head>
    <body>
      <div class="label-grid">
        ${labels.map(label => `
          <div class="label">
            <div class="label-header">${label.itemName}</div>
            <div class="label-content">
              <div class="label-codes">
                <img src="${label.qrCodeDataUrl}" class="qr-code" alt="QR Code" />
                <img src="${label.barcodeDataUrl}" class="barcode" alt="Barcode" />
              </div>
              <div class="label-info">
                ${label.category ? `<div>Cat: ${label.category}</div>` : ''}
                ${label.location ? `<div>Loc: ${label.location}</div>` : ''}
                ${label.serialNumber ? `<div>SN: ${label.serialNumber}</div>` : ''}
                ${label.barcode ? `<div>BC: ${label.barcode}</div>` : ''}
              </div>
            </div>
            <div class="label-footer">${label.itemCode}</div>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
};

/**
 * Export codes to various formats
 */
export const exportCodes = (codes: GeneratedCode[], format: 'csv' | 'json' | 'pdf') => {
  switch (format) {
    case 'csv':
      exportToCSV(codes);
      break;
    case 'json':
      exportToJSON(codes);
      break;
    case 'pdf':
      // For PDF export, we'd need a PDF library like jsPDF
      console.warn('PDF export not implemented yet');
      break;
  }
};

const exportToCSV = (codes: GeneratedCode[]) => {
  const headers = ['Item ID', 'Item Name', 'Code', 'Prefix', 'Generated At'];
  const rows = codes.map(code => [
    code.itemId,
    code.itemName,
    code.code,
    code.prefix,
    code.generatedAt
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventory-codes-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportToJSON = (codes: GeneratedCode[]) => {
  const jsonContent = JSON.stringify(codes, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `inventory-codes-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

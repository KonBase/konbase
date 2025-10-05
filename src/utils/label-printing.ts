export interface LabelData {
  itemId: string;
  itemName: string;
  itemCode: string;
  qrCodeDataUrl: string;
  barcodeDataUrl: string;
  category?: string;
  location?: string;
  serialNumber?: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  description: string;
}

export const LABEL_TEMPLATES: LabelTemplate[] = [
  {
    id: 'small',
    name: 'Small Label (25x15mm)',
    width: 25,
    height: 15,
    description: 'Compact label for small items'
  },
  {
    id: 'medium',
    name: 'Medium Label (50x30mm)',
    width: 50,
    height: 30,
    description: 'Standard label for most items'
  },
  {
    id: 'large',
    name: 'Large Label (100x60mm)',
    width: 100,
    height: 60,
    description: 'Large label with detailed information'
  },
  {
    id: 'barcode-only',
    name: 'Barcode Only (50x20mm)',
    width: 50,
    height: 20,
    description: 'Minimal barcode label'
  },
  {
    id: 'qr-only',
    name: 'QR Only (30x30mm)',
    width: 30,
    height: 30,
    description: 'Square QR code label'
  }
];

export interface PrintOptions {
  template: string;
  copies: number;
  showItemName: boolean;
  showCode: boolean;
  showCategory: boolean;
  showLocation: boolean;
  showSerialNumber: boolean;
  fontSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  template: 'medium',
  copies: 1,
  showItemName: true,
  showCode: true,
  showCategory: false,
  showLocation: false,
  showSerialNumber: false,
  fontSize: 'medium',
  orientation: 'portrait'
};

// Convert mm to CSS pixels (assuming 96 DPI)
const mmToPx = (mm: number): number => (mm * 96) / 25.4;

// Generate CSS styles for label printing
export const generateLabelStyles = (template: LabelTemplate, options: PrintOptions): string => {
  const widthPx = mmToPx(template.width);
  const heightPx = mmToPx(template.height);
  
  // Calculate available space after padding
  const paddingPx = mmToPx(2); // 2mm padding
  const availableWidth = widthPx - (paddingPx * 2);
  const availableHeight = heightPx - (paddingPx * 2);
  
  const fontSizeMap = {
    small: '5px',
    medium: '6px',
    large: '8px'
  };
  
  const fontSize = fontSizeMap[options.fontSize];
  
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    @page {
      size: ${template.width}mm ${template.height}mm;
      margin: 0;
    }
    
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${widthPx}px !important;
        height: ${heightPx}px !important;
        font-family: Arial, sans-serif;
        font-size: ${fontSize};
        line-height: 1;
        background: white;
        overflow: hidden;
      }
      
      .label-container {
        width: ${widthPx}px !important;
        height: ${heightPx}px !important;
        border: none;
        padding: ${paddingPx}px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
        background: white;
        position: relative;
      }
      
      .label-header {
        font-weight: bold;
        text-align: center;
        font-size: ${fontSize};
        line-height: 1;
        margin-bottom: 2px;
        width: 100%;
        height: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }
      
      .label-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        gap: 2px;
        overflow: hidden;
      }
      
      .label-code {
        font-family: 'Courier New', monospace;
        font-weight: bold;
        text-align: center;
        font-size: ${fontSize};
        line-height: 1;
        margin: 0;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }
      
      .label-qr {
        max-width: ${availableWidth * 0.8}px;
        max-height: ${availableHeight * 0.6}px;
        width: auto;
        height: auto;
        object-fit: contain;
        flex-shrink: 1;
      }
      
      .label-barcode {
        max-width: ${availableWidth * 0.9}px;
        max-height: ${availableHeight * 0.3}px;
        width: auto;
        height: auto;
        object-fit: contain;
        flex-shrink: 1;
      }
      
      .label-footer {
        font-size: ${options.fontSize === 'small' ? '3px' : options.fontSize === 'medium' ? '4px' : '5px'};
        text-align: center;
        line-height: 1;
        margin-top: 2px;
        width: 100%;
        height: auto;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    @media screen {
      html, body {
        margin: 0;
        padding: 20px;
        font-family: Arial, sans-serif;
        background: #f5f5f5;
      }
      
      .label-container {
        width: ${widthPx}px;
        height: ${heightPx}px;
        border: 1px solid #ccc;
        padding: ${paddingPx}px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        background: white;
        margin: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      
      .label-header {
        font-weight: bold;
        text-align: center;
        font-size: ${fontSize};
        line-height: 1;
        margin-bottom: 2px;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }
      
      .label-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        gap: 2px;
        overflow: hidden;
      }
      
      .label-code {
        font-family: 'Courier New', monospace;
        font-weight: bold;
        text-align: center;
        font-size: ${fontSize};
        line-height: 1;
        margin: 0;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }
      
      .label-qr {
        max-width: ${availableWidth * 0.8}px;
        max-height: ${availableHeight * 0.6}px;
        width: auto;
        height: auto;
        object-fit: contain;
        flex-shrink: 1;
      }
      
      .label-barcode {
        max-width: ${availableWidth * 0.9}px;
        max-height: ${availableHeight * 0.3}px;
        width: auto;
        height: auto;
        object-fit: contain;
        flex-shrink: 1;
      }
      
      .label-footer {
        font-size: ${options.fontSize === 'small' ? '3px' : options.fontSize === 'medium' ? '4px' : '5px'};
        text-align: center;
        line-height: 1;
        margin-top: 2px;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }
    }
  `;
};

// Generate HTML for a single label
export const generateLabelHTML = (data: LabelData, template: LabelTemplate, options: PrintOptions): string => {
  const styles = generateLabelStyles(template, options);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Label - ${data.itemName}</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="label-container">
        ${options.showItemName ? `<div class="label-header">${data.itemName}</div>` : ''}
        
        <div class="label-content">
          ${template.id === 'qr-only' ? `
            <img src="${data.qrCodeDataUrl}" alt="QR Code" class="label-qr">
          ` : template.id === 'barcode-only' ? `
            <img src="${data.barcodeDataUrl}" alt="Barcode" class="label-barcode">
          ` : `
            <img src="${data.qrCodeDataUrl}" alt="QR Code" class="label-qr">
            <img src="${data.barcodeDataUrl}" alt="Barcode" class="label-barcode">
          `}
          
          ${options.showCode ? `<div class="label-code">${data.itemCode}</div>` : ''}
        </div>
        
        <div class="label-footer">
          ${options.showCategory && data.category ? `<div>${data.category}</div>` : ''}
          ${options.showLocation && data.location ? `<div>${data.location}</div>` : ''}
          ${options.showSerialNumber && data.serialNumber ? `<div>SN: ${data.serialNumber}</div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate HTML for multiple labels
export const generateMultipleLabelsHTML = (
  labels: LabelData[], 
  template: LabelTemplate, 
  options: PrintOptions
): string => {
  const styles = generateLabelStyles(template, options);
  
  const labelHTML = labels.map(data => {
    return `
      <div class="label-container">
        ${options.showItemName ? `<div class="label-header">${data.itemName}</div>` : ''}
        
        <div class="label-content">
          ${template.id === 'qr-only' ? `
            <img src="${data.qrCodeDataUrl}" alt="QR Code" class="label-qr">
          ` : template.id === 'barcode-only' ? `
            <img src="${data.barcodeDataUrl}" alt="Barcode" class="label-barcode">
          ` : `
            <img src="${data.qrCodeDataUrl}" alt="QR Code" class="label-qr">
            <img src="${data.barcodeDataUrl}" alt="Barcode" class="label-barcode">
          `}
          
          ${options.showCode ? `<div class="label-code">${data.itemCode}</div>` : ''}
        </div>
        
        <div class="label-footer">
          ${options.showCategory && data.category ? `<div>${data.category}</div>` : ''}
          ${options.showLocation && data.location ? `<div>${data.location}</div>` : ''}
          ${options.showSerialNumber && data.serialNumber ? `<div>SN: ${data.serialNumber}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Labels - ${labels.length} items</title>
      <style>${styles}</style>
    </head>
    <body>
      ${labelHTML}
    </body>
    </html>
  `;
};

// Print labels using browser's print functionality
export const printLabels = async (
  labels: LabelData[], 
  template: LabelTemplate, 
  options: PrintOptions
): Promise<void> => {
  try {
    const html = labels.length === 1 
      ? generateLabelHTML(labels[0], template, options)
      : generateMultipleLabelsHTML(labels, template, options);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow popups for this site.');
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for images to load
    await new Promise<void>((resolve) => {
      const images = printWindow.document.querySelectorAll('img');
      let loadedCount = 0;
      
      if (images.length === 0) {
        resolve();
        return;
      }
      
      const checkLoaded = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          resolve();
        }
      };
      
      images.forEach(img => {
        if (img.complete) {
          checkLoaded();
        } else {
          img.onload = checkLoaded;
          img.onerror = checkLoaded;
        }
      });
    });
    
    // Add print-specific styles for better formatting
    const printStyles = `
      <style>
        @media print {
          @page {
            size: ${template.width}mm ${template.height}mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${mmToPx(template.width)}px !important;
            height: ${mmToPx(template.height)}px !important;
            overflow: hidden !important;
          }
          .label-container {
            width: ${mmToPx(template.width)}px !important;
            height: ${mmToPx(template.height)}px !important;
            margin: 0 !important;
            padding: ${mmToPx(2)}px !important;
            overflow: hidden !important;
          }
        }
      </style>
    `;
    
    printWindow.document.head.insertAdjacentHTML('beforeend', printStyles);
    
    // Wait a bit more for styles to apply
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trigger print dialog
    printWindow.focus();
    printWindow.print();
    
    // Close window after printing (with delay to allow print dialog to appear)
    setTimeout(() => {
      printWindow.close();
    }, 2000);
    
  } catch (error) {
    console.error('Print error:', error);
    throw new Error(`Failed to print labels: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Download labels as PDF using browser's print-to-PDF functionality
export const downloadLabelsAsPDF = async (
  labels: LabelData[], 
  template: LabelTemplate, 
  options: PrintOptions
): Promise<void> => {
  try {
    const html = labels.length === 1 
      ? generateLabelHTML(labels[0], template, options)
      : generateMultipleLabelsHTML(labels, template, options);
    
    // Create a new window for PDF generation
    const pdfWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (!pdfWindow) {
      throw new Error('Unable to open PDF window. Please allow popups for this site.');
    }
    
    pdfWindow.document.write(html);
    pdfWindow.document.close();
    
    // Wait for images to load
    await new Promise<void>((resolve) => {
      const images = pdfWindow.document.querySelectorAll('img');
      let loadedCount = 0;
      
      if (images.length === 0) {
        resolve();
        return;
      }
      
      const checkLoaded = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          resolve();
        }
      };
      
      images.forEach(img => {
        if (img.complete) {
          checkLoaded();
        } else {
          img.onload = checkLoaded;
          img.onerror = checkLoaded;
        }
      });
    });
    
    // Add additional PDF-specific styles for better formatting
    const pdfStyles = `
      <style>
        @media print {
          @page {
            size: ${template.width}mm ${template.height}mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${mmToPx(template.width)}px !important;
            height: ${mmToPx(template.height)}px !important;
            overflow: hidden !important;
          }
          .label-container {
            width: ${mmToPx(template.width)}px !important;
            height: ${mmToPx(template.height)}px !important;
            margin: 0 !important;
            padding: ${mmToPx(2)}px !important;
            overflow: hidden !important;
          }
        }
      </style>
    `;
    
    pdfWindow.document.head.insertAdjacentHTML('beforeend', pdfStyles);
    
    // Wait a bit more for styles to apply
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trigger print dialog with PDF option
    pdfWindow.focus();
    pdfWindow.print();
    
    // Close window after PDF generation (longer delay for PDF)
    setTimeout(() => {
      pdfWindow.close();
    }, 3000);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Alternative PDF generation using blob and download
export const downloadLabelsAsPDFBlob = async (
  labels: LabelData[], 
  template: LabelTemplate, 
  options: PrintOptions
): Promise<void> => {
  try {
    const html = labels.length === 1 
      ? generateLabelHTML(labels[0], template, options)
      : generateMultipleLabelsHTML(labels, template, options);
    
    // Create a blob with the HTML content
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link to download the HTML file
    const link = document.createElement('a');
    link.href = url;
    link.download = `labels-${labels.length}-items-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('PDF blob generation error:', error);
    throw new Error(`Failed to generate PDF blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Validate print options
export const validatePrintOptions = (options: Partial<PrintOptions>): PrintOptions => {
  return {
    ...DEFAULT_PRINT_OPTIONS,
    ...options,
    copies: Math.max(1, Math.min(100, options.copies || 1)), // Limit copies between 1-100
  };
};

// Get template by ID
export const getTemplateById = (id: string): LabelTemplate | undefined => {
  return LABEL_TEMPLATES.find(template => template.id === id);
};

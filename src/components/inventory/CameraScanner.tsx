import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, RotateCcw, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import CameraPermissionHelp from './CameraPermissionHelp';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: string) => void;
  onScanError?: (error: string) => void;
  title?: string;
  description?: string;
}

const CameraScanner: React.FC<CameraScannerProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
  title = "Scan QR Code / Barcode",
  description = "Position the code within the camera view to scan"
}) => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    } else {
      cleanupScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      if (!navigator.permissions) {
        // Fallback for browsers that don't support permissions API
        setPermissionStatus('unknown');
        initializeScanner();
        return;
      }

      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissionStatus(permission.state);

      if (permission.state === 'granted') {
        initializeScanner();
      } else if (permission.state === 'denied') {
        setError('Camera access is blocked. Please enable camera permissions in your browser settings.');
      } else {
        // Permission state is 'prompt' - we'll request it when initializing
        initializeScanner();
      }

      // Listen for permission changes
      permission.addEventListener('change', () => {
        setPermissionStatus(permission.state);
        if (permission.state === 'granted' && !isScanning) {
          initializeScanner();
        }
      });
    } catch (err) {
      console.warn('Could not check camera permission:', err);
      setPermissionStatus('unknown');
      initializeScanner();
    }
  };

  const requestCameraPermission = async () => {
    setIsRequestingPermission(true);
    setError(null);

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus('granted');
      initializeScanner();
    } catch (err: any) {
      console.error('Camera permission request failed:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
        setPermissionStatus('denied');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
        setPermissionStatus('denied');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported on this device.');
        setPermissionStatus('denied');
      } else {
        setError(`Failed to access camera: ${err.message}`);
        setPermissionStatus('denied');
      }
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const initializeScanner = () => {
    if (!scannerRef.current) return;

    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported on this device');
        return;
      }

      // If permission is denied, don't try to initialize
      if (permissionStatus === 'denied') {
        setError('Camera access is blocked. Please enable camera permissions in your browser settings.');
        return;
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        useBarCodeDetectorIfSupported: true
      };

      const newScanner = new Html5QrcodeScanner(
        scannerRef.current.id,
        config,
        false
      );

      newScanner.render(
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (error) => {
          // Only show error if it's not a "No QR code found" error
          if (!error.includes('No QR code found') && !error.includes('NotFoundException')) {
            console.warn('Scanner error:', error);
            // Don't set error state for common scanning errors
          }
        }
      );

      setScanner(newScanner);
      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Scanner initialization error:', err);
      if (err.message.includes('Permission denied') || err.message.includes('NotAllowedError')) {
        setError('Camera permission denied. Please allow camera access and try again.');
        setPermissionStatus('denied');
      } else if (err.message.includes('NotFoundError')) {
        setError('No camera found on this device.');
      } else {
        setError(`Failed to initialize camera: ${err.message}`);
      }
    }
  };

  const cleanupScanner = () => {
    if (scanner) {
      try {
        scanner.clear();
      } catch (err) {
        console.warn('Error clearing scanner:', err);
      }
      setScanner(null);
    }
    setIsScanning(false);
    setError(null);
  };

  const handleScanSuccess = (result: string) => {
    setLastScannedCode(result);
    onScanSuccess(result);
    
    // Auto-close after successful scan (optional)
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleRetry = () => {
    setError(null);
    setLastScannedCode(null);
    cleanupScanner();
    // Re-check permissions and try again
    setTimeout(() => {
      checkCameraPermission();
    }, 100);
  };

  const handleClose = () => {
    cleanupScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner Container */}
          <div className="relative">
            <div 
              id="qr-scanner" 
              ref={scannerRef}
              className="w-full h-64 bg-black rounded-lg flex items-center justify-center"
            >
              {!isScanning && !error && (
                <div className="text-white text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Initializing camera...</p>
                </div>
              )}
            </div>

            {/* Success Overlay */}
            {lastScannedCode && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-semibold">Code Scanned!</p>
                  <p className="text-sm opacity-90">{lastScannedCode}</p>
                </div>
              </div>
            )}
          </div>

          {/* Permission Status */}
          {permissionStatus === 'denied' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Camera access is blocked. Please enable camera permissions in your browser settings and refresh the page.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelpDialog(true)}
                  className="ml-2 h-6 w-6 p-0"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {permissionStatus === 'prompt' && !isScanning && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Camera permission is required to scan codes. Click the button below to request access.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Permission Request Button */}
          {permissionStatus === 'prompt' && !isScanning && (
            <div className="text-center">
              <Button 
                onClick={requestCameraPermission}
                disabled={isRequestingPermission}
                className="w-full"
              >
                {isRequestingPermission ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Requesting Permission...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Allow Camera Access
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Supported formats:</strong></p>
            <p>QR Code, Code 128, Code 39, EAN-13, EAN-8, UPC-A, UPC-E, Codabar, ITF</p>
            <p className="mt-2"><strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure good lighting</li>
              <li>Hold device steady</li>
              <li>Position code within the frame</li>
              <li>Keep code flat and unobstructed</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isScanning && !error}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Help Dialog */}
      <CameraPermissionHelp 
        isOpen={showHelpDialog} 
        onClose={() => setShowHelpDialog(false)} 
      />
    </Dialog>
  );
};

export default CameraScanner;

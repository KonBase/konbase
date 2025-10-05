import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, ExternalLink, Monitor } from 'lucide-react';

interface CameraPermissionHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const CameraPermissionHelp: React.FC<CameraPermissionHelpProps> = ({ isOpen, onClose }) => {
  const getBrowserIcon = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return <Monitor className="h-4 w-4" />;
    if (userAgent.includes('firefox')) return <Monitor className="h-4 w-4" />;
    if (userAgent.includes('safari')) return <Monitor className="h-4 w-4" />;
    if (userAgent.includes('edge')) return <Monitor className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return (
        <div className="space-y-2">
          <p><strong>Chrome:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click the camera icon in the address bar</li>
            <li>Select "Allow" for camera access</li>
            <li>Or go to Settings → Privacy and security → Site settings → Camera</li>
            <li>Add this site to the "Allow" list</li>
          </ol>
        </div>
      );
    }
    
    if (userAgent.includes('firefox')) {
      return (
        <div className="space-y-2">
          <p><strong>Firefox:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click the shield icon in the address bar</li>
            <li>Click "Allow" for camera permissions</li>
            <li>Or go to Preferences → Privacy & Security → Permissions → Camera</li>
            <li>Add this site to the exceptions list</li>
          </ol>
        </div>
      );
    }
    
    if (userAgent.includes('safari')) {
      return (
        <div className="space-y-2">
          <p><strong>Safari:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go to Safari → Settings → Websites → Camera</li>
            <li>Find this website in the list</li>
            <li>Set it to "Allow"</li>
            <li>Refresh the page</li>
          </ol>
        </div>
      );
    }
    
    if (userAgent.includes('edge')) {
      return (
        <div className="space-y-2">
          <p><strong>Edge:</strong></p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click the camera icon in the address bar</li>
            <li>Select "Allow" for camera access</li>
            <li>Or go to Settings → Site permissions → Camera</li>
            <li>Add this site to the "Allow" list</li>
          </ol>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        <p><strong>General Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Look for a camera icon in your browser's address bar</li>
          <li>Click it and select "Allow" for camera access</li>
          <li>Or check your browser's privacy/security settings</li>
          <li>Enable camera permissions for this website</li>
        </ol>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getBrowserIcon()}
            Enable Camera Access
          </DialogTitle>
          <DialogDescription>
            Follow these steps to enable camera permissions for scanning QR codes and barcodes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera access is required to scan QR codes and barcodes. This permission is only used for scanning and is not stored or transmitted.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            {getBrowserInstructions()}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Still having trouble?</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Make sure your device has a working camera</li>
              <li>Try refreshing the page after enabling permissions</li>
              <li>Check if other websites can access your camera</li>
              <li>Try using a different browser</li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraPermissionHelp;

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, Camera, X, CheckCircle } from 'lucide-react';
import CameraScanner from '../inventory/CameraScanner';

interface SearchBarWithScannerProps {
  onSearch: (query: string) => void;
  onScanResult?: (result: string) => void;
  placeholder?: string;
  className?: string;
  showScanner?: boolean;
  recentSearches?: string[];
  onClearRecent?: () => void;
}

const SearchBarWithScanner: React.FC<SearchBarWithScannerProps> = ({
  onSearch,
  onScanResult,
  placeholder = "Search items...",
  className = "",
  showScanner = true,
  recentSearches = [],
  onClearRecent
}) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lastScannedCode) {
      setQuery(lastScannedCode);
      onSearch(lastScannedCode);
      onScanResult?.(lastScannedCode);
      
      // Clear the scanned code after a delay
      setTimeout(() => {
        setLastScannedCode(null);
      }, 3000);
    }
  }, [lastScannedCode, onSearch, onScanResult]);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowRecent(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowRecent(false);
    }
  };

  const handleScanSuccess = (result: string) => {
    setLastScannedCode(result);
    setIsScannerOpen(false);
    
    toast({
      title: 'Code Scanned',
      description: `Scanned: ${result}`,
    });
  };

  const handleScanError = (error: string) => {
    toast({
      title: 'Scan Error',
      description: error,
      variant: 'destructive'
    });
  };

  const handleRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  const handleClearSearch = () => {
    setQuery('');
    setShowRecent(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowRecent(recentSearches.length > 0)}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        
        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {showScanner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsScannerOpen(true)}
              className="h-6 w-6 p-0"
              title="Scan QR Code / Barcode"
            >
              <Camera className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSearch()}
            className="h-6 w-6 p-0"
            disabled={!query.trim()}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Scanned Code Indicator */}
      {lastScannedCode && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-green-50 border border-green-200 rounded-md shadow-sm">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Scanned:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {lastScannedCode}
            </Badge>
          </div>
        </div>
      )}

      {/* Recent Searches Dropdown */}
      {showRecent && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Recent Searches</span>
              {onClearRecent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearRecent}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {recentSearches.map((recentQuery, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearch(recentQuery)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Search className="h-3 w-3 text-gray-400" />
                <span className="truncate">{recentQuery}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera Scanner */}
      <CameraScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        title="Scan Item Code"
        description="Position the QR code or barcode within the camera view"
      />
    </div>
  );
};

export default SearchBarWithScanner;

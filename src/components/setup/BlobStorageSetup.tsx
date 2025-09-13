import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  Link,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Upload,
  Settings,
  Cloud,
  Folder,
} from 'lucide-react';

interface BlobStorageSetupProps {
  onStatusChange?: (ready: boolean) => void;
}

interface BlobStorageStatus {
  success: boolean;
  configured: boolean;
  storageType: 'vercel-blob' | 'local' | 'unknown';
  health: {
    status: 'healthy' | 'unhealthy';
    latency?: number;
  };
  message: string;
  latency?: number;
  hasData: boolean;
}

export const BlobStorageSetup: React.FC<BlobStorageSetupProps> = ({
  onStatusChange,
}) => {
  const [status, setStatus] = useState<BlobStorageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBlobStorage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/check-blob-storage');
      const data = await response.json();

      if (response.ok) {
        setStatus(data);
        onStatusChange?.(data.success && data.configured);
      } else {
        setError(data.message || 'Failed to check blob storage configuration');
        onStatusChange?.(false);
      }
    } catch {
      setError('Network error while checking blob storage');
      onStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    checkBlobStorage();
  }, [checkBlobStorage]);

  const getStatusIcon = () => {
    if (loading) return <CircularProgress size={20} />;
    if (!status) return <AlertCircle className='w-5 h-5 text-gray-400' />;
    if (status.success && status.configured)
      return <CheckCircle className='w-5 h-5 text-green-500' />;
    if (status.configured)
      return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
    return <AlertCircle className='w-5 h-5 text-red-500' />;
  };

  const getStatusColor = () => {
    if (loading) return 'default';
    if (!status) return 'default';
    if (status.success && status.configured) return 'success';
    if (status.configured) return 'warning';
    return 'error';
  };

  const getStorageTypeIcon = () => {
    if (status?.storageType === 'vercel-blob') {
      return <Cloud className='w-4 h-4' />;
    }
    return <Folder className='w-4 h-4' />;
  };

  const getStorageTypeLabel = () => {
    if (status?.storageType === 'vercel-blob') {
      return 'Vercel Blob';
    }
    return 'Local Storage';
  };

  return (
    <Box>
      <Box display='flex' alignItems='center' gap={2} mb={3}>
        <Upload className='w-6 h-6 text-blue-500' />
        <Typography variant='h6' component='h2'>
          File Storage Configuration
        </Typography>
        <Chip
          icon={getStorageTypeIcon()}
          label={getStorageTypeLabel()}
          color={
            getStatusColor() as
              | 'default'
              | 'primary'
              | 'secondary'
              | 'error'
              | 'info'
              | 'success'
              | 'warning'
          }
          size='small'
        />
      </Box>

      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Box display='flex' alignItems='center' gap={2} mb={2}>
            {getStatusIcon()}
            <Typography variant='subtitle1' fontWeight='medium'>
              Storage Status
            </Typography>
          </Box>

          {status && (
            <Box mb={2}>
              <Typography variant='body2' color='text.secondary' mb={1}>
                {status.message}
              </Typography>

              {status.health.latency && (
                <Typography variant='caption' color='text.secondary'>
                  Response time: {status.health.latency}ms
                </Typography>
              )}
            </Box>
          )}

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant='outlined'
            onClick={checkBlobStorage}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={16} />
              ) : (
                <Settings className='w-4 h-4' />
              )
            }
          >
            {loading ? 'Checking...' : 'Test Connection'}
          </Button>
        </CardContent>
      </Card>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='subtitle1' fontWeight='medium' mb={2}>
            Storage Options
          </Typography>

          <Box mb={3}>
            <Box display='flex' alignItems='center' gap={2} mb={1}>
              <Cloud className='w-5 h-5 text-blue-500' />
              <Typography variant='subtitle2' fontWeight='medium'>
                Vercel Blob (Recommended)
              </Typography>
              <Chip label='Ultra-fast' color='primary' size='small' />
            </Box>
            <Typography variant='body2' color='text.secondary' mb={2}>
              Global edge storage with &lt; 15ms latency. Perfect for production
              applications.
            </Typography>

            <Box mb={2}>
              <Typography variant='body2' fontWeight='medium' mb={1}>
                Setup Steps:
              </Typography>
              <Box component='ol' pl={2}>
                <Typography
                  component='li'
                  variant='body2'
                  color='text.secondary'
                >
                  Go to your{' '}
                  <Link
                    href='https://vercel.com/dashboard/storage'
                    target='_blank'
                    rel='noopener noreferrer'
                    display='inline-flex'
                    alignItems='center'
                    gap={0.5}
                  >
                    Vercel Storage dashboard
                    <ExternalLink className='w-3 h-3' />
                  </Link>
                </Typography>
                <Typography
                  component='li'
                  variant='body2'
                  color='text.secondary'
                >
                  Create a new Blob store
                </Typography>
                <Typography
                  component='li'
                  variant='body2'
                  color='text.secondary'
                >
                  Copy the Blob Read/Write Token
                </Typography>
                <Typography
                  component='li'
                  variant='body2'
                  color='text.secondary'
                >
                  Set the <code>BLOB_READ_WRITE_TOKEN</code> environment
                  variable
                </Typography>
              </Box>
            </Box>

            <Alert severity='info' sx={{ mb: 2 }}>
              <Typography variant='body2'>
                <strong>Environment Variable:</strong>
                <br />
                <code>BLOB_READ_WRITE_TOKEN=your-blob-read-write-token</code>
              </Typography>
            </Alert>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Box display='flex' alignItems='center' gap={2} mb={1}>
              <Folder className='w-5 h-5 text-gray-500' />
              <Typography variant='subtitle2' fontWeight='medium'>
                Local Storage (Development)
              </Typography>
              <Chip label='Default' color='default' size='small' />
            </Box>
            <Typography variant='body2' color='text.secondary' mb={2}>
              Files stored locally in the <code>/uploads</code> directory. Good
              for development and testing.
            </Typography>

            <Alert severity='warning'>
              <Typography variant='body2'>
                Local storage is not recommended for production deployments as
                files may be lost during deployments.
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>

      <Box mt={3} p={2} bgcolor='grey.50' borderRadius={1}>
        <Box display='flex' alignItems='center' gap={1} mb={1}>
          <Info className='w-4 h-4 text-blue-500' />
          <Typography variant='body2' fontWeight='medium'>
            Storage Features
          </Typography>
        </Box>
        <Box component='ul' pl={2}>
          <Typography component='li' variant='body2' color='text.secondary'>
            Automatic file organization by association and type
          </Typography>
          <Typography component='li' variant='body2' color='text.secondary'>
            Support for images, documents, and other file types
          </Typography>
          <Typography component='li' variant='body2' color='text.secondary'>
            Built-in caching and CDN distribution (Vercel Blob)
          </Typography>
          <Typography component='li' variant='body2' color='text.secondary'>
            Secure file access with proper permissions
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

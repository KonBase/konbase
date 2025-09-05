import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Link,
} from '@mui/material';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Zap,
  Database,
  Settings,
} from 'lucide-react';

interface EdgeConfigStatus {
  success: boolean;
  configured: boolean;
  message: string;
  latency?: number;
  hasData?: boolean;
  recommendations?: string[];
  error?: string;
}

interface EdgeConfigSetupProps {
  onStatusChange?: (ready: boolean) => void;
}

export const EdgeConfigSetup: React.FC<EdgeConfigSetupProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<EdgeConfigStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const checkEdgeConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/setup/check-edge-config');
      const data = await response.json();
      setStatus(data);
      
      // Notify parent component of status change
      if (onStatusChange) {
        onStatusChange(data.success && data.configured);
      }
    } catch (error) {
      const errorStatus = {
        success: false,
        configured: false,
        message: 'Failed to check Edge Config status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setStatus(errorStatus);
      
      if (onStatusChange) {
        onStatusChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('/api/setup/check-edge-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-connection' })
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus(prev => prev ? {
          ...prev,
          success: true,
          latency: data.latency,
          message: 'Connection test successful'
        } : null);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  const getStatusIcon = () => {
    if (!status) return <Info size={20} />;
    if (status.success) return <CheckCircle size={20} color="#4caf50" />;
    if (status.configured) return <AlertTriangle size={20} color="#ff9800" />;
    return <AlertCircle size={20} color="#f44336" />;
  };

  const getStatusColor = () => {
    if (!status) return 'info';
    if (status.success) return 'success';
    if (status.configured) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Database size={24} color="#1976d2" />
          <Typography variant="h6">Vercel Edge Config</Typography>
          <Chip 
            label="Ultra-fast" 
            size="small" 
            color="primary" 
            icon={<Zap size={14} />}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Edge Config provides ultra-low latency data access (&lt; 15ms) for configuration data, 
          feature flags, and small datasets. Perfect for KonBase's configuration needs.
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="contained"
            onClick={checkEdgeConfig}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Settings size={16} />}
          >
            Check Configuration
          </Button>
          
          {status?.configured && (
            <Button
              variant="outlined"
              onClick={testConnection}
              disabled={testingConnection}
              startIcon={testingConnection ? <CircularProgress size={16} /> : <Zap size={16} />}
            >
              Test Connection
            </Button>
          )}
        </Box>

        {status && (
          <Alert severity={getStatusColor() as any} sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {getStatusIcon()}
              <Typography variant="subtitle2">
                {status.success ? 'Edge Config Ready' : 'Configuration Issue'}
              </Typography>
            </Box>
            <Typography variant="body2">{status.message}</Typography>
            
            {status.latency && (
              <Typography variant="caption" display="block" mt={1}>
                Response time: {status.latency}ms
              </Typography>
            )}
          </Alert>
        )}

        {status?.recommendations && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Recommendations:
            </Typography>
            <List dense>
              {status.recommendations.map((rec, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon>
                    <Info size={16} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={rec}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Setup Instructions:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <ExternalLink size={16} />
              </ListItemIcon>
              <ListItemText 
                primary="Create Edge Config in Vercel Dashboard"
                secondary={
                  <Link 
                    href="https://vercel.com/docs/edge-config" 
                    target="_blank" 
                    rel="noopener"
                  >
                    View Documentation
                  </Link>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Settings size={16} />
              </ListItemIcon>
              <ListItemText 
                primary="Set EDGE_CONFIG_ID environment variable"
                secondary="Add your Edge Config ID to Vercel project settings"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Database size={16} />
              </ListItemIcon>
              <ListItemText 
                primary="Configure read access token"
                secondary="Ensure your Edge Config has proper permissions"
              />
            </ListItem>
          </List>
        </Box>

        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="caption" color="text.secondary">
            <strong>Benefits of Edge Config:</strong><br />
            • Ultra-low latency (&lt; 15ms at P99)<br />
            • Global edge distribution<br />
            • No database connection overhead<br />
            • Perfect for configuration data<br />
            • Built-in caching and optimization
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EdgeConfigSetup;

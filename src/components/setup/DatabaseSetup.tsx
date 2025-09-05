import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  AlertCircle,
  Database,
  Server,
  Shield,
  Clock,
  Zap,
  Cloud,
} from 'lucide-react';
import { EdgeConfigSetup } from './EdgeConfigSetup';

interface DatabaseSetupProps {
  onNext: (data: any) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const DatabaseSetup: React.FC<DatabaseSetupProps> = ({
  onNext,
  onError,
  loading,
  setLoading,
}) => {
  const [connectionString, setConnectionString] = useState('');
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [edgeConfigReady, setEdgeConfigReady] = useState(false);

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult('idle');
    setTestMessage('');

    try {
      const response = await fetch('/api/setup/test-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult('success');
        setTestMessage('Database connection successful!');
      } else {
        setTestResult('error');
        setTestMessage(result.error || 'Connection failed');
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage('Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedTab === 0 && testResult === 'success') {
      onNext({ 
        databaseType: 'postgresql',
        connectionString 
      });
    } else if (selectedTab === 1 && edgeConfigReady) {
      onNext({ 
        databaseType: 'edge-config',
        connectionString: 'edge-config'
      });
    } else {
      onError('Please configure and test your selected database option before proceeding');
    }
  };

  const handleEdgeConfigStatusChange = (ready: boolean) => {
    setEdgeConfigReady(ready);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Database Configuration
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Choose your database solution. KonBase supports PostgreSQL databases or Vercel Edge Config for ultra-fast data access.
      </Typography>

      <Tabs 
        value={selectedTab} 
        onChange={(_, newValue) => setSelectedTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab 
          label="PostgreSQL Database" 
          icon={<Database size={20} />}
          iconPosition="start"
        />
        <Tab 
          label="Vercel Edge Config" 
          icon={<Zap size={20} />}
          iconPosition="start"
        />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {selectedTab === 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                PostgreSQL Database Requirements
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Database size={20} />
                  </ListItemIcon>
                  <ListItemText primary="PostgreSQL 12 or higher" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Server size={20} />
                  </ListItemIcon>
                  <ListItemText primary="Minimum 1GB RAM" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Shield size={20} />
                  </ListItemIcon>
                  <ListItemText primary="SSL support recommended" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Clock size={20} />
                  </ListItemIcon>
                  <ListItemText primary="Regular backups configured" />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <TextField
            fullWidth
            label="Database Connection String"
            placeholder="postgresql://username:password@localhost:5432/konbase"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Format: postgresql://username:password@host:port/database"
          />

          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={!connectionString || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Database size={16} />}
            >
              Test Connection
            </Button>

            {testResult === 'success' && (
              <Chip
                icon={<CheckCircle size={16} />}
                label="Connection Successful"
                color="success"
                variant="outlined"
              />
            )}

            {testResult === 'error' && (
              <Chip
                icon={<AlertCircle size={16} />}
                label="Connection Failed"
                color="error"
                variant="outlined"
              />
            )}
          </Box>

          {testMessage && (
            <Alert
              severity={testResult === 'success' ? 'success' : 'error'}
              sx={{ mb: 3 }}
            >
              {testMessage}
            </Alert>
          )}
        </>
      )}

      {selectedTab === 1 && (
        <EdgeConfigSetup onStatusChange={handleEdgeConfigStatusChange} />
      )}

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={
            (selectedTab === 0 && testResult !== 'success') ||
            (selectedTab === 1 && !edgeConfigReady)
          }
        >
          Next Step
        </Button>
      </Box>
    </Box>
  );
};

export default DatabaseSetup;

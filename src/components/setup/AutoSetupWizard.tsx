'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material';
import { CheckCircle, Database, Store, User, ArrowRight } from 'lucide-react';

interface DetectionResult {
  database: {
    configured: boolean;
    type: string | null;
    status: string;
    details: any;
  };
  storage: {
    configured: boolean;
    type: string | null;
    status: string;
    details: any;
  };
  setup: {
    canProceed: boolean;
    nextStep: string;
    message: string;
  };
}

export default function AutoSetupWizard() {
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectEnvironment();
  }, []);

  const detectEnvironment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/setup/auto-detect');
      const data = await response.json();

      if (data.success) {
        setDetection(data.detection);
      } else {
        setError(data.message || 'Failed to detect environment');
      }
    } catch (err) {
      setError('Failed to connect to setup service');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: string) => {
    if (!detection) return 'pending';
    
    switch (step) {
      case 'database':
        return detection.database.configured ? 'completed' : 'active';
      case 'storage':
        return detection.storage.configured ? 'completed' : 
               detection.database.configured ? 'active' : 'pending';
      case 'admin':
        return detection.setup.canProceed ? 'active' : 'pending';
      default:
        return 'pending';
    }
  };

  const getDatabaseTypeDisplay = (type: string) => {
    switch (type) {
      case 'postgresql': return 'PostgreSQL';
      case 'edgedb': return 'Vercel EdgeDB';
      case 'redis': return 'Redis';
      default: return type;
    }
  };

  const getStorageTypeDisplay = (type: string) => {
    switch (type) {
      case 'vercel-blob': return 'Vercel Blob';
      case 'local': return 'Local Storage';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress />
            <Typography>Detecting environment configuration...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={detectEnvironment}>
            Retry Detection
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!detection) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Unable to detect environment configuration
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Auto Setup Wizard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Automatically detect and configure your KonBase environment
          </Typography>

          <Stepper activeStep={detection.setup.canProceed ? 2 : 
                               detection.database.configured ? 1 : 0}>
            <Step>
              <StepLabel>Database</StepLabel>
            </Step>
            <Step>
              <StepLabel>Storage</StepLabel>
            </Step>
            <Step>
              <StepLabel>Admin User</StepLabel>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Database size={24} />
            <Typography variant="h6">Database Configuration</Typography>
            {detection.database.configured && <CheckCircle size={20} color="green" />}
          </Box>

          {detection.database.configured ? (
            <Box>
              <Chip 
                label={getDatabaseTypeDisplay(detection.database.type!)} 
                color="success" 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Database is configured and ready
              </Typography>
            </Box>
          ) : (
            <Alert severity="warning">
              Database not configured. Please set up PostgreSQL, EdgeDB, or Redis.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Storage Status */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Store size={24} />
            <Typography variant="h6">Storage Configuration</Typography>
            {detection.storage.configured && <CheckCircle size={20} color="green" />}
          </Box>

          {detection.storage.configured ? (
            <Box>
              <Chip 
                label={getStorageTypeDisplay(detection.storage.type!)} 
                color="success" 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Storage is configured and ready
              </Typography>
            </Box>
          ) : (
            <Alert severity="warning">
              Storage not configured. Please set up Vercel Blob or Local Storage.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Setup Status */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <User size={24} />
            <Typography variant="h6">Setup Status</Typography>
          </Box>

          <Alert 
            severity={detection.setup.canProceed ? 'success' : 'info'}
            sx={{ mb: 2 }}
          >
            {detection.setup.message}
          </Alert>

          {detection.setup.canProceed && (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={20} />}
              href="/setup/admin"
              sx={{ mt: 2 }}
            >
              Continue to Admin Setup
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={detectEnvironment}
            sx={{ mt: 2, ml: 2 }}
          >
            Refresh Detection
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

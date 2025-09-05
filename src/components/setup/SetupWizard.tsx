import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Database,
  User,
  Building,
  CheckCircle,
  Shield,
  Store,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DatabaseSetup } from './DatabaseSetup';
import { AdminUserSetup } from './AdminUserSetup';
import { FirstAssociationSetup } from './FirstAssociationSetup';
import { SystemConfiguration } from './SystemConfiguration';
import { SetupComplete } from './SetupComplete';

const steps = [
  { label: 'Database Setup', icon: Database },
  { label: 'Admin User', icon: User },
  { label: 'First Association', icon: Building },
  { label: 'System Config', icon: Shield },
  { label: 'Complete', icon: CheckCircle },
];

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

export const SetupWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [setupData, setSetupData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [detectionLoading, setDetectionLoading] = useState(true);
  const [setupMode, setSetupMode] = useState<'auto' | 'manual'>('auto');
  const router = useRouter();

  useEffect(() => {
    detectEnvironment();
  }, []);

  const detectEnvironment = async () => {
    try {
      setDetectionLoading(true);
      const response = await fetch('/api/setup/auto-detect');
      const data = await response.json();

      if (data.success) {
        setDetection(data.detection);
        
        // If auto-detection shows everything is configured, skip to admin setup
        if (data.detection.setup.canProceed) {
          setActiveStep(1); // Skip to Admin User step
          setSetupMode('auto');
        }
      } else {
        setError(data.message || 'Failed to detect environment');
        setSetupMode('manual');
      }
    } catch (err) {
      setError('Failed to connect to setup service');
      setSetupMode('manual');
    } finally {
      setDetectionLoading(false);
    }
  };

  const handleNext = (stepData: any) => {
    setSetupData((prev: any) => ({ ...prev, ...stepData }));
    setError(null);
    setActiveStep((prev: number) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev: number) => prev - 1);
  };

  const handleComplete = () => {
    // Mark setup as complete and redirect to login
    localStorage.setItem('konbase-setup-complete', 'true');
    router.push('/auth/signin');
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

  const renderStepContent = () => {
    // Show auto-detection status if we're in auto mode and on step 0
    if (activeStep === 0 && setupMode === 'auto') {
      if (detectionLoading) {
        return (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress />
            <Typography>Detecting environment configuration...</Typography>
          </Box>
        );
      }

      if (detection) {
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Environment Detection
            </Typography>
            
            {/* Database Status */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Database size={24} />
              <Typography variant="subtitle1">Database Configuration</Typography>
              {detection.database.configured && <CheckCircle size={20} color="green" />}
            </Box>

            {detection.database.configured ? (
              <Box mb={3}>
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
              <Alert severity="warning" sx={{ mb: 3 }}>
                Database not configured. Please set up PostgreSQL, EdgeDB, or Redis.
              </Alert>
            )}

            {/* Storage Status */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Store size={24} />
              <Typography variant="subtitle1">Storage Configuration</Typography>
              {detection.storage.configured && <CheckCircle size={20} color="green" />}
            </Box>

            {detection.storage.configured ? (
              <Box mb={3}>
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
              <Alert severity="warning" sx={{ mb: 3 }}>
                Storage not configured. Please set up Vercel Blob or Local Storage.
              </Alert>
            )}

            {/* Setup Status */}
            <Alert 
              severity={detection.setup.canProceed ? 'success' : 'info'}
              sx={{ mb: 3 }}
            >
              {detection.setup.message}
            </Alert>

            {detection.setup.canProceed ? (
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={20} />}
                onClick={() => setActiveStep(1)}
                sx={{ mt: 2 }}
              >
                Continue to Admin Setup
              </Button>
            ) : (
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  onClick={detectEnvironment}
                  startIcon={<RefreshCw size={16} />}
                >
                  Refresh Detection
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSetupMode('manual')}
                >
                  Manual Setup
                </Button>
              </Box>
            )}
          </Box>
        );
      }
    }

    switch (activeStep) {
      case 0:
        return (
          <DatabaseSetup
            onNext={handleNext}
            onError={setError}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 1:
        return (
          <AdminUserSetup
            onNext={handleNext}
            onBack={handleBack}
            onError={setError}
            loading={loading}
            setLoading={setLoading}
            setupData={setupData}
          />
        );
      case 2:
        return (
          <FirstAssociationSetup
            onNext={handleNext}
            onBack={handleBack}
            onError={setError}
            loading={loading}
            setLoading={setLoading}
            setupData={setupData}
          />
        );
      case 3:
        return (
          <SystemConfiguration
            onNext={handleNext}
            onBack={handleBack}
            onError={setError}
            loading={loading}
            setLoading={setLoading}
            setupData={setupData}
          />
        );
      case 4:
        return (
          <SetupComplete
            onComplete={handleComplete}
            setupData={setupData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 800, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" gutterBottom>
              Welcome to KonBase
            </Typography>
            <Typography color="text.secondary">
              Let's set up your inventory and convention management system
            </Typography>
          </Box>

          {/* Setup Mode Tabs */}
          <Tabs 
            value={setupMode} 
            onChange={(e, newValue) => setSetupMode(newValue)}
            sx={{ mb: 3 }}
            centered
          >
            <Tab label="Auto Setup" value="auto" />
            <Tab label="Manual Setup" value="manual" />
          </Tabs>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Step key={step.label}>
                  <StepLabel
                    icon={<IconComponent size={20} />}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.875rem',
                      },
                    }}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderStepContent()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SetupWizard;

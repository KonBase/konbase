import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Database,
  User,
  Building,
  CheckCircle,
  Shield,
  Mail,
  Key,
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

export const SetupWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [setupData, setSetupData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  const renderStepContent = () => {
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

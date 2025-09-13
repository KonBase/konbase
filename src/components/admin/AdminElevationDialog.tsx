import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Shield, Smartphone } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface AdminElevationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminElevationDialog: React.FC<AdminElevationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  useSession();
  const [activeStep, setActiveStep] = useState(0);
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    'Password Verification',
    '2FA Verification',
    'Admin Access Granted',
  ];

  const handlePasswordSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Password verification failed');
      }

      if (result.requires2FA) {
        setActiveStep(1);
      } else {
        setActiveStep(2);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totpCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '2FA verification failed');
      }

      setActiveStep(2);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '2FA verification failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setPassword('');
    setTotpCode('');
    setError('');
    setLoading(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Shield size={48} color='#1976d2' style={{ marginBottom: 16 }} />
            <Typography variant='h6' gutterBottom>
              Admin Access Required
            </Typography>
            <Typography color='text.secondary' sx={{ mb: 3 }}>
              Please verify your password to access admin functions
            </Typography>
            <TextField
              fullWidth
              type='password'
              label='Password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handlePasswordSubmit()}
              disabled={loading}
              sx={{ mb: 2 }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Smartphone
              size={48}
              color='#1976d2'
              style={{ marginBottom: 16 }}
            />
            <Typography variant='h6' gutterBottom>
              Two-Factor Authentication
            </Typography>
            <Typography color='text.secondary' sx={{ mb: 3 }}>
              Enter the 6-digit code from your authenticator app
            </Typography>
            <TextField
              fullWidth
              label='TOTP Code'
              value={totpCode}
              onChange={e =>
                setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              onKeyPress={e => e.key === 'Enter' && handle2FASubmit()}
              disabled={loading}
              inputProps={{ maxLength: 6 }}
              sx={{ mb: 2 }}
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Shield size={48} color='#4caf50' style={{ marginBottom: 16 }} />
            <Typography variant='h6' gutterBottom color='success.main'>
              Access Granted
            </Typography>
            <Typography color='text.secondary'>
              You now have admin privileges. Redirecting to admin panel...
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <Shield size={24} />
          Admin Elevation
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        {activeStep < 2 && (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={
                activeStep === 0 ? handlePasswordSubmit : handle2FASubmit
              }
              variant='contained'
              disabled={loading || (activeStep === 0 ? !password : !totpCode)}
            >
              {loading ? <CircularProgress size={20} /> : 'Verify'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminElevationDialog;

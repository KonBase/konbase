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
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { User } from 'lucide-react';

interface AdminUserSetupProps {
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setupData: Record<string, unknown>;
}

export const AdminUserSetup: React.FC<AdminUserSetupProps> = ({
  onNext,
  onBack,
  onError,
  loading,
  setLoading,
  setupData,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    enable2FA: false,
    role: 'super_admin',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    onError('');

    try {
      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          databaseType: setupData.databaseType || 'postgresql',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onNext({
          adminUser: {
            ...formData,
            id: result.userId,
          },
        });
      } else {
        onError(result.error || 'Failed to create admin user');
      }
    } catch {
      onError('Failed to create admin user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Create Super Admin User
      </Typography>
      <Typography color='text.secondary' sx={{ mb: 3 }}>
        Create the first super administrator account with full system
        privileges.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='subtitle1' gutterBottom>
            Super Admin Privileges
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            • Full system access and configuration
            <br />
            • User and association management
            <br />
            • System settings and environment variables
            <br />
            • Audit logs and system monitoring
            <br />• Database administration
          </Typography>
        </CardContent>
      </Card>

      <Box display='flex' gap={2} mb={2}>
        <TextField
          fullWidth
          label='First Name'
          value={formData.firstName}
          onChange={e => handleInputChange('firstName', e.target.value)}
          error={!!errors.firstName}
          helperText={errors.firstName}
          required
        />
        <TextField
          fullWidth
          label='Last Name'
          value={formData.lastName}
          onChange={e => handleInputChange('lastName', e.target.value)}
          error={!!errors.lastName}
          helperText={errors.lastName}
          required
        />
      </Box>

      <TextField
        fullWidth
        label='Email Address'
        type='email'
        value={formData.email}
        onChange={e => handleInputChange('email', e.target.value)}
        error={!!errors.email}
        helperText={errors.email}
        sx={{ mb: 2 }}
        required
      />

      <Box display='flex' gap={2} mb={2}>
        <TextField
          fullWidth
          label='Password'
          type='password'
          value={formData.password}
          onChange={e => handleInputChange('password', e.target.value)}
          error={!!errors.password}
          helperText={errors.password || 'Minimum 8 characters'}
          required
        />
        <TextField
          fullWidth
          label='Confirm Password'
          type='password'
          value={formData.confirmPassword}
          onChange={e => handleInputChange('confirmPassword', e.target.value)}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          required
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <FormControlLabel
        control={
          <Switch
            checked={formData.enable2FA}
            onChange={e => handleInputChange('enable2FA', e.target.checked)}
          />
        }
        label='Enable Two-Factor Authentication (Recommended)'
        sx={{ mb: 2 }}
      />

      {formData.enable2FA && (
        <Alert severity='info' sx={{ mb: 2 }}>
          Two-factor authentication will be configured after the initial setup
          is complete. You'll be able to set it up from your user profile.
        </Alert>
      )}

      <Box display='flex' justifyContent='space-between'>
        <Button onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} /> : <User size={16} />
          }
        >
          Create Admin User
        </Button>
      </Box>
    </Box>
  );
};

export default AdminUserSetup;

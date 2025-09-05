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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
} from '@mui/material';
import {
  Settings,
  Mail,
  Shield,
  Globe,
  Database,
  Bell,
} from 'lucide-react';

interface SystemConfigurationProps {
  onNext: (data: any) => void;
  onBack: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setupData: any;
}

export const SystemConfiguration: React.FC<SystemConfigurationProps> = ({
  onNext,
  onBack,
  onError,
  loading,
  setLoading,
  setupData,
}) => {
  const [config, setConfig] = useState({
    // System Settings
    siteName: 'KonBase',
    siteDescription: 'Inventory and Convention Management System',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    
    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    twoFactorRequired: false,
    
    // Email Settings
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: setupData.adminUser?.email || '',
    fromName: 'KonBase',
    
    // Feature Flags
    enableAuditLogs: true,
    enableNotifications: true,
    enableChat: true,
    enableFileUploads: true,
    enableAnalytics: false,
  });

  const handleSubmit = async () => {
    setLoading(true);
    onError('');

    try {
      const response = await fetch('/api/setup/configure-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          adminUserId: setupData.adminUser.id,
          associationId: setupData.association.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onNext({ systemConfig: config });
      } else {
        onError(result.error || 'Failed to configure system');
      }
    } catch (error) {
      onError('Failed to configure system');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Configuration
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Configure basic system settings and features for your KonBase installation.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
        {/* Basic Settings */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                <Globe size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Basic Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Site Name"
                value={config.siteName}
                onChange={(e) => handleConfigChange('siteName', e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Site Description"
                multiline
                rows={2}
                value={config.siteDescription}
                onChange={(e) => handleConfigChange('siteDescription', e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.registrationEnabled}
                    onChange={(e) => handleConfigChange('registrationEnabled', e.target.checked)}
                  />
                }
                label="Allow User Registration"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.emailVerificationRequired}
                    onChange={(e) => handleConfigChange('emailVerificationRequired', e.target.checked)}
                  />
                }
                label="Require Email Verification"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.maintenanceMode}
                    onChange={(e) => handleConfigChange('maintenanceMode', e.target.checked)}
                  />
                }
                label="Maintenance Mode"
                sx={{ mb: 1 }}
              />
            </CardContent>
          </Card>

        {/* Security Settings */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                <Shield size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Security Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={config.sessionTimeout}
                onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Max Login Attempts"
                type="number"
                value={config.maxLoginAttempts}
                onChange={(e) => handleConfigChange('maxLoginAttempts', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Password Minimum Length"
                type="number"
                value={config.passwordMinLength}
                onChange={(e) => handleConfigChange('passwordMinLength', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.twoFactorRequired}
                    onChange={(e) => handleConfigChange('twoFactorRequired', e.target.checked)}
                  />
                }
                label="Require Two-Factor Authentication"
                sx={{ mb: 1 }}
              />
            </CardContent>
          </Card>

        {/* Email Settings */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                <Mail size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Email Settings
              </Typography>
              
              <TextField
                fullWidth
                label="SMTP Host"
                value={config.smtpHost}
                onChange={(e) => handleConfigChange('smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                sx={{ mb: 2 }}
              />
              
              <Box display="flex" gap={2} mb={2}>
                <TextField
                  label="SMTP Port"
                  type="number"
                  value={config.smtpPort}
                  onChange={(e) => handleConfigChange('smtpPort', parseInt(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="SMTP User"
                  value={config.smtpUser}
                  onChange={(e) => handleConfigChange('smtpUser', e.target.value)}
                  sx={{ flex: 2 }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="SMTP Password"
                type="password"
                value={config.smtpPassword}
                onChange={(e) => handleConfigChange('smtpPassword', e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Box display="flex" gap={2}>
                <TextField
                  label="From Email"
                  type="email"
                  value={config.fromEmail}
                  onChange={(e) => handleConfigChange('fromEmail', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="From Name"
                  value={config.fromName}
                  onChange={(e) => handleConfigChange('fromName', e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>
            </CardContent>
          </Card>

        {/* Feature Flags */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                <Settings size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Feature Flags
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableAuditLogs}
                    onChange={(e) => handleConfigChange('enableAuditLogs', e.target.checked)}
                  />
                }
                label="Audit Logs"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableNotifications}
                    onChange={(e) => handleConfigChange('enableNotifications', e.target.checked)}
                  />
                }
                label="Real-time Notifications"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableChat}
                    onChange={(e) => handleConfigChange('enableChat', e.target.checked)}
                  />
                }
                label="Chat System"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableFileUploads}
                    onChange={(e) => handleConfigChange('enableFileUploads', e.target.checked)}
                  />
                }
                label="File Uploads"
                sx={{ mb: 1 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enableAnalytics}
                    onChange={(e) => handleConfigChange('enableAnalytics', e.target.checked)}
                  />
                }
                label="Analytics"
                sx={{ mb: 1 }}
              />
            </CardContent>
          </Card>
      </Box>

      <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> You can modify these settings later from the admin panel.
          Some features like email notifications require proper SMTP configuration to work.
        </Typography>
      </Alert>

      <Box display="flex" justifyContent="space-between">
        <Button onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Settings size={16} />}
        >
          Configure System
        </Button>
      </Box>
    </Box>
  );
};

export default SystemConfiguration;

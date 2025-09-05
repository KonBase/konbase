import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Database,
  Server,
  Key,
  Globe,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const GlobalSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // System Settings
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    twoFactorRequired: false,
    
    // Security Settings
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    
    // Email Settings
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'KonBase',
    
    // Database Settings
    backupEnabled: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    
    // Feature Flags
    enableAuditLogs: true,
    enableAnalytics: true,
    enableNotifications: true,
    enableFileUploads: true,
  });

  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const result = await response.json();
      return result.data;
    },
  });

  const { data: envVariables } = useQuery({
    queryKey: ['admin-env-variables'],
    queryFn: async () => {
      const response = await fetch('/api/admin/env-variables');
      if (!response.ok) throw new Error('Failed to fetch environment variables');
      const result = await response.json();
      return result.data;
    },
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      // Show success message
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleAddEnvVariable = async () => {
    try {
      const response = await fetch('/api/admin/env-variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newEnvKey, value: newEnvValue }),
      });

      if (!response.ok) throw new Error('Failed to add environment variable');
      
      setNewEnvKey('');
      setNewEnvValue('');
      setEnvDialogOpen(false);
    } catch (error) {
      console.error('Error adding environment variable:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Global Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Save size={20} />}
          onClick={handleSaveSettings}
        >
          Save Settings
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
        {/* System Settings */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Server size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                System Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  />
                }
                label="Maintenance Mode"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.registrationEnabled}
                    onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
                  />
                }
                label="Allow User Registration"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailVerificationRequired}
                    onChange={(e) => handleSettingChange('emailVerificationRequired', e.target.checked)}
                  />
                }
                label="Require Email Verification"
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.twoFactorRequired}
                    onChange={(e) => handleSettingChange('twoFactorRequired', e.target.checked)}
                  />
                }
                label="Require Two-Factor Authentication"
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>

        {/* Security Settings */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Shield size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Security Settings
              </Typography>
              
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Max Login Attempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Password Minimum Length"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.passwordRequireSpecialChars}
                    onChange={(e) => handleSettingChange('passwordRequireSpecialChars', e.target.checked)}
                  />
                }
                label="Require Special Characters in Password"
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>

        {/* Email Settings */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Mail size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Email Settings
              </Typography>
              
              <TextField
                fullWidth
                label="SMTP Host"
                value={settings.smtpHost}
                onChange={(e) => handleSettingChange('smtpHost', e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Box display="flex" gap={2} mb={2}>
                <TextField
                  label="SMTP Port"
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => handleSettingChange('smtpPort', parseInt(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="SMTP User"
                  value={settings.smtpUser}
                  onChange={(e) => handleSettingChange('smtpUser', e.target.value)}
                  sx={{ flex: 2 }}
                />
              </Box>
              
              <TextField
                fullWidth
                label="SMTP Password"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Box display="flex" gap={2}>
                <TextField
                  label="From Email"
                  type="email"
                  value={settings.fromEmail}
                  onChange={(e) => handleSettingChange('fromEmail', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="From Name"
                  value={settings.fromName}
                  onChange={(e) => handleSettingChange('fromName', e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>
            </CardContent>
          </Card>

        {/* Database Settings */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Database size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Database Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.backupEnabled}
                    onChange={(e) => handleSettingChange('backupEnabled', e.target.checked)}
                  />
                }
                label="Enable Automatic Backups"
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Backup Frequency</InputLabel>
                <Select
                  value={settings.backupFrequency}
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  label="Backup Frequency"
                >
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Retention Days"
                type="number"
                value={settings.retentionDays}
                onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>

        {/* Feature Flags */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Globe size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Feature Flags
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableAuditLogs}
                        onChange={(e) => handleSettingChange('enableAuditLogs', e.target.checked)}
                      />
                    }
                    label="Audit Logs"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableAnalytics}
                        onChange={(e) => handleSettingChange('enableAnalytics', e.target.checked)}
                      />
                    }
                    label="Analytics"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableNotifications}
                        onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                      />
                    }
                    label="Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableFileUploads}
                        onChange={(e) => handleSettingChange('enableFileUploads', e.target.checked)}
                      />
                    }
                    label="File Uploads"
                  />
              </Box>
            </CardContent>
          </Card>

        {/* Environment Variables */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <Key size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Environment Variables
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Plus size={16} />}
                  onClick={() => setEnvDialogOpen(true)}
                >
                  Add Variable
                </Button>
              </Box>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                Environment variables are sensitive and should be managed carefully. Changes may require application restart.
              </Alert>
              
              <List>
                {envVariables?.map((env: any, index: number) => (
                  <ListItem key={index} divider>
                    <ListItemText
                      primary={env.key}
                      secondary={env.value ? '••••••••' : 'Not set'}
                    />
                    <ListItemSecondaryAction>
                      <IconButton size="small" edge="end">
                        <Edit size={16} />
                      </IconButton>
                      <IconButton size="small" edge="end" color="error">
                        <Trash2 size={16} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
      </Box>

      {/* Add Environment Variable Dialog */}
      <Dialog open={envDialogOpen} onClose={() => setEnvDialogOpen(false)}>
        <DialogTitle>Add Environment Variable</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Variable Name"
            value={newEnvKey}
            onChange={(e) => setNewEnvKey(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Variable Value"
            value={newEnvValue}
            onChange={(e) => setNewEnvValue(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnvDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddEnvVariable}>
            Add Variable
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GlobalSettings;

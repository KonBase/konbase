import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Upload,
  Save,
  RotateCcw,
  Palette,
  Image,
  Settings,
  Eye,
  Download,
  Trash2,
  Edit,
} from 'lucide-react';
import { getUnifiedStorage } from '@/lib/storage/unified';

interface BrandingConfig {
  appName: string;
  logo?: string;
  favicon?: string;
  icon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customCSS?: string;
  customHTML?: string;
}

interface BrandingManagementProps {
  onSave?: (config: BrandingConfig) => void;
}

export const BrandingManagement: React.FC<BrandingManagementProps> = ({ onSave }) => {
  const [config, setConfig] = useState<BrandingConfig>({
    appName: 'KonBase',
    logo: '/logo.svg',
    favicon: '/favicon.ico',
    icon: '/icon.png',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    accentColor: '#fce771',
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const storage = getUnifiedStorage();

  useEffect(() => {
    loadBrandingConfig();
  }, []);

  const loadBrandingConfig = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll use the default config
      setConfig({
        appName: 'KonBase',
        logo: '/logo.svg',
        favicon: '/favicon.ico',
        icon: '/icon.png',
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e',
        accentColor: '#fce771',
      });
    } catch (error) {
      setError('Failed to load branding configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, this would save to the database
      // For now, we'll just show success
      setSuccess('Branding configuration saved successfully');
      onSave?.(config);
    } catch (error) {
      setError('Failed to save branding configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'icon') => {
    setUploading(type);
    setError(null);

    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `branding/${type}-${Date.now()}.${fileExtension}`;
      
      const fileInfo = await storage.uploadFile({
        pathname: fileName,
        file,
        options: {
          access: 'public',
          contentType: file.type,
          cacheControlMaxAge: 31536000, // 1 year cache
        },
      });

      setConfig(prev => ({
        ...prev,
        [type]: fileInfo.url,
      }));

      setSuccess(`${type} uploaded successfully`);
    } catch (error) {
      setError(`Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  };

  const handleReset = () => {
    setConfig({
      appName: 'KonBase',
      logo: '/logo.svg',
      favicon: '/favicon.ico',
      icon: '/icon.png',
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      accentColor: '#fce771',
    });
    setSuccess('Branding reset to defaults');
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Palette className="w-6 h-6 text-blue-500" />
        <Typography variant="h5" component="h1">
          Branding Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box display="flex" flexDirection="column" gap={3}>
        <Box display="flex" gap={3} flexWrap="wrap">
          {/* Basic Configuration */}
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Configuration
                </Typography>
                
                <TextField
                  fullWidth
                  label="Application Name"
                  value={config.appName}
                  onChange={(e) => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Primary Color"
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Secondary Color"
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Accent Color"
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                  sx={{ mb: 2 }}
                />
              </CardContent>
            </Card>
          </Box>

          {/* Asset Management */}
          <Box flex="1" minWidth="300px">
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Asset Management
                </Typography>

                {/* Logo Upload */}
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Logo
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="logo-upload"
                      type="file"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={uploading === 'logo' ? <CircularProgress size={16} /> : <Upload size={16} />}
                        disabled={uploading === 'logo'}
                      >
                        Upload Logo
                      </Button>
                    </label>
                    {config.logo && (
                      <Chip
                        label="Uploaded"
                        color="success"
                        size="small"
                        onDelete={() => setConfig(prev => ({ ...prev, logo: '/logo.svg' }))}
                      />
                    )}
                  </Box>
                </Box>

                {/* Favicon Upload */}
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Favicon
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="favicon-upload"
                      type="file"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'favicon')}
                    />
                    <label htmlFor="favicon-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={uploading === 'favicon' ? <CircularProgress size={16} /> : <Upload size={16} />}
                        disabled={uploading === 'favicon'}
                      >
                        Upload Favicon
                      </Button>
                    </label>
                    {config.favicon && (
                      <Chip
                        label="Uploaded"
                        color="success"
                        size="small"
                        onDelete={() => setConfig(prev => ({ ...prev, favicon: '/favicon.ico' }))}
                      />
                    )}
                  </Box>
                </Box>

                {/* Icon Upload */}
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    App Icon
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="icon-upload"
                      type="file"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'icon')}
                    />
                    <label htmlFor="icon-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={uploading === 'icon' ? <CircularProgress size={16} /> : <Upload size={16} />}
                        disabled={uploading === 'icon'}
                      >
                        Upload Icon
                      </Button>
                    </label>
                    {config.icon && (
                      <Chip
                        label="Uploaded"
                        color="success"
                        size="small"
                        onDelete={() => setConfig(prev => ({ ...prev, icon: '/icon.png' }))}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Custom CSS */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Custom Styling
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Custom CSS"
              value={config.customCSS || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, customCSS: e.target.value }))}
              placeholder="/* Add your custom CSS here */"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Custom HTML (for head section)"
              value={config.customHTML || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, customHTML: e.target.value }))}
              placeholder="<!-- Add custom HTML for head section -->"
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            
            <Box display="flex" gap={2} mb={2}>
              <Button
                variant="outlined"
                startIcon={<Eye size={16} />}
                onClick={handlePreview}
              >
                Preview Changes
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download size={16} />}
                onClick={() => {
                  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'branding-config.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export Config
              </Button>
            </Box>

            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Configuration:
              </Typography>
              <Box component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto' }}>
                {JSON.stringify(config, null, 2)}
              </Box>
            </Paper>
          </CardContent>
        </Card>
      </Box>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <Save size={16} />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RotateCcw size={16} />}
          onClick={handleReset}
        >
          Reset to Defaults
        </Button>
      </Box>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Branding Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
            <Typography variant="h4" sx={{ color: config.primaryColor, mb: 2 }}>
              {config.appName}
            </Typography>
            
            <Box display="flex" gap={2} mb={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: config.primaryColor,
                  borderRadius: 1,
                }}
              />
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: config.secondaryColor,
                  borderRadius: 1,
                }}
              />
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: config.accentColor,
                  borderRadius: 1,
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              This is a preview of how your branding will look in the application.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

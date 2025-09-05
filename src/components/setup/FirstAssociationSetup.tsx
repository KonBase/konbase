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
  Chip,
} from '@mui/material';
import {
  Building,
  Mail,
  Globe,
  Phone,
  MapPin,
  Users,
} from 'lucide-react';

interface FirstAssociationSetupProps {
  onNext: (data: any) => void;
  onBack: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setupData: any;
}

export const FirstAssociationSetup: React.FC<FirstAssociationSetupProps> = ({
  onNext,
  onBack,
  onError,
  loading,
  setLoading,
  setupData,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    website: '',
    phone: '',
    address: '',
    type: 'convention_organizer',
    status: 'active',
  });

  const [errors, setErrors] = useState<any>({});

  const associationTypes = [
    { value: 'convention_organizer', label: 'Convention Organizer' },
    { value: 'gaming_club', label: 'Gaming Club' },
    { value: 'event_company', label: 'Event Company' },
    { value: 'non_profit', label: 'Non-Profit Organization' },
    { value: 'educational', label: 'Educational Institution' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Association name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
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
      const response = await fetch('/api/setup/create-association', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          adminUserId: setupData.adminUser.id,
          databaseType: setupData.databaseType || 'postgresql',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onNext({
          association: {
            ...formData,
            id: result.associationId,
          },
        });
      } else {
        onError(result.error || 'Failed to create association');
      }
    } catch (error) {
      onError('Failed to create association');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Create Your First Association
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Set up your organization or association to start managing inventory and conventions.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            What is an Association?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            An association represents your organization, club, or company. It's the top-level entity
            that contains all your conventions, inventory, and team members. You can create multiple
            associations if you manage different organizations.
          </Typography>
        </CardContent>
      </Card>

      <TextField
        fullWidth
        label="Association Name"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        error={!!errors.name}
        helperText={errors.name}
        sx={{ mb: 2 }}
        required
      />

      <TextField
        fullWidth
        label="Description"
        multiline
        rows={3}
        value={formData.description}
        onChange={(e) => handleInputChange('description', e.target.value)}
        placeholder="Brief description of your organization..."
        sx={{ mb: 2 }}
      />

      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          label="Contact Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={!!errors.email}
          helperText={errors.email}
          required
        />
        <TextField
          fullWidth
          label="Website"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          error={!!errors.website}
          helperText={errors.website || 'Optional'}
          placeholder="https://example.com"
        />
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+1 (555) 123-4567"
        />
        <FormControl fullWidth>
          <InputLabel>Organization Type</InputLabel>
          <Select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            label="Organization Type"
          >
            {associationTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TextField
        fullWidth
        label="Address"
        multiline
        rows={2}
        value={formData.address}
        onChange={(e) => handleInputChange('address', e.target.value)}
        placeholder="Street address, city, state, postal code"
        sx={{ mb: 2 }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> You'll be automatically added as the admin of this association.
          You can invite other team members and create additional associations later.
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
          startIcon={loading ? <CircularProgress size={16} /> : <Building size={16} />}
        >
          Create Association
        </Button>
      </Box>
    </Box>
  );
};

export default FirstAssociationSetup;

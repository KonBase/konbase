import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  User,
  Building,
  Settings,
  Database,
  Shield,
  Mail,
  Bell,
  MessageCircle,
  Upload,
  BarChart3,
} from 'lucide-react';

interface SetupCompleteProps {
  onComplete: () => void;
  setupData: Record<string, unknown>;
}

export const SetupComplete: React.FC<SetupCompleteProps> = ({
  onComplete,
  setupData,
}) => {
  const features = [
    {
      icon: User,
      label: 'User Management',
      description: 'Manage users and roles',
    },
    {
      icon: Building,
      label: 'Association Management',
      description: 'Create and manage organizations',
    },
    {
      icon: Database,
      label: 'Inventory System',
      description: 'Track equipment and items',
    },
    {
      icon: Settings,
      label: 'Convention Management',
      description: 'Plan and manage events',
    },
    {
      icon: Shield,
      label: 'Security Features',
      description: 'Role-based access control',
    },
    {
      icon: Mail,
      label: 'Email Notifications',
      description: 'Automated email alerts',
    },
    {
      icon: Bell,
      label: 'Real-time Notifications',
      description: 'Live system notifications',
    },
    {
      icon: MessageCircle,
      label: 'Chat System',
      description: 'Team communication',
    },
    {
      icon: Upload,
      label: 'File Management',
      description: 'Document and file storage',
    },
    {
      icon: BarChart3,
      label: 'Analytics & Reports',
      description: 'Data insights and reporting',
    },
  ];

  return (
    <Box>
      <Box textAlign='center' mb={4}>
        <CheckCircle size={64} color='#4caf50' style={{ marginBottom: 16 }} />
        <Typography variant='h4' gutterBottom color='success.main'>
          Setup Complete!
        </Typography>
        <Typography color='text.secondary'>
          Your KonBase system is ready to use. You can now start managing your
          inventory and conventions.
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Setup Summary
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Database size={20} />
              </ListItemIcon>
              <ListItemText
                primary='Database'
                secondary='PostgreSQL connection configured'
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <User size={20} />
              </ListItemIcon>
              <ListItemText
                primary='Super Admin User'
                secondary={`${(setupData.adminUser as { firstName?: string })?.firstName || ''} ${(setupData.adminUser as { lastName?: string })?.lastName || ''} (${(setupData.adminUser as { email?: string })?.email || ''})`}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Building size={20} />
              </ListItemIcon>
              <ListItemText
                primary='First Association'
                secondary={
                  (setupData.association as { name?: string })?.name || ''
                }
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Settings size={20} />
              </ListItemIcon>
              <ListItemText
                primary='System Configuration'
                secondary='Basic settings configured'
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Available Features
          </Typography>
          <Box display='flex' flexWrap='wrap' gap={1}>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Chip
                  key={index}
                  icon={<IconComponent size={16} />}
                  label={feature.label}
                  variant='outlined'
                  sx={{ mb: 1 }}
                />
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <Alert severity='success' sx={{ mb: 3 }}>
        <Typography variant='body2'>
          <strong>Next Steps:</strong>
          <br />
          1. Log in with your admin credentials
          <br />
          2. Explore the admin panel to configure additional settings
          <br />
          3. Invite team members to your association
          <br />
          4. Start creating your first convention or adding inventory items
        </Typography>
      </Alert>

      <Alert severity='info' sx={{ mb: 3 }}>
        <Typography variant='body2'>
          <strong>Important:</strong> Remember to configure your SMTP settings
          in the admin panel to enable email notifications. You can also set up
          OAuth providers (Google, Discord) for easier user authentication.
        </Typography>
      </Alert>

      <Box textAlign='center'>
        <Button
          variant='contained'
          size='large'
          onClick={onComplete}
          startIcon={<CheckCircle size={20} />}
        >
          Go to Login
        </Button>
      </Box>
    </Box>
  );
};

export default SetupComplete;

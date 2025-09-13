'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Shield,
  Users,
  Building,
  Calendar,
  Package,
  BarChart3,
  Settings,
  Activity,
  CheckCircle,
  Palette,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { AdminElevationDialog } from '@/components/admin/AdminElevationDialog';
import { SystemOverview } from '@/components/admin/SystemOverview';
import { AssociationManagement } from '@/components/admin/AssociationManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { GlobalSettings } from '@/components/admin/GlobalSettings';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { BrandingManagement } from '@/components/admin/BrandingManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [adminElevated, setAdminElevated] = useState(false);
  const [elevationDialogOpen, setElevationDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Check if user is super admin
  const { data: isSuperAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['admin-check'],
    queryFn: async () => {
      const response = await fetch('/api/admin/check-permissions');
      if (!response.ok) return false;
      const result = await response.json();
      return result.isSuperAdmin;
    },
    enabled: !!session,
  });

  const { data: systemStats } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system-stats');
      if (!response.ok) throw new Error('Failed to fetch system stats');
      const result = await response.json();
      return result.data;
    },
    enabled: adminElevated,
  });

  const handleElevationSuccess = () => {
    setAdminElevated(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (checkingAdmin) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box display='flex' alignItems='center' gap={2}>
          <LinearProgress sx={{ flex: 1 }} />
          <Typography>Checking admin permissions...</Typography>
        </Box>
      </Container>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='error' sx={{ mb: 3 }}>
          <Typography variant='h6' gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You do not have super admin privileges. Only super administrators
            can access this panel.
          </Typography>
        </Alert>
      </Container>
    );
  }

  if (!adminElevated) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Shield size={64} color='#1976d2' style={{ marginBottom: 16 }} />
            <Typography variant='h4' gutterBottom>
              Admin Panel Access
            </Typography>
            <Typography color='text.secondary' sx={{ mb: 3 }}>
              You have super admin privileges. Please verify your identity to
              access the admin panel.
            </Typography>
            <Button
              variant='contained'
              size='large'
              startIcon={<Shield size={20} />}
              onClick={() => setElevationDialogOpen(true)}
            >
              Verify Identity
            </Button>
          </CardContent>
        </Card>

        <AdminElevationDialog
          open={elevationDialogOpen}
          onClose={() => setElevationDialogOpen(false)}
          onSuccess={handleElevationSuccess}
        />
      </Container>
    );
  }

  const quickStats = [
    {
      title: 'Total Users',
      value: systemStats?.totalUsers || 0,
      icon: Users,
      color: 'primary.main',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Associations',
      value: systemStats?.totalAssociations || 0,
      icon: Building,
      color: 'success.main',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Conventions',
      value: systemStats?.activeConventions || 0,
      icon: Calendar,
      color: 'info.main',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Items',
      value: systemStats?.totalItems || 0,
      icon: Package,
      color: 'warning.main',
      change: '+15%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={4}
      >
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            Admin Panel
          </Typography>
          <Typography color='text.secondary'>
            System administration and management
          </Typography>
        </Box>
        <Chip
          icon={<Shield size={16} />}
          label='Super Admin'
          color='primary'
          variant='outlined'
        />
      </Box>

      {/* Quick Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mb: 4,
        }}
      >
        {quickStats.map(stat => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='space-between'
                >
                  <Box>
                    <Typography color='text.secondary' gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant='h4' component='div'>
                      {stat.value.toLocaleString()}
                    </Typography>
                    <Box display='flex' alignItems='center' gap={1} mt={1}>
                      <CheckCircle size={14} color='#4caf50' />
                      <Typography variant='body2' color='success.main'>
                        {stat.change} from last month
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: stat.color,
                      borderRadius: '50%',
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComponent size={24} color='white' />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Admin Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label='System Overview' icon={<BarChart3 size={20} />} />
          <Tab label='Associations' icon={<Building size={20} />} />
          <Tab label='Users' icon={<Users size={20} />} />
          <Tab label='Global Settings' icon={<Settings size={20} />} />
          <Tab label='Branding' icon={<Palette size={20} />} />
          <Tab label='Audit Logs' icon={<Activity size={20} />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <SystemOverview />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AssociationManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <GlobalSettings />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <BrandingManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <AuditLogs />
        </TabPanel>
      </Paper>
    </Container>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Package,
  Calendar,
  Users,
  AlertTriangle,
  TrendingUp,
  LogIn,
  UserPlus,
  Shield,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalItems: number;
  totalConventions: number;
  activeConventions: number;
  upcomingConventions: number;
  itemsNeedingAttention: number;
  associationMembers: number;
  recentActivity: string[];
  upcomingTasks: string[];
}

import AppLayout from '@/components/layout/AppLayout';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [setupStatus, setSetupStatus] = useState<
    'checking' | 'needed' | 'complete'
  >('checking');

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/status');
      if (response.ok) {
        const result = await response.json();
        if (result.setupComplete) {
          setSetupStatus('complete');
        } else {
          setSetupStatus('needed');
        }
      } else {
        setSetupStatus('needed');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Setup check error:', error);
      setSetupStatus('needed');
    }
  };

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const result = await response.json();
      return result.data as DashboardStats;
    },
    enabled: !!session,
  });

  if (setupStatus === 'checking') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography>Loading KonBase...</Typography>
      </Box>
    );
  }

  if (setupStatus === 'needed') {
    router.push('/setup');
    return null;
  }

  if (!session) {
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
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Shield size={64} color='#1976d2' style={{ marginBottom: 16 }} />
            <Typography variant='h4' gutterBottom>
              Welcome to KonBase
            </Typography>
            <Typography color='text.secondary' sx={{ mb: 4 }}>
              All-in-one platform for conventions to manage inventory, track
              equipment, and streamline logistics
            </Typography>

            <Box display='flex' flexDirection='column' gap={2}>
              <Button
                variant='contained'
                size='large'
                startIcon={<LogIn size={20} />}
                href='/auth/signin'
                fullWidth
              >
                Sign In
              </Button>
              <Button
                variant='outlined'
                size='large'
                startIcon={<UserPlus size={20} />}
                href='/auth/signup'
                fullWidth
              >
                Create Account
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant='body2' color='text.secondary'>
              Need an invitation code? Contact your organization administrator.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  const quickStats = [
    {
      title: 'Total Items',
      value: stats?.totalItems || 0,
      icon: Package,
      color: 'primary.main',
      link: '/inventory/items',
    },
    {
      title: 'Active Conventions',
      value: stats?.activeConventions || 0,
      icon: Calendar,
      color: 'success.main',
      link: '/conventions',
    },
    {
      title: 'Team Members',
      value: stats?.associationMembers || 0,
      icon: Users,
      color: 'info.main',
      link: '/users',
    },
    {
      title: 'Items Need Attention',
      value: stats?.itemsNeedingAttention || 0,
      icon: AlertTriangle,
      color: 'warning.main',
      link: '/inventory/maintenance',
    },
  ];

  return (
    <AppLayout>
      <Container maxWidth='lg' sx={{ py: 4 }}>
        {/* Welcome Header */}
        <Box mb={4}>
          <Typography variant='h4' component='h1' gutterBottom>
            Welcome to KonBase
          </Typography>
          <Typography color='text.secondary'>
            All-in-one platform for conventions to manage inventory, track
            equipment, and streamline logistics
          </Typography>
        </Box>

        {/* Quick Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          {quickStats.map(stat => {
            const IconComponent = stat.icon;
            return (
              <Box key={stat.title}>
                <Card sx={{ height: '100%' }}>
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
                          {stat.value}
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{ bgcolor: stat.color, width: 56, height: 56 }}
                      >
                        <IconComponent size={24} />
                      </Avatar>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size='small' href={stat.link}>
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            );
          })}
        </Box>

        {/* Features Overview */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
          }}
        >
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  KonBase Features
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Package size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary='Inventory Management'
                      secondary='Track items, categories, locations, and equipment sets'
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Calendar size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary='Convention Management'
                      secondary='Plan events, manage equipment allocation, and track resources'
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Users size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary='Association Management'
                      secondary='Manage organizations, members, roles, and permissions'
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary='Reports & Analytics'
                      secondary='Generate insights and track performance metrics'
                    />
                  </ListItem>
                </List>
              </CardContent>
              <CardActions>
                <Button size='small' href='/associations'>
                  Get Started
                </Button>
              </CardActions>
            </Card>
          </Box>

          <Box>
            <Card>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  Quick Actions
                </Typography>
                <Box display='flex' flexDirection='column' gap={1}>
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<Package size={16} />}
                    href='/inventory/items/new'
                    fullWidth
                  >
                    Add New Item
                  </Button>
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<Calendar size={16} />}
                    href='/conventions/new'
                    fullWidth
                  >
                    Create Convention
                  </Button>
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<Users size={16} />}
                    href='/associations'
                    fullWidth
                  >
                    Manage Associations
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </AppLayout>
  );
}

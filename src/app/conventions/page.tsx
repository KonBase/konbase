'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Fab,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Play,
  Pause,
  CheckCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Convention } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { ConventionForm } from '@/components/forms/ConventionForm';

export default function ConventionsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setSelectedConvention] = useState<string | null>(null);

  const {
    data: conventions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['conventions', searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/conventions?${params}`, {
        headers: {
          'x-association-id':
            session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch conventions');
      const result = await response.json();
      return result.data as Convention[];
    },
    enabled: !!session,
  });

  type CreateConventionPayload = {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
  };

  const handleCreateConvention = async (data: CreateConventionPayload) => {
    try {
      const response = await fetch('/api/conventions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-association-id':
            session?.user?.associations?.[0]?.association?.id || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create convention');

      await refetch();
      setCreateDialogOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating convention:', error);
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    conventionId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedConvention(conventionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConvention(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'info';
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Calendar size={16} />;
      case 'active':
        return <Play size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <Pause size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Typography>Loading conventions...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={4}
      >
        <Box>
          <Typography variant='h4' component='h1'>
            Convention Management
          </Typography>
          <Typography color='text.secondary'>
            Plan, manage, and track your conventions and events
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Plus size={20} />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Create Convention
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display='flex' gap={2} alignItems='center'>
            <TextField
              placeholder='Search conventions...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
              variant='outlined'
              size='small'
              sx={{ flex: 1 }}
            />
            <Button
              variant='outlined'
              startIcon={<Filter size={16} />}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Conventions Grid */}
      {conventions.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h6' gutterBottom>
            No conventions found
          </Typography>
          <Typography color='text.secondary' mb={3}>
            Create your first convention to get started with KonBase.
          </Typography>
          <Button
            variant='contained'
            startIcon={<Plus size={20} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Convention
          </Button>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 3,
          }}
        >
          {conventions.map(convention => (
            <Box key={convention.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='flex-start'
                    mb={2}
                  >
                    <Box>
                      <Typography variant='h6' component='h2' gutterBottom>
                        {convention.name}
                      </Typography>
                      <Chip
                        label={convention.status}
                        size='small'
                        color={getStatusColor(convention.status)}
                        variant='outlined'
                        icon={getStatusIcon(convention.status)}
                      />
                    </Box>
                    <IconButton
                      size='small'
                      onClick={e => handleMenuClick(e, convention.id)}
                    >
                      <MoreVertical size={20} />
                    </IconButton>
                  </Box>

                  <Typography color='text.secondary' sx={{ mb: 2 }}>
                    {convention.description || 'No description provided.'}
                  </Typography>

                  <Box display='flex' flexDirection='column' gap={1}>
                    <Box display='flex' alignItems='center' gap={1}>
                      <Calendar size={16} color='#666' />
                      <Typography variant='body2'>
                        {new Date(convention.start_date).toLocaleDateString()} -{' '}
                        {new Date(convention.end_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {convention.location && (
                      <Box display='flex' alignItems='center' gap={1}>
                        <MapPin size={16} color='#666' />
                        <Typography variant='body2'>
                          {convention.location}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size='small'
                    startIcon={<Eye size={16} />}
                    href={`/conventions/${convention.id}`}
                  >
                    View Details
                  </Button>
                  {convention.status === 'planning' && (
                    <Button
                      size='small'
                      startIcon={<Edit size={16} />}
                      href={`/conventions/${convention.id}/edit`}
                    >
                      Edit
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Create Convention Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title='Create New Convention'
        maxWidth='md'
      >
        <ConventionForm onSubmit={handleCreateConvention} title='' />
      </Dialog>

      {/* Convention Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            // Navigate to convention details
            handleMenuClose();
          }}
        >
          <Eye size={16} style={{ marginRight: 8 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Navigate to edit convention
            handleMenuClose();
          }}
        >
          <Edit size={16} style={{ marginRight: 8 }} />
          Edit Convention
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Delete convention
            handleMenuClose();
          }}
        >
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete Convention
        </MenuItem>
      </Menu>

      {/* Floating Action Button for mobile */}
      <Fab
        color='primary'
        aria-label='create convention'
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus size={24} />
      </Fab>
    </Container>
  );
}

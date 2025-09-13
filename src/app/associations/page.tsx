'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Fab,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import { Plus, Settings, Users, MoreVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { AssociationMember } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { AssociationForm } from '@/components/forms/AssociationForm';

export default function AssociationsPage() {
  const { data: session } = useSession();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setSelectedAssociation] = useState<string | null>(null);

  const {
    data: associations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['associations'],
    queryFn: async () => {
      const response = await fetch('/api/associations');
      if (!response.ok) throw new Error('Failed to fetch associations');
      const result = await response.json();
      return result.data as AssociationMember[];
    },
    enabled: !!session,
  });

  type CreateAssociationPayload = {
    name: string;
    description?: string;
    email: string;
    website?: string;
    phone?: string;
    address?: string;
  };

  const handleCreateAssociation = async (data: CreateAssociationPayload) => {
    try {
      const response = await fetch('/api/associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create association');

      await refetch();
      setCreateDialogOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating association:', error);
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    associationId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssociation(associationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssociation(null);
  };

  const getRoleColor = (role: string): ChipProps['color'] => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'member':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Typography>Loading associations...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={4}
      >
        <Typography variant='h4' component='h1'>
          My Associations
        </Typography>
        <Button
          variant='contained'
          startIcon={<Plus size={20} />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Association
        </Button>
      </Box>

      {associations.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h6' gutterBottom>
            No associations found
          </Typography>
          <Typography color='text.secondary' mb={3}>
            Create your first association to get started with KonBase.
          </Typography>
          <Button
            variant='contained'
            startIcon={<Plus size={20} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Association
          </Button>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 3,
          }}
        >
          {associations.map(membership => (
            <Box key={membership.id}>
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
                    <Box display='flex' alignItems='center' gap={2}>
                      <Avatar
                        src={membership.association?.logo_url}
                        sx={{ width: 48, height: 48 }}
                      >
                        {membership.association?.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant='h6' component='h2'>
                          {membership.association?.name}
                        </Typography>
                        <Chip
                          label={membership.role}
                          size='small'
                          color={getRoleColor(membership.role)}
                          variant='outlined'
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size='small'
                      onClick={e =>
                        handleMenuClick(e, membership.association?.id || '')
                      }
                    >
                      <MoreVertical size={20} />
                    </IconButton>
                  </Box>

                  <Typography color='text.secondary' sx={{ mb: 2 }}>
                    {membership.association?.description ||
                      'No description provided.'}
                  </Typography>

                  <Box display='flex' gap={1} mb={2}>
                    {membership.association?.website && (
                      <Chip label='Website' size='small' variant='outlined' />
                    )}
                    {membership.association?.email && (
                      <Chip label='Contact' size='small' variant='outlined' />
                    )}
                  </Box>

                  <Typography variant='caption' color='text.secondary'>
                    Joined {new Date(membership.joined_at).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size='small'
                    startIcon={<Users size={16} />}
                    href={`/associations/${membership.association?.id}`}
                  >
                    View Details
                  </Button>
                  {(membership.role === 'admin' ||
                    membership.role === 'manager') && (
                    <Button
                      size='small'
                      startIcon={<Settings size={16} />}
                      href={`/associations/${membership.association?.id}/settings`}
                    >
                      Settings
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Create Association Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title='Create New Association'
        maxWidth='md'
      >
        <AssociationForm
          onSubmit={data =>
            handleCreateAssociation({
              ...data,
              email: data.email ?? '',
            })
          }
          loading={isLoading}
          title=''
        />
      </Dialog>

      {/* Association Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            // Navigate to association details
            handleMenuClose();
          }}
        >
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Navigate to settings
            handleMenuClose();
          }}
        >
          Settings
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Leave association
            handleMenuClose();
          }}
        >
          Leave Association
        </MenuItem>
      </Menu>

      {/* Floating Action Button for mobile */}
      <Fab
        color='primary'
        aria-label='create association'
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

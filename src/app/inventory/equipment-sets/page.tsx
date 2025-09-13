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
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Copy,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { EquipmentSet } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { EquipmentSetForm } from '@/components/forms/EquipmentSetForm';
import { EquipmentSetFormData } from '@/lib/validations/schemas';

export default function EquipmentSetsPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setSelectedSet] = useState<string | null>(null);

  const {
    data: equipmentSets = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['equipment-sets', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);

      const response = await fetch(`/api/inventory/equipment-sets?${params}`, {
        headers: {
          'x-association-id':
            session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch equipment sets');
      const result = await response.json();
      return result.data as EquipmentSet[];
    },
    enabled: !!session,
  });

  const handleCreateEquipmentSet = async (data: EquipmentSetFormData) => {
    try {
      const response = await fetch('/api/inventory/equipment-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-association-id':
            session?.user?.associations?.[0]?.association?.id || '',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create equipment set');

      await refetch();
      setCreateDialogOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating equipment set:', error);
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    setId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedSet(setId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSet(null);
  };

  if (isLoading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Typography>Loading equipment sets...</Typography>
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
            Equipment Sets
          </Typography>
          <Typography color='text.secondary'>
            Manage predefined equipment sets for easy allocation
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<Plus size={20} />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Create Equipment Set
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder='Search equipment sets...'
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
          />
        </CardContent>
      </Card>

      {/* Equipment Sets Grid */}
      {equipmentSets.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant='h6' gutterBottom>
            No equipment sets found
          </Typography>
          <Typography color='text.secondary' mb={3}>
            Create your first equipment set to get started.
          </Typography>
          <Button
            variant='contained'
            startIcon={<Plus size={20} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Equipment Set
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
          {equipmentSets.map(set => (
            <Box key={set.id}>
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
                        {set.name}
                      </Typography>
                      <Chip
                        label={`${set.items?.length || 0} items`}
                        size='small'
                        color='primary'
                        variant='outlined'
                      />
                    </Box>
                    <IconButton
                      size='small'
                      onClick={e => handleMenuClick(e, set.id)}
                    >
                      <MoreVertical size={20} />
                    </IconButton>
                  </Box>

                  <Typography color='text.secondary' sx={{ mb: 2 }}>
                    {set.description || 'No description provided.'}
                  </Typography>

                  {set.items && set.items.length > 0 && (
                    <Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        gutterBottom
                      >
                        Items in this set:
                      </Typography>
                      <Box display='flex' flexWrap='wrap' gap={0.5}>
                        {set.items.slice(0, 3).map((item, index) => (
                          <Chip
                            key={index}
                            label={`${item.quantity}x ${item.item?.name || 'Unknown Item'}`}
                            size='small'
                            variant='outlined'
                          />
                        ))}
                        {set.items.length > 3 && (
                          <Chip
                            label={`+${set.items.length - 3} more`}
                            size='small'
                            variant='outlined'
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    size='small'
                    startIcon={<Eye size={16} />}
                    href={`/inventory/equipment-sets/${set.id}`}
                  >
                    View Details
                  </Button>
                  <Button
                    size='small'
                    startIcon={<Edit size={16} />}
                    href={`/inventory/equipment-sets/${set.id}/edit`}
                  >
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Create Equipment Set Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title='Create New Equipment Set'
        maxWidth='md'
      >
        <EquipmentSetForm onSubmit={handleCreateEquipmentSet} title='' />
      </Dialog>

      {/* Equipment Set Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            // Navigate to set details
            handleMenuClose();
          }}
        >
          <Eye size={16} style={{ marginRight: 8 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Navigate to edit set
            handleMenuClose();
          }}
        >
          <Edit size={16} style={{ marginRight: 8 }} />
          Edit Set
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Duplicate set
            handleMenuClose();
          }}
        >
          <Copy size={16} style={{ marginRight: 8 }} />
          Duplicate Set
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Delete set
            handleMenuClose();
          }}
        >
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete Set
        </MenuItem>
      </Menu>

      {/* Floating Action Button for mobile */}
      <Fab
        color='primary'
        aria-label='create equipment set'
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

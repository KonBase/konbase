import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Pagination,
  InputAdornment,
} from '@mui/material';
import { Plus, MoreVertical, Copy, Trash2, Mail, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export const InvitationManager: React.FC = () => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedInvitation, setSelectedInvitation] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: invitations,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['invitations', searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/invitations?${params}`, {
        headers: {
          'x-association-id':
            session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch invitations');
      const result = await response.json();
      return result.data;
    },
    enabled: !!session,
  });

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    invitation: Record<string, unknown>
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedInvitation(invitation);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedInvitation(null);
  };

  const handleCopyInviteLink = async () => {
    if (selectedInvitation) {
      const inviteLink = `${window.location.origin}/auth/signup?invite=${selectedInvitation.code}`;
      await navigator.clipboard.writeText(inviteLink);
      handleMenuClose();
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'expired':
        return 'error';
      case 'revoked':
        return 'default';
      default:
        return 'default';
    }
  };

  const getExpiryStatus = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysLeft = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) return { status: 'expired', text: 'Expired' };
    if (daysLeft <= 1) return { status: 'warning', text: 'Expires today' };
    if (daysLeft <= 3)
      return { status: 'warning', text: `${daysLeft} days left` };
    return { status: 'success', text: `${daysLeft} days left` };
  };

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' py={4}>
        <Typography>Loading invitations...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h6'>Invitation Management</Typography>
        <Button
          variant='contained'
          startIcon={<Plus size={20} />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Invitation
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder='Search invitations...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Invitations Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations?.data?.map((invitation: Record<string, unknown>) => {
                const expiryStatus = getExpiryStatus(
                  String(invitation.expires_at)
                );
                return (
                  <TableRow key={String(invitation.id)} hover>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={2}>
                        <Mail size={16} color='#666' />
                        {String(invitation.email)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={String(invitation.role)}
                        size='small'
                        color='primary'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={String(invitation.status)}
                        color={
                          getStatusColor(String(invitation.status)) as
                            | 'default'
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'info'
                            | 'success'
                            | 'warning'
                        }
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={expiryStatus.text}
                        color={
                          expiryStatus.status as
                            | 'default'
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'info'
                            | 'success'
                            | 'warning'
                        }
                        size='small'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(
                        String(invitation.created_at)
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        onClick={e => handleMenuClick(e, invitation)}
                      >
                        <MoreVertical size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {invitations?.pagination && (
          <Box display='flex' justifyContent='center' p={2}>
            <Pagination
              count={invitations.pagination.totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color='primary'
            />
          </Box>
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyInviteLink}>
          <Copy size={16} style={{ marginRight: 8 }} />
          Copy Invite Link
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Revoke Invitation
        </MenuItem>
      </Menu>

      {/* Create Invitation Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Create Invitation</DialogTitle>
        <DialogContent>
          <CreateInvitationForm
            onSuccess={() => {
              setCreateDialogOpen(false);
              refetch();
            }}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Revoke Invitation</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            This action cannot be undone. The invitation will be immediately
            revoked.
          </Alert>
          <Typography>
            Are you sure you want to revoke the invitation for "
            {String(selectedInvitation?.email || '')}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' color='error'>
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Create Invitation Form Component
const CreateInvitationForm: React.FC<{
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'member',
    expiresIn: '7',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to create invitation');
      }
    } catch {
      setError('Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ pt: 2 }}>
      <TextField
        fullWidth
        label='Email Address'
        type='email'
        value={formData.email}
        onChange={e =>
          setFormData(prev => ({ ...prev, email: e.target.value }))
        }
        required
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Role</InputLabel>
        <Select
          value={formData.role}
          onChange={e =>
            setFormData(prev => ({ ...prev, role: e.target.value }))
          }
          label='Role'
        >
          <MenuItem value='member'>Member</MenuItem>
          <MenuItem value='manager'>Manager</MenuItem>
          <MenuItem value='admin'>Admin</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Expires In</InputLabel>
        <Select
          value={formData.expiresIn}
          onChange={e =>
            setFormData(prev => ({ ...prev, expiresIn: e.target.value }))
          }
          label='Expires In'
        >
          <MenuItem value='1'>1 day</MenuItem>
          <MenuItem value='3'>3 days</MenuItem>
          <MenuItem value='7'>7 days</MenuItem>
          <MenuItem value='14'>14 days</MenuItem>
          <MenuItem value='30'>30 days</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label='Personal Message (Optional)'
        multiline
        rows={3}
        value={formData.message}
        onChange={e =>
          setFormData(prev => ({ ...prev, message: e.target.value }))
        }
        placeholder='Add a personal message to the invitation...'
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display='flex' justifyContent='flex-end' gap={2}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type='submit' variant='contained' disabled={loading}>
          {loading ? 'Creating...' : 'Create Invitation'}
        </Button>
      </Box>
    </Box>
  );
};

export default InvitationManager;

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
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Shield,
  Key,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    role: string;
    status: string;
    profile: {
      first_name: string;
      last_name: string;
      avatar_url: string;
      two_factor_enabled: boolean;
    };
  } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();
      return result.data;
    },
  });

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    user: {
      id: string;
      email: string;
      role: string;
      status: string;
      profile: {
        first_name: string;
        last_name: string;
        avatar_url: string;
        two_factor_enabled: boolean;
      };
    }
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleView = () => {
    // Navigate to user details
    handleMenuClose();
  };

  const handleRoleChange = () => {
    setRoleDialogOpen(true);
    handleMenuClose();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'system_admin':
        return 'warning';
      case 'admin':
        return 'primary';
      case 'manager':
        return 'info';
      case 'member':
        return 'default';
      case 'guest':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' py={4}>
        <Typography>Loading users...</Typography>
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
        <Typography variant='h6'>User Management</Typography>
        <Button
          variant='contained'
          startIcon={<Plus size={20} />}
          onClick={() => setEditDialogOpen(true)}
        >
          Create User
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display='flex' gap={2} alignItems='center'>
            <TextField
              placeholder='Search users...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select label='Role'>
                <MenuItem value='all'>All Roles</MenuItem>
                <MenuItem value='super_admin'>Super Admin</MenuItem>
                <MenuItem value='admin'>Admin</MenuItem>
                <MenuItem value='manager'>Manager</MenuItem>
                <MenuItem value='member'>Member</MenuItem>
                <MenuItem value='guest'>Guest</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select label='Status'>
                <MenuItem value='all'>All Status</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='suspended'>Suspended</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>2FA</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Associations</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users?.data?.map(
                (user: {
                  id: string;
                  profile: {
                    first_name: string;
                    last_name: string;
                    avatar_url: string;
                    two_factor_enabled: boolean;
                  };
                  email: string;
                  role: string;
                  status: string;
                  last_login_at: string;
                  association_count: number;
                }) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={2}>
                        <Avatar
                          src={user.profile?.avatar_url}
                          sx={{ width: 40, height: 40 }}
                        >
                          {user.profile?.first_name?.[0]}
                          {user.profile?.last_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant='body2' fontWeight='medium'>
                            {user.profile?.first_name} {user.profile?.last_name}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role?.replace('_', ' ').toUpperCase()}
                        color={
                          getRoleColor(user.role) as
                            | 'default'
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'info'
                            | 'success'
                            | 'warning'
                        }
                        size='small'
                        icon={<Shield size={12} />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={
                          getStatusColor(user.status) as
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
                        label={
                          user.profile?.two_factor_enabled
                            ? 'Enabled'
                            : 'Disabled'
                        }
                        color={
                          user.profile?.two_factor_enabled
                            ? 'success'
                            : 'default'
                        }
                        size='small'
                        icon={<Key size={12} />}
                      />
                    </TableCell>
                    <TableCell>
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>{user.association_count || 0}</TableCell>
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        onClick={e => handleMenuClick(e, user)}
                      >
                        <MoreVertical size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {users?.pagination && (
          <Box display='flex' justifyContent='center' p={2}>
            <Pagination
              count={users.pagination.totalPages}
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
        <MenuItem onClick={handleView}>
          <Eye size={16} style={{ marginRight: 8 }} />
          View Profile
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit size={16} style={{ marginRight: 8 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleRoleChange}>
          <Shield size={16} style={{ marginRight: 8 }} />
          Change Role
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>{selectedUser ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box display='flex' gap={2} mb={2}>
              <TextField
                fullWidth
                label='First Name'
                defaultValue={selectedUser?.profile?.first_name || ''}
              />
              <TextField
                fullWidth
                label='Last Name'
                defaultValue={selectedUser?.profile?.last_name || ''}
              />
            </Box>
            <TextField
              fullWidth
              label='Email'
              type='email'
              defaultValue={selectedUser?.email || ''}
              sx={{ mb: 2 }}
            />
            <TextField fullWidth label='Phone' defaultValue='' sx={{ mb: 2 }} />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                defaultValue={selectedUser?.role || 'member'}
                label='Role'
              >
                <MenuItem value='super_admin'>Super Admin</MenuItem>
                <MenuItem value='system_admin'>System Admin</MenuItem>
                <MenuItem value='admin'>Admin</MenuItem>
                <MenuItem value='manager'>Manager</MenuItem>
                <MenuItem value='member'>Member</MenuItem>
                <MenuItem value='guest'>Guest</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch defaultChecked={selectedUser?.status === 'active'} />
              }
              label='Active User'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant='contained'>
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            Changing user roles affects their permissions across the system.
            Please review carefully.
          </Alert>
          <Typography sx={{ mb: 2 }}>
            Current role:{' '}
            <strong>
              {selectedUser?.role?.replace('_', ' ').toUpperCase()}
            </strong>
          </Typography>
          <FormControl fullWidth>
            <InputLabel>New Role</InputLabel>
            <Select
              defaultValue={selectedUser?.role || 'member'}
              label='New Role'
            >
              <MenuItem value='super_admin'>Super Admin</MenuItem>
              <MenuItem value='system_admin'>System Admin</MenuItem>
              <MenuItem value='admin'>Admin</MenuItem>
              <MenuItem value='manager'>Manager</MenuItem>
              <MenuItem value='member'>Member</MenuItem>
              <MenuItem value='guest'>Guest</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button variant='contained'>Update Role</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity='error' sx={{ mb: 2 }}>
            This action cannot be undone. All data associated with this user
            will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete "{selectedUser?.profile?.first_name}{' '}
            {selectedUser?.profile?.last_name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' color='error'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

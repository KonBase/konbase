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
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Building,
  Users,
  Calendar,
  Package,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const AssociationManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAssociation, setSelectedAssociation] = useState<{
    id: string;
    name: string;
    description?: string;
    website?: string;
    email: string;
    status: string;
    member_count: number;
    convention_count: number;
    item_count: number;
    created_at: string;
  } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: associations, isLoading } = useQuery({
    queryKey: ['admin-associations', searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await fetch(`/api/admin/associations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch associations');
      const result = await response.json();
      return result.data;
    },
  });

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    association: {
      id: string;
      name: string;
      email: string;
      status: string;
      member_count: number;
      convention_count: number;
      item_count: number;
      created_at: string;
    }
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAssociation(association);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAssociation(null);
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
    // Navigate to association details
    handleMenuClose();
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
        <Typography>Loading associations...</Typography>
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
        <Typography variant='h6'>Association Management</Typography>
        <Button
          variant='contained'
          startIcon={<Plus size={20} />}
          onClick={() => setEditDialogOpen(true)}
        >
          Create Association
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display='flex' gap={2} alignItems='center'>
            <TextField
              placeholder='Search associations...'
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

      {/* Associations Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Conventions</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(associations?.data ?? []).map(
                (association: {
                  id: string;
                  name: string;
                  email: string;
                  status: string;
                  member_count: number;
                  convention_count: number;
                  item_count: number;
                  created_at: string;
                }) => (
                  <TableRow key={association.id} hover>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={2}>
                        <Building size={20} color='#666' />
                        <Box>
                          <Typography variant='body2' fontWeight='medium'>
                            {association.name}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {association.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={association.status}
                        color={getStatusColor(association.status)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={1}>
                        <Users size={16} color='#666' />
                        {association.member_count || 0}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={1}>
                        <Calendar size={16} color='#666' />
                        {association.convention_count || 0}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={1}>
                        <Package size={16} color='#666' />
                        {association.item_count || 0}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(association.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        onClick={e => handleMenuClick(e, association)}
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

        {associations?.pagination && (
          <Box display='flex' justifyContent='center' p={2}>
            <Pagination
              count={associations.pagination.totalPages}
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
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Edit size={16} style={{ marginRight: 8 }} />
          Edit Association
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete Association
        </MenuItem>
      </Menu>

      {/* Edit Association Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {selectedAssociation ? 'Edit Association' : 'Create Association'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label='Association Name'
              defaultValue={selectedAssociation?.name || ''}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label='Description'
              multiline
              rows={3}
              defaultValue={selectedAssociation?.description || ''}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label='Email'
              type='email'
              defaultValue={selectedAssociation?.email || ''}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label='Website'
              defaultValue={selectedAssociation?.website || ''}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                defaultValue={selectedAssociation?.status || 'active'}
                label='Status'
              >
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='suspended'>Suspended</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant='contained'>
            {selectedAssociation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Association</DialogTitle>
        <DialogContent>
          <Alert severity='warning' sx={{ mb: 2 }}>
            This action cannot be undone. All data associated with this
            association will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete "{selectedAssociation?.name}"?
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

export default AssociationManagement;

'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  Chip,
  TextField,
  InputAdornment,
  Fab,
} from '@mui/material';
import {
  Plus,
  Search,
  Filter,
  Package,
  MapPin,
  Tag,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { DataTable } from '@/components/tables/DataTable';
import { Dialog } from '@/components/ui/dialog';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Item, TableColumn } from '@/types';

export default function InventoryPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory-items', searchQuery, categoryFilter, locationFilter, conditionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (categoryFilter) params.append('categoryId', categoryFilter);
      if (locationFilter) params.append('locationId', locationFilter);
      if (conditionFilter) params.append('condition', conditionFilter);

      const response = await fetch(`/api/inventory/items?${params}`, {
        headers: {
          'x-association-id': session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      const result = await response.json();
      return result.data as Item[];
    },
    enabled: !!session,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/categories', {
        headers: {
          'x-association-id': session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const result = await response.json();
      return result.data;
    },
    enabled: !!session,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/locations', {
        headers: {
          'x-association-id': session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch locations');
      const result = await response.json();
      return result.data;
    },
    enabled: !!session,
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, itemId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(itemId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': case 'broken': return 'error';
      default: return 'default';
    }
  };

  const columns: TableColumn<Item>[] = [
    {
      id: 'name',
      label: 'Item Name',
      sortable: true,
      format: (value, row) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Package size={16} />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {value}
            </Typography>
            {row?.serial_number && (
              <Typography variant="caption" color="text.secondary">
                SN: {row.serial_number}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Category',
      format: (value) => value?.name || 'Uncategorized',
    },
    {
      id: 'location',
      label: 'Location',
      format: (value) => (
        <Box display="flex" alignItems="center" gap={1}>
          <MapPin size={14} />
          {value?.name || 'No location'}
        </Box>
      ),
    },
    {
      id: 'condition',
      label: 'Condition',
      format: (value) => (
        <Chip
          label={value}
          size="small"
          color={getConditionColor(value) as any}
          variant="outlined"
        />
      ),
    },
    {
      id: 'purchase_price',
      label: 'Value',
      align: 'right',
      format: (value) => value ? `$${value.toLocaleString()}` : '—',
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      format: (value, row) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuClick(e, row?.id || '')}
        >
          <MoreVertical size={16} />
        </IconButton>
      ),
    },
  ];

  const categoryOptions = categories.map((cat: any) => ({
    value: cat.id,
    label: cat.name,
  }));

  const locationOptions = locations.map((loc: any) => ({
    value: loc.id,
    label: loc.name,
  }));

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
    { value: 'broken', label: 'Broken' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1">
            Inventory Management
          </Typography>
          <Typography color="text.secondary">
            Manage your items, categories, and locations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Add Item
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as string)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categoryOptions.map((option: any) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value as string)}
                  label="Location"
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {locationOptions.map((option: any) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Condition</InputLabel>
                <Select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value as string)}
                  label="Condition"
                >
                  <MenuItem value="">All Conditions</MenuItem>
                  {conditionOptions.map((option: any) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Filter size={16} />}
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('');
                  setLocationFilter('');
                  setConditionFilter('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Package size={24} color="#1976d2" />
                <Box>
                  <Typography variant="h4">{items.length}</Typography>
                  <Typography color="text.secondary">Total Items</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Tag size={24} color="#388e3c" />
                <Box>
                  <Typography variant="h4">{categories.length}</Typography>
                  <Typography color="text.secondary">Categories</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <MapPin size={24} color="#f57c00" />
                <Box>
                  <Typography variant="h4">{locations.length}</Typography>
                  <Typography color="text.secondary">Locations</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Package size={24} color="#d32f2f" />
                <Box>
                  <Typography variant="h4">
                    {items.filter(item => ['poor', 'broken'].includes(item.condition)).length}
                  </Typography>
                  <Typography color="text.secondary">Need Attention</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items Table */}
      <Card>
        <DataTable
          data={items}
          columns={columns}
          loading={isLoading}
          selectable
          selectedRows={selectedRows}
          onSelectRow={(id) => {
            setSelectedRows(prev => 
              prev.includes(id) 
                ? prev.filter(rowId => rowId !== id)
                : [...prev, id]
            );
          }}
          onSelectAll={(selected) => {
            setSelectedRows(selected ? items.map(item => item.id) : []);
          }}
          emptyMessage="No items found. Add your first item to get started."
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          // Navigate to item details
          handleMenuClose();
        }}>
          <Eye size={16} style={{ marginRight: 8 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          // Navigate to edit item
          handleMenuClose();
        }}>
          <Edit size={16} style={{ marginRight: 8 }} />
          Edit Item
        </MenuItem>
        <MenuItem onClick={() => {
          // Delete item
          handleMenuClose();
        }}>
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete Item
        </MenuItem>
      </Menu>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add item"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus size={24} />
      </Fab>

      {/* Create Item Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Add New Item"
        maxWidth="md"
      >
        <Typography>Item creation form would go here...</Typography>
      </Dialog>
    </Container>
  );
}

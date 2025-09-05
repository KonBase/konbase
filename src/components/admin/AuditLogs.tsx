import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const AuditLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
  });

  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs', searchQuery, page, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const result = await response.json();
      return result.data;
    },
  });

  const { data: logStats } = useQuery({
    queryKey: ['admin-log-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/audit-logs/stats');
      if (!response.ok) throw new Error('Failed to fetch log stats');
      const result = await response.json();
      return result.data;
    },
  });

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return <CheckCircle size={16} color="#4caf50" />;
      case 'update': return <Activity size={16} color="#2196f3" />;
      case 'delete': return <AlertTriangle size={16} color="#f44336" />;
      case 'login': return <User size={16} color="#9c27b0" />;
      default: return <Info size={16} color="#666" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'success';
      case 'update': return 'info';
      case 'delete': return 'error';
      case 'login': return 'secondary';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography>Loading audit logs...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Audit Logs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download size={20} />}
          onClick={handleExport}
        >
          Export Logs
        </Button>
      </Box>

      {/* Statistics Cards */}
      {logStats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Activity size={24} color="#2196f3" />
                <Box>
                  <Typography variant="h6">{logStats.totalActions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Actions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <User size={24} color="#4caf50" />
                <Box>
                  <Typography variant="h6">{logStats.activeUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AlertTriangle size={24} color="#ff9800" />
                <Box>
                  <Typography variant="h6">{logStats.failedActions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed Actions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Calendar size={24} color="#9c27b0" />
                <Box>
                  <Typography variant="h6">{logStats.todayActions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Actions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                label="Action"
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="create">Create</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="login">Login</MenuItem>
                <MenuItem value="logout">Logout</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Resource</InputLabel>
              <Select
                value={filters.resourceType}
                onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
                label="Resource"
              >
                <MenuItem value="">All Resources</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="association">Association</MenuItem>
                <MenuItem value="convention">Convention</MenuItem>
                <MenuItem value="item">Item</MenuItem>
                <MenuItem value="settings">Settings</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<Filter size={16} />}
              onClick={() => setFilters({
                action: '',
                resourceType: '',
                dateFrom: '',
                dateTo: '',
                userId: '',
              })}
            >
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs?.data?.map((log: any) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getActionIcon(log.action)}
                      <Chip
                        label={log.action}
                        color={getActionColor(log.action) as any}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {log.user?.email || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.user?.profile?.first_name} {log.user?.profile?.last_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {log.resource_type}
                      </Typography>
                      {log.resource_id && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {log.resource_id}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {log.action} {log.resource_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {log.ip_address || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(log.created_at).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Eye size={16} />}
                      onClick={() => handleViewDetails(log)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {auditLogs?.pagination && (
          <Box display="flex" justifyContent="center" p={2}>
            <Pagination
              count={auditLogs.pagination.totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Action
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLog.action}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resource Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLog.resource_type}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    User
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLog.user?.email || 'Unknown User'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body1" gutterBottom fontFamily="monospace">
                    {selectedLog.ip_address || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Agent
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLog.user_agent || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {selectedLog.old_values && (
                <Accordion>
                  <AccordionSummary expandIcon={<ChevronDown />}>
                    <Typography variant="subtitle2">Previous Values</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '16px', 
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px'
                    }}>
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedLog.new_values && (
                <Accordion>
                  <AccordionSummary expandIcon={<ChevronDown />}>
                    <Typography variant="subtitle2">New Values</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre style={{ 
                      backgroundColor: '#f5f5f5', 
                      padding: '16px', 
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px'
                    }}>
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogs;

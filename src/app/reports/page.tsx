'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Download,
  Calendar,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Cell } from 'recharts';

export default function ReportsPage() {
  const { data: session } = useSession();
  const [selectedReport, setSelectedReport] = useState('inventory-summary');
  const [dateRange, setDateRange] = useState('30');
  const [associationId] = useState(session?.user?.associations?.[0]?.association?.id || '');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', selectedReport, dateRange, associationId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${selectedReport}?days=${dateRange}`, {
        headers: {
          'x-association-id': associationId,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch report data');
      const result = await response.json();
      return result.data;
    },
    enabled: !!session && !!associationId,
  });

  const reportTypes = [
    {
      id: 'inventory-summary',
      name: 'Inventory Summary',
      description: 'Overview of all inventory items and their status',
      icon: Package,
      color: 'primary',
    },
    {
      id: 'convention-usage',
      name: 'Convention Usage',
      description: 'Equipment usage patterns across conventions',
      icon: Calendar,
      color: 'success',
    },
    {
      id: 'maintenance-alerts',
      name: 'Maintenance Alerts',
      description: 'Items requiring attention or maintenance',
      icon: AlertTriangle,
      color: 'warning',
    },
    {
      id: 'user-activity',
      name: 'User Activity',
      description: 'User engagement and activity metrics',
      icon: Users,
      color: 'info',
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary',
      description: 'Purchase costs and asset valuations',
      icon: TrendingUp,
      color: 'secondary',
    },
  ];

  const renderChart = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'inventory-summary':
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Items by Condition</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <PieChart
                      data={reportData.conditionBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {reportData.conditionBreakdown?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                      ))}
                    </PieChart>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Items by Category</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        );

      case 'convention-usage':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Equipment Usage Over Time</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reportData.usageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="itemsUsed" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      case 'maintenance-alerts':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reportData.alerts?.map((alert: any, index: number) => (
              <Card key={index} sx={{ borderLeft: 4, borderLeftColor: 'warning.main' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{alert.itemName}</Typography>
                      <Typography color="text.secondary">{alert.issue}</Typography>
                    </Box>
                    <Chip
                      label={alert.priority}
                      color={alert.priority === 'high' ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      default:
        return (
          <Card>
            <CardContent>
              <Typography>Select a report type to view data</Typography>
            </CardContent>
          </Card>
        );
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/reports/${selectedReport}/export?days=${dateRange}`, {
        headers: {
          'x-association-id': associationId,
        },
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading reports...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1">
            Reports & Analytics
          </Typography>
          <Typography color="text.secondary">
            Generate insights and track performance metrics
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download size={20} />}
          onClick={handleExport}
          disabled={!reportData}
        >
          Export Report
        </Button>
      </Box>

      {/* Report Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                label="Report Type"
              >
                {reportTypes.map((report) => (
                  <MenuItem key={report.id} value={report.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <report.icon size={16} />
                      {report.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Date Range"
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Report Description */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            {(() => {
              const report = reportTypes.find(r => r.id === selectedReport);
              const IconComponent = report?.icon || BarChart3;
              return <IconComponent size={24} color="#666" />;
            })()}
            <Box>
              <Typography variant="h6">
                {reportTypes.find(r => r.id === selectedReport)?.name}
              </Typography>
              <Typography color="text.secondary">
                {reportTypes.find(r => r.id === selectedReport)?.description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Report Content */}
      {renderChart()}
    </Container>
  );
}

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const SystemOverview: React.FC = () => {
  // Mock data - in real implementation, this would come from API
  const systemHealth = {
    status: 'healthy',
    uptime: '99.9%',
    responseTime: '120ms',
    activeConnections: 1247,
    memoryUsage: 68,
    cpuUsage: 45,
    diskUsage: 23,
  };

  const recentActivity = [
    {
      action: 'New user registered',
      user: 'john.doe@example.com',
      time: '2 minutes ago',
      type: 'info',
    },
    {
      action: 'Association created',
      user: 'admin@konbase.com',
      time: '5 minutes ago',
      type: 'success',
    },
    {
      action: 'Failed login attempt',
      user: 'unknown@example.com',
      time: '8 minutes ago',
      type: 'warning',
    },
    {
      action: 'System backup completed',
      user: 'system',
      time: '1 hour ago',
      type: 'info',
    },
    {
      action: 'Database maintenance',
      user: 'system',
      time: '2 hours ago',
      type: 'info',
    },
  ];

  const performanceData = [
    { time: '00:00', users: 120, requests: 450 },
    { time: '04:00', users: 80, requests: 320 },
    { time: '08:00', users: 200, requests: 680 },
    { time: '12:00', users: 350, requests: 1200 },
    { time: '16:00', users: 280, requests: 950 },
    { time: '20:00', users: 180, requests: 720 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} color='#4caf50' />;
      case 'warning':
        return <AlertTriangle size={16} color='#ff9800' />;
      case 'error':
        return <AlertTriangle size={16} color='#f44336' />;
      default:
        return <Clock size={16} color='#2196f3' />;
    }
  };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        System Health & Performance
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 3,
          mb: 4,
        }}
      >
        {/* System Status */}
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              System Status
            </Typography>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Server size={24} />
              <Box>
                <Typography variant='body1'>Overall Status</Typography>
                <Chip
                  label={systemHealth.status.toUpperCase()}
                  color={
                    getStatusColor(systemHealth.status) as
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
              </Box>
            </Box>
            <Box display='flex' alignItems='center' gap={2} mb={2}>
              <Wifi size={24} />
              <Box>
                <Typography variant='body1'>Uptime</Typography>
                <Typography variant='h6' color='success.main'>
                  {systemHealth.uptime}
                </Typography>
              </Box>
            </Box>
            <Box display='flex' alignItems='center' gap={2}>
              <Clock size={24} />
              <Box>
                <Typography variant='body1'>Response Time</Typography>
                <Typography variant='h6'>
                  {systemHealth.responseTime}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Resource Usage
            </Typography>

            <Box mb={2}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={1}
              >
                <Box display='flex' alignItems='center' gap={1}>
                  <Cpu size={16} />
                  <Typography variant='body2'>CPU Usage</Typography>
                </Box>
                <Typography variant='body2'>
                  {systemHealth.cpuUsage}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={systemHealth.cpuUsage}
                color={systemHealth.cpuUsage > 80 ? 'error' : 'primary'}
              />
            </Box>

            <Box mb={2}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={1}
              >
                <Box display='flex' alignItems='center' gap={1}>
                  <Database size={16} />
                  <Typography variant='body2'>Memory Usage</Typography>
                </Box>
                <Typography variant='body2'>
                  {systemHealth.memoryUsage}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={systemHealth.memoryUsage}
                color={systemHealth.memoryUsage > 80 ? 'error' : 'primary'}
              />
            </Box>

            <Box>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={1}
              >
                <Box display='flex' alignItems='center' gap={1}>
                  <HardDrive size={16} />
                  <Typography variant='body2'>Disk Usage</Typography>
                </Box>
                <Typography variant='body2'>
                  {systemHealth.diskUsage}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={systemHealth.diskUsage}
                color={systemHealth.diskUsage > 80 ? 'error' : 'primary'}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Performance Chart */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 3,
          mb: 4,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Performance Metrics (Last 24 Hours)
            </Typography>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='time' />
                <YAxis />
                <Tooltip />
                <Line
                  type='monotone'
                  dataKey='users'
                  stroke='#8884d8'
                  strokeWidth={2}
                  name='Active Users'
                />
                <Line
                  type='monotone'
                  dataKey='requests'
                  stroke='#82ca9d'
                  strokeWidth={2}
                  name='API Requests'
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Activity */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 3,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.action}
                      secondary={`${activity.user} • ${activity.time}`}
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              System Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary='Active Connections'
                  secondary={systemHealth.activeConnections.toLocaleString()}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary='Database Version'
                  secondary='PostgreSQL 15.4'
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary='Application Version'
                  secondary='KonBase v2.0.0'
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary='Last Backup' secondary='2 hours ago' />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SystemOverview;

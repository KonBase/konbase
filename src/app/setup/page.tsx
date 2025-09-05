'use client';

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Tabs, Tab } from '@mui/material';
import { SetupWizard } from '@/components/setup/SetupWizard';
import AutoSetupWizard from '@/components/setup/AutoSetupWizard';

export default function SetupPage() {
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Check if setup is already complete
      const setupComplete = localStorage.getItem('konbase-setup-complete');
      if (setupComplete) {
        window.location.href = '/auth/signin';
        return;
      }

      // Check database for setup status
      const response = await fetch('/api/setup/status');
      if (response.ok) {
        const result = await response.json();
        if (result.setupComplete) {
          localStorage.setItem('konbase-setup-complete', 'true');
          window.location.href = '/auth/signin';
        } else {
          setNeedsSetup(true);
        }
      } else {
        setNeedsSetup(true);
      }
    } catch (error) {
      console.error('Setup check error:', error);
      setNeedsSetup(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography>Checking setup status...</Typography>
      </Box>
    );
  }

  if (needsSetup) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          KonBase Setup
        </Typography>
        
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Auto Setup" />
          <Tab label="Manual Setup" />
        </Tabs>

        {activeTab === 0 && <AutoSetupWizard />}
        {activeTab === 1 && <SetupWizard />}
      </Box>
    );
  }

  return null;
}

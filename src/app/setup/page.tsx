'use client';

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { SetupWizard } from '@/components/setup/SetupWizard';

export default function SetupPage() {
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

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
      // eslint-disable-next-line no-console
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
    return <SetupWizard />;
  }

  return null;
}

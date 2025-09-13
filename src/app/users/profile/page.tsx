'use client';
import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  TextField as MuiTextField,
} from '@mui/material';
import { Shield, Crown } from 'lucide-react';
import TextField from '@/components/ui/TextField';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { AdminElevationDialog } from '@/components/admin/AdminElevationDialog';

export default function UserProfilePage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState(0);
  const [, setProfile] = useState<{
    display_name: string;
    avatar_url: string;
  } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [elevationDialogOpen, setElevationDialogOpen] = useState(false);
  const infoForm = useForm<{ display_name: string; avatar_url: string }>();
  const pwdForm = useForm<{ currentPassword: string; newPassword: string }>();
  const accForm = useForm<{
    prefersHighContrast: boolean;
    prefersLargeText: boolean;
  }>();

  const { data: isSuperAdmin } = useQuery({
    queryKey: ['admin-check'],
    queryFn: async () => {
      const response = await fetch('/api/admin/check-permissions');
      if (!response.ok) return false;
      const result = await response.json();
      return result.isSuperAdmin;
    },
    enabled: !!session,
  });

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const j = await res.json();
        setProfile(j.data);
        infoForm.reset({
          display_name: j.data?.display_name || '',
          avatar_url: j.data?.avatar_url || '',
        });
        const pref = j.data?.preferences || {};
        accForm.reset({
          prefersHighContrast: !!pref.prefersHighContrast,
          prefersLargeText: !!pref.prefersLargeText,
        });
      }
    })();
  }, [accForm, infoForm, setProfile]);

  const saveInfo = async (v: { display_name: string; avatar_url: string }) => {
    setMsg(null);
    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...v }),
    });
    setMsg(res.ok ? 'Profile updated' : 'Update failed');
  };
  const changePassword = async (v: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setMsg(null);
    const res = await fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    setMsg(res.ok ? 'Password changed' : 'Password change failed');
  };
  const saveAccessibility = async (v: {
    prefersHighContrast: boolean;
    prefersLargeText: boolean;
  }) => {
    setMsg(null);
    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: v }),
    });
    setMsg(res.ok ? 'Preferences saved' : 'Save failed');
  };

  const handleElevationSuccess = () => {
    // Redirect to admin panel
    window.location.href = '/admin';
  };

  return (
    <Container maxWidth='md' sx={{ py: 4 }}>
      <Typography variant='h5' gutterBottom>
        User Settings
      </Typography>
      {msg && (
        <Alert severity='success' sx={{ mb: 2 }}>
          {msg}
        </Alert>
      )}

      {/* Admin Panel Access */}
      {isSuperAdmin && (
        <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
            >
              <Box display='flex' alignItems='center' gap={2}>
                <Crown size={24} color='#1976d2' />
                <Box>
                  <Typography variant='h6' gutterBottom>
                    Super Admin Access
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    You have super admin privileges. Access the admin panel to
                    manage the system.
                  </Typography>
                </Box>
              </Box>
              <Button
                variant='contained'
                startIcon={<Shield size={20} />}
                onClick={() => setElevationDialogOpen(true)}
                size='large'
              >
                Access Admin Panel
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label='Profile' />
        <Tab label='Password' />
        <Tab label='Accessibility' />
        <Tab label='Two-Factor' />
      </Tabs>

      {tab === 0 && (
        <Box component='form' onSubmit={infoForm.handleSubmit(saveInfo)}>
          <TextField
            control={infoForm.control}
            name='display_name'
            label='Display name'
            required
          />
          <TextField
            control={infoForm.control}
            name='avatar_url'
            label='Avatar URL'
          />
          <Button type='submit' variant='contained'>
            Save
          </Button>
        </Box>
      )}

      {tab === 1 && (
        <Box component='form' onSubmit={pwdForm.handleSubmit(changePassword)}>
          <TextField
            control={pwdForm.control}
            name='currentPassword'
            label='Current Password'
            type='password'
            required
          />
          <TextField
            control={pwdForm.control}
            name='newPassword'
            label='New Password'
            type='password'
            required
          />
          <Button type='submit' variant='contained'>
            Change password
          </Button>
        </Box>
      )}

      {tab === 2 && (
        <Box
          component='form'
          onSubmit={accForm.handleSubmit(saveAccessibility)}
        >
          {/* Simple accessibility options */}
          <TextField
            control={accForm.control}
            name={'prefersHighContrast'}
            label='High Contrast (true/false)'
          />
          <TextField
            control={accForm.control}
            name={'prefersLargeText'}
            label='Large Text (true/false)'
          />
          <Button type='submit' variant='contained'>
            Save preferences
          </Button>
        </Box>
      )}

      {tab === 3 && <TwoFactorSection />}

      {/* Admin Elevation Dialog */}
      <AdminElevationDialog
        open={elevationDialogOpen}
        onClose={() => setElevationDialogOpen(false)}
        onSuccess={handleElevationSuccess}
      />
    </Container>
  );
}

function TwoFactorSection() {
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [code, setCode] = useState('');

  const startSetup = async () => {
    const res = await fetch('/api/users/totp', { method: 'POST' });
    if (res.ok) {
      const j = await res.json();
      setSecret(j.secret);
      setOtpauth(j.otpauth_url);
    }
  };
  const enable = async () => {
    if (!secret || !code) return;
    const res = await fetch('/api/users/totp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, token: code }),
    });
    if (res.ok) {
      const j = await res.json();
      setRecovery(j.recovery);
    }
  };
  const disable = async () => {
    await fetch('/api/users/totp', { method: 'DELETE' });
    setSecret(null);
    setOtpauth(null);
    setRecovery(null);
    setCode('');
  };

  return (
    <Box>
      {!secret && !recovery && (
        <Button variant='outlined' onClick={startSetup}>
          Start TOTP Setup
        </Button>
      )}
      {secret && !recovery && (
        <Box sx={{ mt: 2 }}>
          <Typography>Secret: {secret}</Typography>
          {otpauth && (
            <Typography sx={{ wordBreak: 'break-all' }}>{otpauth}</Typography>
          )}
          <Box sx={{ mt: 2 }}>
            <MuiTextField
              label='Enter code from app'
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCode(e.target.value)
              }
              variant='outlined'
              size='small'
              autoComplete='one-time-code'
              sx={{ width: 200 }}
            />
            <Button sx={{ ml: 2 }} variant='contained' onClick={enable}>
              Enable
            </Button>
          </Box>
        </Box>
      )}
      {recovery && (
        <Box sx={{ mt: 2 }}>
          <Typography variant='subtitle1'>
            Recovery codes (store securely):
          </Typography>
          <pre>{recovery.join('\n')}</pre>
          <Button color='error' onClick={disable}>
            Disable 2FA
          </Button>
        </Box>
      )}
    </Box>
  );
}

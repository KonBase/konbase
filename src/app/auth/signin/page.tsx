'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Container,
  Typography,
  Alert,
  Stack,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowLeft,
  Github,
  Chrome,
} from 'lucide-react';
import TextField from '@/components/ui/TextField';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  totpCode: z.string().optional(),
});

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(params.get('error'));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        totpCode: values.totpCode,
      });

      if (res?.ok) {
        router.push('/dashboard');
      } else {
        setError(
          res?.error === 'CredentialsSignin'
            ? 'Invalid email or password'
            : res?.error || 'Login failed'
        );
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch {
      setError('OAuth sign-in failed');
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth='sm' sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Sign in to your KonBase account
        </Typography>
      </Box>

      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity='error' sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component='form' onSubmit={form.handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <TextField
                name='email'
                control={form.control}
                label='Email Address'
                type='email'
                required
                autoComplete='email'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Mail size={20} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                name='password'
                control={form.control}
                label='Password'
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete='current-password'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge='end'
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                name='totpCode'
                control={form.control}
                label='2FA Code (if enabled)'
                placeholder='Enter 6-digit code'
                autoComplete='one-time-code'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Shield size={20} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type='submit'
                variant='contained'
                size='large'
                fullWidth
                disabled={isLoading}
                sx={{ py: 1.5 }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant='body2' color='text.secondary'>
              Or continue with
            </Typography>
          </Divider>

          <Stack direction='row' spacing={2}>
            <Button
              variant='outlined'
              fullWidth
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              startIcon={<Chrome size={20} />}
            >
              Google
            </Button>
            <Button
              variant='outlined'
              fullWidth
              onClick={() => handleOAuthSignIn('discord')}
              disabled={isLoading}
              startIcon={<Github size={20} />}
            >
              Discord
            </Button>
          </Stack>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link
              component='button'
              variant='body2'
              onClick={() => router.push('/auth/forgot')}
              sx={{ mr: 2 }}
            >
              Forgot Password?
            </Link>
            <Link
              component='button'
              variant='body2'
              onClick={() => router.push('/auth/signup')}
            >
              Create Account
            </Link>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Button
          variant='text'
          startIcon={<ArrowLeft size={16} />}
          onClick={() => router.push('/')}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}

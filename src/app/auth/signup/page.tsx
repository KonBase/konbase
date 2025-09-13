'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  Github,
  Chrome,
  Gift,
} from 'lucide-react';
import TextField from '@/components/ui/TextField';

const schema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
    invitationCode: z.string().optional(),
    acceptTerms: z
      .boolean()
      .refine(val => val === true, 'You must accept the terms and conditions'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const invitationCode = params.get('code');

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      invitationCode: invitationCode || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: values.displayName,
          email: values.email,
          password: values.password,
          invitationCode: values.invitationCode,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Auto sign in after successful registration
        setTimeout(async () => {
          await signIn('credentials', {
            redirect: false,
            email: values.email,
            password: values.password,
          });
          router.push('/dashboard');
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Sign up failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch {
      setError('OAuth sign-up failed');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth='sm' sx={{ py: 6 }}>
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant='h5' gutterBottom color='success.main'>
              Account Created Successfully!
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Welcome to KonBase! You're being signed in automatically...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth='sm' sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant='h4' component='h1' gutterBottom>
          Join KonBase
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Create your account to get started
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
                name='displayName'
                control={form.control}
                label='Display Name'
                required
                autoComplete='name'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <User size={20} />
                    </InputAdornment>
                  ),
                }}
              />

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
                autoComplete='new-password'
                helperText='Must contain uppercase, lowercase, and number'
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
                name='confirmPassword'
                control={form.control}
                label='Confirm Password'
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete='new-password'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge='end'
                      >
                        {showConfirmPassword ? (
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
                name='invitationCode'
                control={form.control}
                label='Invitation Code (Optional)'
                placeholder='Enter invitation code if you have one'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Gift size={20} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox {...form.register('acceptTerms')} color='primary' />
                }
                label={
                  <Typography variant='body2'>
                    I agree to the{' '}
                    <Link href='/terms' target='_blank'>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href='/privacy' target='_blank'>
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />

              <Button
                type='submit'
                variant='contained'
                size='large'
                fullWidth
                disabled={isLoading}
                sx={{ py: 1.5 }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant='body2' color='text.secondary'>
              Or sign up with
            </Typography>
          </Divider>

          <Stack direction='row' spacing={2}>
            <Button
              variant='outlined'
              fullWidth
              onClick={() => handleOAuthSignUp('google')}
              disabled={isLoading}
              startIcon={<Chrome size={20} />}
            >
              Google
            </Button>
            <Button
              variant='outlined'
              fullWidth
              onClick={() => handleOAuthSignUp('discord')}
              disabled={isLoading}
              startIcon={<Github size={20} />}
            >
              Discord
            </Button>
          </Stack>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant='body2' color='text.secondary'>
              Already have an account?{' '}
              <Link
                component='button'
                variant='body2'
                onClick={() => router.push('/auth/signin')}
              >
                Sign In
              </Link>
            </Typography>
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

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}

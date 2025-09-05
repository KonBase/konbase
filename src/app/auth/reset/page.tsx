'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Alert, 
  Stack, 
  Card, 
  CardContent,
  IconButton,
  InputAdornment,
  Link
} from '@mui/material'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import TextField from '@/components/ui/TextField'
import { useState, Suspense } from 'react'

const schema = z.object({ 
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirm: z.string().min(8, 'Password must be at least 8 characters')
}).refine(v => v.password === v.confirm, { 
  message: 'Passwords do not match', 
  path: ['confirm'] 
})

function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get('token')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
  
  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null)
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/reset', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ token, password: values.password }) 
      })
      
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Password reset failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <AlertTriangle size={48} color="#f44336" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom color="error">
              Invalid Reset Link
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              This password reset link is invalid or has expired. Please request a new one.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/auth/forgot')}
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </Container>
    )
  }

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircle size={48} color="#4caf50" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom color="success.main">
              Password Reset Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your password has been updated. Redirecting to sign in...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reset Your Password
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your new password below
        </Typography>
      </Box>

      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <TextField
                name="password"
                control={form.control}
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                helperText="Must contain uppercase, lowercase, and number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                name="confirm"
                control={form.control}
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isLoading}
                sx={{ py: 1.5 }}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link
                component="button"
                variant="body2"
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
          variant="text"
          startIcon={<ArrowLeft size={16} />}
          onClick={() => router.push('/')}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

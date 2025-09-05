'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Alert, 
  Stack, 
  Card, 
  CardContent,
  IconButton,
  InputAdornment,
  Link
} from '@mui/material'
import { 
  Mail, 
  ArrowLeft,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import TextField from '@/components/ui/TextField'

const schema = z.object({ 
  email: z.string().email('Enter a valid email address') 
})

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null)
    setStatus(null)
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      
      if (res.ok) {
        setStatus('If an account with this email exists, a password reset link has been sent.')
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to request password reset')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    setStatus(null)
    setError(null)
    form.reset()
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Forgot Password?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your email address and we'll send you a link to reset your password
        </Typography>
      </Box>

      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {status ? (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircle size={48} color="#4caf50" style={{ marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom color="success.main">
                Check Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {status}
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw size={16} />}
                  onClick={handleResend}
                >
                  Send Another Email
                </Button>
                <Button
                  variant="text"
                  onClick={() => router.push('/auth/signin')}
                >
                  Back to Sign In
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <TextField
                  name="email"
                  control={form.control}
                  label="Email Address"
                  type="email"
                  required
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={20} />
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
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </Stack>
            </Box>
          )}

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

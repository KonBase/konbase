'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Alert, 
  Card, 
  CardContent,
  Stack
} from '@mui/material'
import { 
  AlertTriangle, 
  ArrowLeft,
  RefreshCw,
  Shield
} from 'lucide-react'

function AuthErrorForm() {
  const params = useSearchParams()
  const router = useRouter()
  const error = params.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          message: 'There is a problem with the server configuration. Please contact support.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in. Please contact an administrator.',
          icon: <Shield size={48} color="#f44336" />
        }
      case 'Verification':
        return {
          title: 'Verification Failed',
          message: 'The verification token has expired or has already been used. Please try again.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'OAuthSignin':
        return {
          title: 'OAuth Sign-in Error',
          message: 'There was an error with the OAuth provider. Please try again or use email/password.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'OAuthCallback':
        return {
          title: 'OAuth Callback Error',
          message: 'There was an error processing the OAuth callback. Please try again.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'OAuthCreateAccount':
        return {
          title: 'Account Creation Failed',
          message: 'Could not create account with OAuth provider. Please try again or use email/password.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'EmailCreateAccount':
        return {
          title: 'Account Creation Failed',
          message: 'Could not create account with this email. Please try again.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'Callback':
        return {
          title: 'Callback Error',
          message: 'There was an error with the authentication callback. Please try again.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          message: 'This email is already associated with another account. Please sign in with your original method.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'EmailSignin':
        return {
          title: 'Email Sign-in Error',
          message: 'There was an error sending the sign-in email. Please try again.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'CredentialsSignin':
        return {
          title: 'Sign-in Failed',
          message: 'Invalid email or password. Please check your credentials and try again.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
      case 'SessionRequired':
        return {
          title: 'Session Required',
          message: 'Please sign in to access this page.',
          icon: <Shield size={48} color="#f44336" />
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication. Please try again.',
          icon: <AlertTriangle size={48} color="#f44336" />
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Authentication Error
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Something went wrong during the authentication process
        </Typography>
      </Box>

      <Card elevation={2}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            {errorInfo.icon}
          </Box>
          
          <Typography variant="h6" gutterBottom color="error">
            {errorInfo.title}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {errorInfo.message}
          </Typography>

          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Error Code:</strong> {error || 'Unknown'}
            </Typography>
          </Alert>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<RefreshCw size={16} />}
              onClick={() => router.push('/auth/signin')}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/')}
            >
              Go Home
            </Button>
          </Stack>
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

      {/* Help Section */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            If you continue to experience issues, please try the following:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Clear your browser cookies and cache
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Try using a different browser or incognito mode
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Check if you have any browser extensions blocking the authentication
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Contact support if the problem persists
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorForm />
    </Suspense>
  )
}

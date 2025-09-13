'use client';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function DashboardPage() {
  const router = useRouter();
  return (
    <AppLayout>
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Typography variant='h4' gutterBottom>
          Dashboard
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' },
            gap: 3,
          }}
        >
          <Box>
            <Card>
              <CardContent>
                <Typography variant='h6'>User Setup</Typography>
                <Box mt={2}>
                  <Button
                    variant='outlined'
                    onClick={() => router.push('/users/profile')}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent>
                <Typography variant='h6'>Inventory</Typography>
                <Box mt={2}>
                  <Button
                    variant='outlined'
                    onClick={() => router.push('/inventory')}
                  >
                    Browse Items
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent>
                <Typography variant='h6'>Conventions</Typography>
                <Box mt={2}>
                  <Button
                    variant='outlined'
                    onClick={() => router.push('/conventions')}
                  >
                    View Conventions
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </AppLayout>
  );
}

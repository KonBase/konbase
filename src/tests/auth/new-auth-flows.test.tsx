import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { AuthProvider } from '@/contexts/auth';
import { ReauthProvider } from '@/contexts/ReauthContext';
import { supabase } from '@/lib/supabase';
import LoginForm from '@/components/auth/LoginForm';
import EmailChange from '@/components/settings/EmailChange';
import { useSensitiveAction } from '@/components/auth/withReauth';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
    loading: false,
    refreshProfile: vi.fn(),
  }),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <ReauthProvider>
              {children}
            </ReauthProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('New Authentication Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Magic Link Authentication', () => {
    it('should render magic link button in login form', () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      expect(screen.getByText('Send Magic Link')).toBeInTheDocument();
    });

    it('should show magic link sent message after successful request', async () => {
      (supabase.auth.signInWithOtp as any).mockResolvedValueOnce({
        error: null,
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Fill email field
      const emailInput = screen.getByPlaceholderText('m@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Click magic link button
      const magicLinkButton = screen.getByText('Send Magic Link');
      fireEvent.click(magicLinkButton);

      await waitFor(() => {
        expect(screen.getByText('Magic link sent!')).toBeInTheDocument();
      });
    });

    it('should show error message for invalid email', async () => {
      (supabase.auth.signInWithOtp as any).mockResolvedValueOnce({
        error: { message: 'Invalid email address' },
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Click magic link button without email
      const magicLinkButton = screen.getByText('Send Magic Link');
      fireEvent.click(magicLinkButton);

      await waitFor(() => {
        expect(screen.getByText('Email required')).toBeInTheDocument();
      });
    });
  });

  describe('Email Change Functionality', () => {
    it('should render email change form', () => {
      render(
        <TestWrapper>
          <EmailChange />
        </TestWrapper>
      );

      expect(screen.getByText('Change Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('New Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Email Address')).toBeInTheDocument();
    });

    it('should show current email address', () => {
      render(
        <TestWrapper>
          <EmailChange />
        </TestWrapper>
      );

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      render(
        <TestWrapper>
          <EmailChange />
        </TestWrapper>
      );

      const newEmailInput = screen.getByLabelText('New Email Address');
      const confirmEmailInput = screen.getByLabelText('Confirm New Email Address');
      const submitButton = screen.getByText('Change Email Address');

      // Enter invalid email
      fireEvent.change(newEmailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(confirmEmailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
      });
    });

    it('should validate email confirmation match', async () => {
      render(
        <TestWrapper>
          <EmailChange />
        </TestWrapper>
      );

      const newEmailInput = screen.getByLabelText('New Email Address');
      const confirmEmailInput = screen.getByLabelText('Confirm New Email Address');
      const submitButton = screen.getByText('Change Email Address');

      // Enter mismatched emails
      fireEvent.change(newEmailInput, { target: { value: 'new@example.com' } });
      fireEvent.change(confirmEmailInput, { target: { value: 'different@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email addresses don't match")).toBeInTheDocument();
      });
    });
  });

  describe('Re-authentication Flow', () => {
    it('should render re-authentication dialog when required', async () => {
      const TestComponent = () => {
        const sensitiveAction = useSensitiveAction({
          actionName: 'delete account',
          requirePassword: true,
        });

        const handleDelete = () => {
          sensitiveAction(() => {
            console.log('Account deleted');
          });
        };

        return <button onClick={handleDelete}>Delete Account</button>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const deleteButton = screen.getByText('Delete Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Security Verification Required')).toBeInTheDocument();
      });
    });

    it('should show password field in re-authentication dialog', async () => {
      const TestComponent = () => {
        const sensitiveAction = useSensitiveAction({
          actionName: 'delete account',
          requirePassword: true,
        });

        const handleDelete = () => {
          sensitiveAction(() => {
            console.log('Account deleted');
          });
        };

        return <button onClick={handleDelete}>Delete Account</button>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const deleteButton = screen.getByText('Delete Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
      });
    });

    it('should allow canceling re-authentication', async () => {
      const TestComponent = () => {
        const sensitiveAction = useSensitiveAction({
          actionName: 'delete account',
          requirePassword: true,
        });

        const handleDelete = () => {
          sensitiveAction(() => {
            console.log('Account deleted');
          });
        };

        return <button onClick={handleDelete}>Delete Account</button>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const deleteButton = screen.getByText('Delete Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Security Verification Required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should complete full magic link flow', async () => {
      (supabase.auth.signInWithOtp as any).mockResolvedValueOnce({
        error: null,
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Enter email and click magic link
      const emailInput = screen.getByPlaceholderText('m@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const magicLinkButton = screen.getByText('Send Magic Link');
      fireEvent.click(magicLinkButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'test@example.com',
          options: {
            emailRedirectTo: expect.stringContaining('/auth/callback'),
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Magic link sent!')).toBeInTheDocument();
      });
    });

    it('should complete full email change flow with re-authentication', async () => {
      (supabase.auth.updateUser as any).mockResolvedValueOnce({
        error: null,
      });
      (supabase.auth.signInWithPassword as any).mockResolvedValueOnce({
        error: null,
      });

      render(
        <TestWrapper>
          <EmailChange />
        </TestWrapper>
      );

      const newEmailInput = screen.getByLabelText('New Email Address');
      const confirmEmailInput = screen.getByLabelText('Confirm New Email Address');
      const submitButton = screen.getByText('Change Email Address');

      // Fill form
      fireEvent.change(newEmailInput, { target: { value: 'newemail@example.com' } });
      fireEvent.change(confirmEmailInput, { target: { value: 'newemail@example.com' } });
      fireEvent.click(submitButton);

      // Should show re-authentication dialog
      await waitFor(() => {
        expect(screen.getByText('Security Verification Required')).toBeInTheDocument();
      });

      // Fill password in re-auth dialog
      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const verifyButton = screen.getByText('Verify Identity');
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });
});

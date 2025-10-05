import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SuperAdminDemotionButton } from '@/components/admin/SuperAdminDemotionButton';
import { AuthProvider } from '@/contexts/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { role: 'super_admin' },
            error: null
          }))
        }))
      }))
    })),
    functions: {
      invoke: vi.fn(() => ({
        data: { success: true, message: 'Successfully demoted from super admin' },
        error: null
      }))
    }
  }
}));

// Mock useAuth hook
const mockUseAuth = {
  session: {
    user: { id: 'test-user-id' },
    access_token: 'test-token'
  }
};

vi.mock('@/contexts/auth/useAuth', () => ({
  useAuth: () => mockUseAuth
}));

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('SuperAdminDemotionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders demotion button for super admin users', async () => {
    render(
      <AuthProvider>
        <SuperAdminDemotionButton />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Demote from Super Admin')).toBeInTheDocument();
    });
  });

  it('opens confirmation dialog when button is clicked', async () => {
    render(
      <AuthProvider>
        <SuperAdminDemotionButton />
      </AuthProvider>
    );

    const demoteButton = await screen.findByText('Demote from Super Admin');
    fireEvent.click(demoteButton);

    expect(screen.getByText('Super Admin Demotion')).toBeInTheDocument();
    expect(screen.getByText(/This will remove your super admin privileges/)).toBeInTheDocument();
  });

  it('calls demote function when confirmed', async () => {
    const mockInvoke = vi.fn(() => ({
      data: { success: true, message: 'Successfully demoted from super admin' },
      error: null
    }));
    
    vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

    render(
      <AuthProvider>
        <SuperAdminDemotionButton />
      </AuthProvider>
    );

    const demoteButton = await screen.findByText('Demote from Super Admin');
    fireEvent.click(demoteButton);

    const confirmButton = await screen.findByText('Confirm Demotion');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('demote-from-super-admin', {
        headers: {
          Authorization: 'Bearer test-token'
        }
      });
    });
  });

  it('redirects to admin panel with success message after demotion', async () => {
    const mockInvoke = vi.fn(() => ({
      data: { success: true, message: 'Successfully demoted from super admin' },
      error: null
    }));
    
    vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

    render(
      <AuthProvider>
        <SuperAdminDemotionButton />
      </AuthProvider>
    );

    const demoteButton = await screen.findByText('Demote from Super Admin');
    fireEvent.click(demoteButton);

    const confirmButton = await screen.findByText('Confirm Demotion');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockLocation.href).toBe('/admin?demotion=success');
    });
  });

  it('shows error message when demotion fails', async () => {
    const mockInvoke = vi.fn(() => ({
      data: null,
      error: { message: 'Demotion failed' }
    }));
    
    vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

    render(
      <AuthProvider>
        <SuperAdminDemotionButton />
      </AuthProvider>
    );

    const demoteButton = await screen.findByText('Demote from Super Admin');
    fireEvent.click(demoteButton);

    const confirmButton = await screen.findByText('Confirm Demotion');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Demotion Failed')).toBeInTheDocument();
    });
  });
});

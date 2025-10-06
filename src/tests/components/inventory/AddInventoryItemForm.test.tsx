import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddInventoryItemForm from '@/components/inventory/InventoryItems'; // Adjust path if needed

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [{ id: 'loc1', name: 'Storage' }], error: null }), // Mock locations fetch
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }),
  },
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: { id: 'a1' } }),
}));

describe('AddInventoryItemForm', () => {
  it('renders form fields', async () => {
    render(<AddInventoryItemForm onSuccess={vi.fn()} />);
    // Wait for locations to load if async
    await screen.findByLabelText(/Name/i);

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Item/i)).toBeInTheDocument();
  });

  it('submits form data', async () => {
    const onSuccessMock = vi.fn();
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: (table: string) => ({
          insert: table === 'items' ? insertMock : vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockResolvedValue({ data: [{ id: 'loc1', name: 'Storage' }], error: null }),
          order: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        }),
      },
    }));
    const AddInventoryItemFormReloaded = require('@/components/inventory/AddInventoryItemForm').default;

    render(<AddInventoryItemFormReloaded onSuccess={onSuccessMock} />);
    await screen.findByLabelText(/Name/i); // Ensure form is ready

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Tent' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '2' } });
    // Assuming location is a select - needs interaction based on actual implementation
    // fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'loc1' } });

    fireEvent.click(screen.getByText(/Add Item/i));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Tent',
        quantity: 2,
        association_id: 'a1',
        // location_id: 'loc1', // Add if location select is handled
      }));
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  it('shows validation errors', async () => {
     render(<AddInventoryItemForm onSuccess={vi.fn()} />);
     await screen.findByLabelText(/Name/i); // Ensure form is ready

     fireEvent.click(screen.getByText(/Add Item/i));

     // Check for error messages (adjust based on actual validation messages)
     expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
     expect(await screen.findByText(/Quantity must be a positive number/i)).toBeInTheDocument();
   });
});

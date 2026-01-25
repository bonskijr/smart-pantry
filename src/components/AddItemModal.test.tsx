import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddItemModal from './AddItemModal';

// Mock fetch globally
global.fetch = vi.fn();

describe('AddItemModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onItemAdded: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Default: return empty items list for category fetch
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    it('renders correctly when open', async () => {
        render(<AddItemModal {...defaultProps} />);
        expect(screen.getByText('Add New Item')).toBeInTheDocument();
        // Wait for effect to run to avoid act warnings
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    it('does not render when closed', () => {
        render(<AddItemModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Add New Item')).not.toBeInTheDocument();
    });

    it('toggles new category input', async () => {
        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        
        const toggleBtn = screen.getByText('Create New');
        fireEvent.click(toggleBtn);
        
        expect(screen.getByPlaceholderText('New Category Name')).toBeInTheDocument();
        expect(screen.getByText('Select Existing')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Select Existing'));
        expect(screen.queryByPlaceholderText('New Category Name')).not.toBeInTheDocument();
    });

    it('submits new category before item', async () => {
        // Setup mocks strictly
        (global.fetch as any)
            .mockResolvedValueOnce({ // 1. Initial items fetch (categories)
                ok: true,
                json: async () => [],
            })
            .mockResolvedValueOnce({ // 2. POST /categories
                ok: true,
                json: async () => ({ id: 100, name: 'New Cat' }),
            })
            .mockResolvedValueOnce({ // 3. POST /items
                ok: true,
                json: async () => ({ id: 200, name: 'New Item' }),
            });

        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1)); // Wait for initial fetch
        
        // Switch to new category
        const toggleBtn = screen.getByText('Create New');
        fireEvent.click(toggleBtn);
        
        // Fill form
        fireEvent.change(screen.getByPlaceholderText('Enter item name'), { target: { value: 'New Item' } });
        fireEvent.change(screen.getByPlaceholderText('New Category Name'), { target: { value: 'New Cat' } });
        
        // Submit
        const submitBtn = screen.getByText('Add Item');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            // We expect 3 calls (Fetch Items -> Create Cat -> Create Item)
            expect(global.fetch).toHaveBeenCalledTimes(3); 
        });

        // Verify category creation call
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/categories'), expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'New Cat' })
        }));

        // Verify item creation call with new category ID
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/items'), expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"categoryId":100')
        }));

        expect(defaultProps.onItemAdded).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('resets form when reopened', async () => {
        const { rerender } = render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
        
        fireEvent.change(screen.getByPlaceholderText('Enter item name'), { target: { value: 'Test Name' } });
        expect(screen.getByPlaceholderText('Enter item name')).toHaveValue('Test Name');
        
        // Close
        rerender(<AddItemModal {...defaultProps} isOpen={false} />);
        
        // Open
        rerender(<AddItemModal {...defaultProps} isOpen={true} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled()); // Fetch happens again on reopen
        
        expect(screen.getByPlaceholderText('Enter item name')).toHaveValue('');
    });

    it('displays formatted error message on failure', async () => {
        const errorObj = { _errors: [], name: { _errors: ['Required'] } };
        
        // Reset mocks to clear previous behavior
        vi.clearAllMocks();
        (global.fetch as any)
            .mockResolvedValueOnce({ // 1. Initial items fetch
                 ok: true, json: async () => []
            })
            .mockResolvedValueOnce({ // 2. Create Cat
                 ok: true, json: async () => ({ id: 50 })
            })
            .mockResolvedValueOnce({ // 3. Create Item Fail
                 ok: false, 
                 json: async () => ({ error: errorObj })
            });

        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
        
        fireEvent.change(screen.getByPlaceholderText('Enter item name'), { target: { value: 'Item' } });
        fireEvent.click(screen.getByText('Create New'));
        fireEvent.change(screen.getByPlaceholderText('New Category Name'), { target: { value: 'Cat' } });
        
        fireEvent.click(screen.getByText('Add Item'));

        await waitFor(() => {
            expect(screen.getByText(JSON.stringify(errorObj))).toBeInTheDocument();
        });
    });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Dashboard from './Dashboard';

global.fetch = vi.fn();

describe('Dashboard', () => {
    const mockItems = [
        { id: '1', name: 'Fresh Item', quantity: 5, expirationDate: '2026-12-31', categoryId: 'c1', createdAt: '2026-01-01', category: { name: 'Fruits' } },
        { id: '2', name: 'Expiring Item', quantity: 2, expirationDate: '2026-01-20', categoryId: 'c2', createdAt: '2026-01-01', category: { name: 'Dairy' } }
    ];

    const mockExpiring = [
        { id: '2', name: 'Expiring Item', quantity: 2, expirationDate: '2026-01-20', categoryId: 'c2', createdAt: '2026-01-01', category: { name: 'Dairy' } }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Dashboard fetches /items and /expiring in parallel
        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes('/items')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockItems,
                });
            }
            if (url.includes('/expiring')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockExpiring,
                });
            }
            return Promise.reject(new Error(`Unknown URL: ${url}`));
        });
    });

    it('renders combined stats correctly', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.getByText('Fresh Item')).toBeInTheDocument());
        
        // Total Quantity: 5 + 2 = 7
        expect(screen.getByText('7')).toBeInTheDocument(); 
    });

    it('filters to expiring items when "Expiring Soon" is clicked', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.getByText('Fresh Item')).toBeInTheDocument());

        // Find "Expiring Soon" card and click it
        const expiringCardTitle = screen.getByText('Expiring Soon');
        fireEvent.click(expiringCardTitle.closest('.glass-panel')!);

        // Should now show "Expiring Items" header
        await waitFor(() => expect(screen.getByText('Expiring Items')).toBeInTheDocument());
        
        // Should show Expiring Item
        expect(screen.getByText('Expiring Item')).toBeInTheDocument();
        // Should NOT show Fresh Item
        expect(screen.queryByText('Fresh Item')).not.toBeInTheDocument();
    });

    it('resets to all items when "Combined Banner" or "Clear Filters" is clicked', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.getByText('Fresh Item')).toBeInTheDocument());

        // Go to expiring
        fireEvent.click(screen.getByText('Expiring Soon').closest('.glass-panel')!);
        await waitFor(() => expect(screen.queryByText('Fresh Item')).not.toBeInTheDocument());

        // Click "Clear Filters" button
        fireEvent.click(screen.getByText('Clear Filters'));
        expect(screen.getByText('Fresh Item')).toBeInTheDocument();
        expect(screen.getByText('Active Inventory')).toBeInTheDocument();
        
        // Go to expiring again
        fireEvent.click(screen.getByText('Expiring Soon').closest('.glass-panel')!);
        await waitFor(() => expect(screen.queryByText('Fresh Item')).not.toBeInTheDocument());
        
        // Click Combined Banner (Total Items/Quantity)
        fireEvent.click(screen.getByText('Total Items').closest('.glass-panel')!);
        expect(screen.getByText('Fresh Item')).toBeInTheDocument();
    });

    it('filters items by search term', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.getByText('Fresh Item')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search items...');
        fireEvent.change(searchInput, { target: { value: 'Fresh' } });

        expect(screen.getByText('Fresh Item')).toBeInTheDocument();
        expect(screen.queryByText('Expiring Item')).not.toBeInTheDocument();
    });

    it('filters items by category autocomplete', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.getByText('Fresh Item')).toBeInTheDocument());

        const catInput = screen.getByPlaceholderText('Filter by category...');
        
        // Type 'Dai' (should match Dairy)
        fireEvent.change(catInput, { target: { value: 'Dai' } });
        fireEvent.focus(catInput);

        // Wait for dropdown to appear and click option
        const list = await screen.findByRole('listbox');
        const option = within(list).getByText('Dairy');
        
        fireEvent.click(option);

        // Check filter applied
        expect(screen.getByText('Expiring Item')).toBeInTheDocument();
        expect(screen.queryByText('Fresh Item')).not.toBeInTheDocument();
    });
});

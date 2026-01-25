import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UpdateItemModal from './UpdateItemModal';
import type { PantryItem } from '../types/PantryItem';

// Mock fetch globally
global.fetch = vi.fn();

/**
 * Tests for UpdateItemModal component.
 * Includes regression tests for categoryId type handling after uuid-to-int migration.
 */
describe('UpdateItemModal', () => {
    const mockItem: PantryItem = {
        id: 1,
        name: 'Test Apple',
        quantity: 5,
        categoryId: 10,
        expirationDate: '2026-12-31',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        category: { id: 10, name: 'Fruits' },
    };

    const mockCategories = [
        { id: 1, name: 'Apple', quantity: 5, category: { id: 10, name: 'Fruits' } },
        { id: 2, name: 'Bread', quantity: 3, category: { id: 20, name: 'Bakery' } },
    ];

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onItemUpdated: vi.fn(),
        item: mockItem,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockCategories,
        });
    });

    it('renders with pre-filled item data', async () => {
        render(<UpdateItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        expect(screen.getByText('Edit Item')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Apple')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<UpdateItemModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
    });

    it('does not render when item is null', () => {
        render(<UpdateItemModal {...defaultProps} item={null} />);
        expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
    });

    describe('categoryId Type Regression', () => {
        it('sends categoryId as a number in update request', async () => {
            (global.fetch as any)
                .mockResolvedValueOnce({ // Initial fetch for categories
                    ok: true,
                    json: async () => mockCategories,
                })
                .mockResolvedValueOnce({ // PUT /items/:id - success
                    ok: true,
                    json: async () => ({ ...mockItem, name: 'Updated Apple' }),
                });

            render(<UpdateItemModal {...defaultProps} />);
            await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

            // Change the name to make form dirty
            fireEvent.change(screen.getByDisplayValue('Test Apple'), { target: { value: 'Updated Apple' } });

            // Submit form
            fireEvent.click(screen.getByText('Update Item'));

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(2);
            });

            // Verify the PUT request body contains categoryId as a number
            const putCall = (global.fetch as any).mock.calls[1];
            const requestBody = JSON.parse(putCall[1].body);

            expect(requestBody.categoryId).toBe(10);
            expect(typeof requestBody.categoryId).toBe('number');
        });

        it('handles changing category correctly', async () => {
            (global.fetch as any)
                .mockResolvedValueOnce({ // Initial fetch
                    ok: true,
                    json: async () => mockCategories,
                })
                .mockResolvedValueOnce({ // PUT request
                    ok: true,
                    json: async () => ({ ...mockItem, categoryId: 20 }),
                });

            render(<UpdateItemModal {...defaultProps} />);
            await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

            // Change category
            const select = screen.getByRole('combobox');
            fireEvent.change(select, { target: { value: '20' } });

            // Submit
            fireEvent.click(screen.getByText('Update Item'));

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(2);
            });

            const putCall = (global.fetch as any).mock.calls[1];
            const requestBody = JSON.parse(putCall[1].body);

            expect(requestBody.categoryId).toBe(20);
            expect(typeof requestBody.categoryId).toBe('number');
        });
    });

    it('shows confirmation when closing with unsaved changes', async () => {
        render(<UpdateItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Make a change
        fireEvent.change(screen.getByDisplayValue('Test Apple'), { target: { value: 'Modified' } });

        // Press Escape
        fireEvent.keyDown(document, { key: 'Escape' });

        // Should show confirmation
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('closes without confirmation when no changes made', async () => {
        render(<UpdateItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Press Escape without making changes
        fireEvent.keyDown(document, { key: 'Escape' });

        // Should close directly
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});

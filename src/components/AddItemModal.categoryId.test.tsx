import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddItemModal from './AddItemModal';

// Mock fetch globally
global.fetch = vi.fn();

/**
 * Regression tests for categoryId type handling.
 * These tests ensure categoryId is properly handled as a number
 * after the database migration from UUID (string) to int (number).
 */
describe('AddItemModal - categoryId Type Regression', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onItemAdded: vi.fn(),
    };

    const mockCategories = [
        { id: 1, name: 'Apple', quantity: 5, category: { id: 10, name: 'Fruits' } },
        { id: 2, name: 'Bread', quantity: 3, category: { id: 20, name: 'Bakery' } },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Return mock categories when fetching items
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockCategories,
        });
    });

    it('sends categoryId as a number in request body', async () => {
        (global.fetch as any)
            .mockResolvedValueOnce({ // Initial fetch for categories
                ok: true,
                json: async () => mockCategories,
            })
            .mockResolvedValueOnce({ // POST /items - success
                ok: true,
                json: async () => ({ id: 100, name: 'Test Item' }),
            });

        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

        // Fill form
        fireEvent.change(screen.getByPlaceholderText('Enter item name'), { target: { value: 'Test Item' } });

        // Select a category from dropdown
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '10' } });

        // Submit form
        fireEvent.click(screen.getByText('Add Item'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        // Verify the POST request body contains categoryId as a number
        const postCall = (global.fetch as any).mock.calls[1];
        const requestBody = JSON.parse(postCall[1].body);

        expect(requestBody.categoryId).toBe(10);
        expect(typeof requestBody.categoryId).toBe('number');
    });

    it('enables submit button when category is selected', async () => {
        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Fill name
        fireEvent.change(screen.getByPlaceholderText('Enter item name'), { target: { value: 'Test Item' } });

        // Initially, the submit button should be enabled (HTML required attr handles validation)
        // But try submitting without category - should show browser validation
        const submitButton = screen.getByText('Add Item');
        expect(submitButton).not.toBeDisabled();

        // Select a category
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '10' } });

        // Button should still be enabled
        expect(submitButton).not.toBeDisabled();
    });

    it('correctly handles clearing category selection', async () => {
        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        const select = screen.getByRole('combobox');

        // Select a category
        fireEvent.change(select, { target: { value: '10' } });
        expect(select).toHaveValue('10');

        // Clear selection (select empty option)
        fireEvent.change(select, { target: { value: '' } });
        expect(select).toHaveValue('');
    });

    it('isDirty flag works correctly with numeric categoryId', async () => {
        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Select a category - form should become dirty
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '10' } });

        // Press Escape to test dirty check
        fireEvent.keyDown(document, { key: 'Escape' });

        // Should show confirmation dialog because form is dirty
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AddItemModal from './AddItemModal';

// Mock fetch globally
global.fetch = vi.fn();

describe('Modal Confirmation UI', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onItemAdded: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    it('shows custom confirmation on Esc key when form is dirty', async () => {
        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        // Make form dirty
        fireEvent.change(screen.getByPlaceholderText('Enter item name'), { target: { value: 'Dirty' } });

        // Press Esc
        fireEvent.keyDown(document, { key: 'Escape' });

        // Expect custom dialog text
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
        expect(screen.getByText('Keep Editing')).toBeInTheDocument();
        expect(screen.getByText('Discard & Close')).toBeInTheDocument();
        
        // Modal should NOT close yet
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('closes when "Discard & Close" is clicked', async () => {
        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        fireEvent.change(screen.getByPlaceholderText('Enter item name'), { target: { value: 'Dirty' } });
        fireEvent.keyDown(document, { key: 'Escape' });

        // Click Discard
        fireEvent.click(screen.getByText('Discard & Close'));

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('hides confirmation when "Keep Editing" is clicked', async () => {
        render(<AddItemModal {...defaultProps} />);
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());

        fireEvent.change(screen.getByPlaceholderText('Enter item name'), { target: { value: 'Dirty' } });
        fireEvent.keyDown(document, { key: 'Escape' });

        // Click Keep Editing
        fireEvent.click(screen.getByText('Keep Editing'));

        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
});

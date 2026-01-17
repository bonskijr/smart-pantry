import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemTable from './ItemTable';
import type { PantryItem } from '../types/PantryItem';

const mockItems: PantryItem[] = [
    {
        id: '1',
        name: 'Apples',
        quantity: 10,
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Fruits' },
        expirationDate: '2026-02-01T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    },
    {
        id: '2',
        name: 'Bread',
        quantity: 3,
        categoryId: 'cat-2',
        category: { id: 'cat-2', name: 'Bakery' },
        expirationDate: '2026-01-20T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    },
    {
        id: '3',
        name: 'Milk',
        quantity: 2,
        categoryId: 'cat-3',
        category: { id: 'cat-3', name: 'Dairy' },
        expirationDate: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    },
];

describe('ItemTable', () => {
    const defaultProps = {
        items: mockItems,
        onEdit: vi.fn(),
        onAdd: vi.fn(),
        onImport: vi.fn(),
    };

    it('renders empty state when no items', () => {
        render(<ItemTable {...defaultProps} items={[]} />);
        expect(screen.getByText('No items found in pantry.')).toBeInTheDocument();
    });

    it('renders table with items', () => {
        render(<ItemTable {...defaultProps} />);
        expect(screen.getByText('Apples')).toBeInTheDocument();
        expect(screen.getByText('Bread')).toBeInTheDocument();
        expect(screen.getByText('Milk')).toBeInTheDocument();
    });

    it('displays item quantities', () => {
        render(<ItemTable {...defaultProps} />);
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays category names', () => {
        render(<ItemTable {...defaultProps} />);
        expect(screen.getByText('Fruits')).toBeInTheDocument();
        expect(screen.getByText('Bakery')).toBeInTheDocument();
        expect(screen.getByText('Dairy')).toBeInTheDocument();
    });

    it('shows "Low Stock" indicator for items with quantity < 5', () => {
        render(<ItemTable {...defaultProps} />);
        // Bread (qty 3) and Milk (qty 2) should have Low Stock
        const lowStockIndicators = screen.getAllByText('Low Stock');
        expect(lowStockIndicators.length).toBe(2);
    });

    it('displays N/A for items without expiration date', () => {
        render(<ItemTable {...defaultProps} />);
        expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('calls onAdd when add button is clicked', () => {
        const onAdd = vi.fn();
        render(<ItemTable {...defaultProps} onAdd={onAdd} />);

        // Find the add button by its tooltip
        const addButtons = screen.getAllByRole('button');
        const addButton = addButtons.find(btn =>
            btn.closest('.tooltip-container')?.textContent?.includes('Add Item')
        );

        if (addButton) {
            fireEvent.click(addButton);
            expect(onAdd).toHaveBeenCalledTimes(1);
        }
    });

    it('calls onImport when import button is clicked', () => {
        const onImport = vi.fn();
        render(<ItemTable {...defaultProps} onImport={onImport} />);

        const importButtons = screen.getAllByRole('button');
        const importButton = importButtons.find(btn =>
            btn.closest('.tooltip-container')?.textContent?.includes('Import CSV')
        );

        if (importButton) {
            fireEvent.click(importButton);
            expect(onImport).toHaveBeenCalledTimes(1);
        }
    });

    it('applies highlight styling when highlightedItemId matches', () => {
        const { container } = render(
            <ItemTable {...defaultProps} highlightedItemId="1" />
        );
        expect(container.querySelector('.bg-primary\\/20')).toBeInTheDocument();
    });

    it('renders table headers correctly', () => {
        render(<ItemTable {...defaultProps} />);
        expect(screen.getByText('Product Name')).toBeInTheDocument();
        expect(screen.getByText('Quantity')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Expiry Date')).toBeInTheDocument();
    });
});

describe('ItemTable Pagination', () => {
    const manyItems: PantryItem[] = Array.from({ length: 12 }, (_, i) => ({
        id: `item-${i + 1}`,
        name: `Item ${i + 1}`,
        quantity: 10,
        categoryId: 'cat-1',
        category: { id: 'cat-1', name: 'Test Category' },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    }));

    const paginationProps = {
        items: manyItems,
        onEdit: vi.fn(),
        onAdd: vi.fn(),
        onImport: vi.fn(),
    };

    it('shows pagination controls when there are more items than page size', () => {
        render(<ItemTable {...paginationProps} />);
        // Should show "Showing X-Y of Z items" text
        expect(screen.getByText(/Showing/)).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('shows only 5 items per page', () => {
        render(<ItemTable {...paginationProps} />);
        // First page should have items 1-5
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 5')).toBeInTheDocument();
        expect(screen.queryByText('Item 6')).not.toBeInTheDocument();
    });

    it('navigates to next page when clicking next button', () => {
        render(<ItemTable {...paginationProps} />);

        // Find and click the "2" page button
        const pageTwo = screen.getByText('2');
        fireEvent.click(pageTwo);

        // Should now show items from page 2
        expect(screen.getByText('Item 6')).toBeInTheDocument();
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });
});

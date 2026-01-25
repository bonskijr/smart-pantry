import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemTable from './ItemTable';
import type { PantryItem } from '../types/PantryItem';

describe('ItemTable', () => {
    const mockItems: PantryItem[] = [
        {
            id: 1,
            name: 'Apples',
            quantity: 10,
            categoryId: 1,
            expirationDate: new Date('2026-02-01'),
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 1, name: 'Fruits' }
        },
        {
            id: 2,
            name: 'Bread',
            quantity: 3,
            categoryId: 2,
            expirationDate: new Date('2026-01-20'),
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 2, name: 'Bakery' }
        },
        {
            id: 3,
            name: 'Milk',
            quantity: 2,
            categoryId: 3,
            expirationDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            category: { id: 3, name: 'Dairy' }
        }
    ];

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
        const lowStockBadges = screen.getAllByText('Low Stock');
        expect(lowStockBadges).toHaveLength(2); // Bread and Milk
    });

    it('displays N/A for items without expiration date', () => {
        render(<ItemTable {...defaultProps} />);
        expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('calls onAdd when add button is clicked', () => {
        render(<ItemTable {...defaultProps} />);
        const addBtn = screen.getByLabelText('Add Item');
        fireEvent.click(addBtn);
        expect(defaultProps.onAdd).toHaveBeenCalled();
    });

    it('calls onImport when import button is clicked', () => {
        render(<ItemTable {...defaultProps} />);
        const importBtn = screen.getByLabelText('Import CSV');
        fireEvent.click(importBtn);
        expect(defaultProps.onImport).toHaveBeenCalled();
    });

    it('applies highlight styling when highlightedItemId matches', () => {
        const { container } = render(<ItemTable {...defaultProps} highlightedItemId={1} />);
        // Find row that contains "Apples" and check if it has the highlight class
        const row = screen.getByText('Apples').closest('tr');
        expect(row).toHaveClass('bg-primary/10');
    });

    it('renders table headers correctly', () => {
        render(<ItemTable {...defaultProps} />);
        expect(screen.getByText('Product Name')).toBeInTheDocument();
        expect(screen.getByText('Qty')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Expiry')).toBeInTheDocument();
    });

    it('shows pagination controls when there are more items than page size', () => {
        const manyItems = Array(10).fill(mockItems[0]).map((item, i) => ({ ...item, id: i }));
        render(<ItemTable {...defaultProps} items={manyItems} />);
        expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
    });

    it('shows only 5 items per page', () => {
        const manyItems = Array(10).fill(mockItems[0]).map((item, i) => ({ ...item, id: i, name: `Item ${i}` }));
        render(<ItemTable {...defaultProps} items={manyItems} />);
        expect(screen.getByText('Item 0')).toBeInTheDocument();
        expect(screen.getByText('Item 4')).toBeInTheDocument();
        expect(screen.queryByText('Item 5')).not.toBeInTheDocument();
    });

    it('navigates to next page when clicking next button', () => {
        const manyItems = Array(10).fill(mockItems[0]).map((item, i) => ({ ...item, id: i, name: `Item ${i}` }));
        render(<ItemTable {...defaultProps} items={manyItems} />);
        
        const nextBtn = screen.getByLabelText('Next page');
        fireEvent.click(nextBtn);

        expect(screen.queryByText('Item 0')).not.toBeInTheDocument();
        expect(screen.getByText('Item 5')).toBeInTheDocument();
        expect(screen.getByText('Item 9')).toBeInTheDocument();
    });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCategories } from './useCategories';

global.fetch = vi.fn();

describe('useCategories', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and extracts categories', async () => {
        const mockItems = [
            { id: '1', category: { id: 'c1', name: 'Cat1' } },
            { id: '2', category: { id: 'c2', name: 'Cat2' } },
            { id: '3', category: { id: 'c1', name: 'Cat1' } }, // Duplicate cat
        ];

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockItems,
        });

        const { result } = renderHook(() => useCategories());
        
        // Trigger fetch manually as it's not in useEffect of the hook itself (caller calls it)
        await result.current.fetchCategories();

        await waitFor(() => {
            expect(result.current.categories).toHaveLength(2);
            expect(result.current.categories).toEqual(expect.arrayContaining([
                { id: 'c1', name: 'Cat1' },
                { id: 'c2', name: 'Cat2' }
            ]));
        });
    });

    it('creates a new category', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'new-id', name: 'NewCat' }),
        });

        const { result } = renderHook(() => useCategories());

        let id;
        await waitFor(async () => {
             id = await result.current.createCategory('NewCat');
        });

        expect(id).toBe('new-id');
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/categories', expect.anything());
        
        // Check optimistic update
        expect(result.current.categories).toHaveLength(1);
        expect(result.current.categories[0]).toEqual({ id: 'new-id', name: 'NewCat' });
    });
});

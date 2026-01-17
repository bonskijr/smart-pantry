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
            { id: 1, category: { id: 1, name: 'Cat1' } },
            { id: 2, category: { id: 2, name: 'Cat2' } },
            { id: 3, category: { id: 1, name: 'Cat1' } }, // Duplicate cat
        ];

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockItems,
        });

        const { result } = renderHook(() => useCategories());
        
        await result.current.fetchCategories();

        await waitFor(() => {
            expect(result.current.categories).toHaveLength(2);
            expect(result.current.categories).toEqual(expect.arrayContaining([
                { id: 1, name: 'Cat1' },
                { id: 2, name: 'Cat2' }
            ]));
        });
    });

    it('creates a new category', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 99, name: 'NewCat' }),
        });

        const { result } = renderHook(() => useCategories());

        let id;
        await waitFor(async () => {
             id = await result.current.createCategory('NewCat');
        });

        expect(id).toBe(99);
        // Note: Using ENDPOINTS import in test file requires handling, but here we mock fetch global so we don't care about the URL value in source as long as logic calls fetch.
        // But if we want to assert URL:
        // expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/categories'), ...);
        
        expect(result.current.categories).toHaveLength(1);
        expect(result.current.categories[0]).toEqual({ id: 99, name: 'NewCat' });
    });
});
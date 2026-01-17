import { useState, useCallback } from 'react';

interface Category {
    id: string;
    name: string;
}

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3000/items');
            if (!res.ok) throw new Error('Failed to fetch items');
            const items = await res.json();
            
            const uniqueCategories = new Map<string, Category>();
            items.forEach((item: { category: Category }) => {
                if (item.category) {
                    uniqueCategories.set(item.category.id, item.category);
                }
            });
            setCategories(Array.from(uniqueCategories.values()));
        } catch (err) {
            console.error(err);
            setError('Failed to load categories');
        }
    }, []);

    const createCategory = useCallback(async (name: string) => {
        try {
            const res = await fetch('http://localhost:3000/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                let errMsg = errorData.error || 'Failed to create category';
                if (typeof errMsg === 'object') errMsg = JSON.stringify(errMsg);
                throw new Error(errMsg);
            }
            
            const newCat = await res.json();
            setCategories(prev => {
                if (prev.some(c => c.id === newCat.id)) return prev;
                return [...prev, newCat];
            });
            return newCat.id;
        } catch (err) {
            throw err;
        }
    }, []);

    return { categories, fetchCategories, createCategory, setCategories, error };
}

import { describe, it, expect } from 'vitest';
import { createItemSchema, updateItemSchema, categorySchema } from './itemSchema';

describe('createItemSchema', () => {
    const validItem = {
        name: 'Test Item',
        quantity: 5,
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        expirationDate: '2026-12-31T00:00:00.000Z',
    };

    it('should pass with valid complete item', () => {
        const result = createItemSchema.safeParse(validItem);
        expect(result.success).toBe(true);
    });

    it('should pass without expirationDate (optional field)', () => {
        const { expirationDate, ...itemWithoutExpiration } = validItem;
        const result = createItemSchema.safeParse(itemWithoutExpiration);
        expect(result.success).toBe(true);
    });

    it('should pass with null expirationDate', () => {
        const result = createItemSchema.safeParse({
            ...validItem,
            expirationDate: null,
        });
        expect(result.success).toBe(true);
    });

    it('should fail when name is empty', () => {
        const result = createItemSchema.safeParse({
            ...validItem,
            name: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('name');
        }
    });

    it('should fail when name is missing', () => {
        const { name, ...itemWithoutName } = validItem;
        const result = createItemSchema.safeParse(itemWithoutName);
        expect(result.success).toBe(false);
    });

    it('should fail when quantity is negative', () => {
        const result = createItemSchema.safeParse({
            ...validItem,
            quantity: -1,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('quantity');
        }
    });

    it('should fail when quantity is a decimal', () => {
        const result = createItemSchema.safeParse({
            ...validItem,
            quantity: 5.5,
        });
        expect(result.success).toBe(false);
    });

    it('should fail when quantity is not a number', () => {
        const result = createItemSchema.safeParse({
            ...validItem,
            quantity: 'five',
        });
        expect(result.success).toBe(false);
    });

    it('should fail when categoryId is not a valid UUID', () => {
        const result = createItemSchema.safeParse({
            ...validItem,
            categoryId: 'not-a-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('categoryId');
        }
    });

    it('should fail when categoryId is missing', () => {
        const { categoryId, ...itemWithoutCategory } = validItem;
        const result = createItemSchema.safeParse(itemWithoutCategory);
        expect(result.success).toBe(false);
    });

    // Regression tests for date format handling
    describe('expirationDate format handling', () => {
        const baseItem = {
            name: 'Test Item',
            quantity: 5,
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
        };

        it('should accept date-only string from HTML date input (YYYY-MM-DD)', () => {
            // This is the format returned by HTML <input type="date">
            const result = createItemSchema.safeParse({
                ...baseItem,
                expirationDate: '2026-01-17',
            });
            expect(result.success).toBe(true);
        });

        it('should accept full ISO datetime string', () => {
            const result = createItemSchema.safeParse({
                ...baseItem,
                expirationDate: '2026-01-17T00:00:00.000Z',
            });
            expect(result.success).toBe(true);
        });

        it('should accept ISO datetime without milliseconds', () => {
            const result = createItemSchema.safeParse({
                ...baseItem,
                expirationDate: '2026-01-17T15:30:00Z',
            });
            expect(result.success).toBe(true);
        });

        it('should accept empty string as no date', () => {
            const result = createItemSchema.safeParse({
                ...baseItem,
                expirationDate: '',
            });
            expect(result.success).toBe(true);
        });

        it('should reject invalid date strings', () => {
            const result = createItemSchema.safeParse({
                ...baseItem,
                expirationDate: 'not-a-date',
            });
            expect(result.success).toBe(false);
        });

        it('should reject malformed date strings', () => {
            const result = createItemSchema.safeParse({
                ...baseItem,
                expirationDate: '17-01-2026', // Wrong order
            });
            expect(result.success).toBe(false);
        });
    });
});

describe('updateItemSchema', () => {
    it('should pass when updating only name', () => {
        const result = updateItemSchema.safeParse({ name: 'Updated Name' });
        expect(result.success).toBe(true);
    });

    it('should pass when updating only quantity', () => {
        const result = updateItemSchema.safeParse({ quantity: 10 });
        expect(result.success).toBe(true);
    });

    it('should pass with empty object (no fields to update)', () => {
        const result = updateItemSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('should still validate field types when provided', () => {
        const result = updateItemSchema.safeParse({
            quantity: -5, // Invalid: negative
        });
        expect(result.success).toBe(false);
    });

    it('should validate categoryId format when provided', () => {
        const result = updateItemSchema.safeParse({
            categoryId: 'invalid-uuid',
        });
        expect(result.success).toBe(false);
    });
});

describe('categorySchema', () => {
    it('should pass with valid category name', () => {
        const result = categorySchema.safeParse({ name: 'Dairy' });
        expect(result.success).toBe(true);
    });

    it('should pass and trim whitespace from name', () => {
        const result = categorySchema.safeParse({ name: '  Fruits  ' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe('Fruits');
        }
    });

    it('should fail when name is empty string', () => {
        const result = categorySchema.safeParse({ name: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('name');
        }
    });

    it('should fail when name is only whitespace', () => {
        const result = categorySchema.safeParse({ name: '   ' });
        expect(result.success).toBe(false);
    });

    it('should fail when name is missing', () => {
        const result = categorySchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it('should fail when name is not a string', () => {
        const result = categorySchema.safeParse({ name: 123 });
        expect(result.success).toBe(false);
    });

    it('should fail when name is null', () => {
        const result = categorySchema.safeParse({ name: null });
        expect(result.success).toBe(false);
    });

    it('should pass with category name containing spaces', () => {
        const result = categorySchema.safeParse({ name: 'Canned Goods' });
        expect(result.success).toBe(true);
    });

    it('should pass with single character name', () => {
        const result = categorySchema.safeParse({ name: 'A' });
        expect(result.success).toBe(true);
    });
});

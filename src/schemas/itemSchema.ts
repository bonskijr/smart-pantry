import { z } from 'zod';

// Custom validator for dates that accepts:
// - Full ISO datetime strings (e.g., "2026-01-17T00:00:00.000Z")
// - Date-only strings from HTML inputs (e.g., "2026-01-17")
// - Date objects
// - null/undefined (optional)
const dateStringValidator = z.string().refine(
  (val) => {
    // Accept empty string as "no date"
    if (val === '') return true;
    // Accept YYYY-MM-DD format (HTML date input)
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return true;
    // Accept full ISO datetime
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: "Invalid date format" }
);

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().int().nonnegative("Quantity must be a non-negative integer"),
  categoryId: z.string().uuid("Category ID must be a valid UUID"),
  expirationDate: dateStringValidator.optional().nullable().or(z.date().optional().nullable())
});

export const updateItemSchema = createItemSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required")
});
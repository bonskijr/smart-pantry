import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { createItemSchema, updateItemSchema, categorySchema } from '../src/schemas/itemSchema';

const app = express();
const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const port = 3000;

app.use(cors());
app.use(express.json());

// GET /items
app.get('/items', async (req, res) => {
    try {
        const items = await prisma.pantryItem.findMany({
            include: { category: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// POST /items
app.post('/items', async (req, res) => {
    try {
        const validation = createItemSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.format() });
        }

        const { name, quantity, categoryId, expirationDate } = validation.data;

        const item = await prisma.pantryItem.create({
            data: {
                name,
                quantity,
                categoryId,
                expirationDate: expirationDate ? new Date(expirationDate) : null,
            },
            include: { category: true }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// PUT /items/:id
app.put('/items/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

        const validation = updateItemSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ error: validation.error.format() });
        }

        const { name, quantity, categoryId, expirationDate } = validation.data;

        const item = await prisma.pantryItem.update({
            where: { id },
            data: {
                name,
                quantity,
                categoryId,
                expirationDate: expirationDate ? new Date(expirationDate) : null,
            },
            include: { category: true }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// GET /expiring
app.get('/expiring', async (req, res) => {
    try {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const items = await prisma.pantryItem.findMany({
            where: {
                expirationDate: {
                    gte: now,
                    lte: nextWeek,
                }
            },
            include: { category: true },
            orderBy: { expirationDate: 'asc' },
        });
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch expiring items' });
    }
});

// POST /categories
app.post('/categories', async (req, res) => {
    try {
        const validation = categorySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.format() });
        }
        
        const { name } = validation.data;

        const existing = await prisma.category.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });

        if (existing) {
            return res.json(existing);
        }

        try {
            const category = await prisma.category.create({
                data: { name }
            });
            res.json(category);
        } catch (e: any) {
            if (e.code === 'P2002') {
                 const retryExisting = await prisma.category.findFirst({
                    where: { name: { equals: name, mode: 'insensitive' } }
                });
                return res.json(retryExisting);
            }
            throw e;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// POST /items/bulk
app.post('/items/bulk', async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Items must be an array' });
        }

        const validItems: any[] = [];
        const uniqueCategoryNames = new Set<string>();
        const errors: { item: any; reason: string }[] = [];

        for (const item of items) {
            const { name, quantity, categoryName } = item;
            if (!name || !quantity || !categoryName) {
                errors.push({ item, reason: 'Missing required fields' });
                continue;
            }
            const parsedQty = parseInt(quantity);
            if (isNaN(parsedQty)) {
                errors.push({ item, reason: 'Invalid quantity' });
                continue;
            }
            
            uniqueCategoryNames.add(categoryName); 
            validItems.push({ ...item, parsedQty });
        }

        if (validItems.length === 0) {
            return res.json({ success: 0, failed: errors.length, errors, importedItems: [] });
        }

        const categoryNamesArray = Array.from(uniqueCategoryNames);

        const existingCategories = await prisma.category.findMany({
            where: {
                name: { in: categoryNamesArray, mode: 'insensitive' }
            }
        });

        const categoryMap = new Map<string, number>(); // Changed to number
        existingCategories.forEach(cat => categoryMap.set(cat.name.toLowerCase(), cat.id));

        const itemsToCreate: any[] = [];

        for (const item of validItems) {
            const catId = categoryMap.get(item.categoryName.toLowerCase());
            
            if (!catId) {
                errors.push({ 
                    item, 
                    reason: `Category '${item.categoryName}' does not exist. Please create it first.` 
                });
                continue;
            }

            itemsToCreate.push({
                name: item.name,
                quantity: item.parsedQty,
                categoryId: catId,
                expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
            });
        }

        if (itemsToCreate.length > 0) {
            await prisma.pantryItem.createMany({
                data: itemsToCreate
            });
        }

        // We can't return IDs easily with createMany in Postgres via Prisma (it doesn't return them).
        // So we return the count or re-fetch? The original code returned itemsToCreate which lacked IDs (generated by DB).
        // It claimed to return "importedItems" with IDs but actually uuidv7() was generated in app so it had them.
        // Now DB generates them. We can't return the IDs without individual inserts or RETURNING clause (raw sql).
        // For now, we return the payload without IDs.

        res.json({
            success: itemsToCreate.length,
            failed: errors.length,
            errors,
            importedItems: itemsToCreate // No IDs
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to bulk import items' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
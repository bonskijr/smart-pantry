
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { v7 as uuidv7 } from 'uuid';

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
        const { name, quantity, categoryId, expirationDate } = req.body;

        if (!name || !quantity || !categoryId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const item = await prisma.pantryItem.create({
            data: {
                id: uuidv7(),
                name,
                quantity,
                categoryId,
                expirationDate: expirationDate ? new Date(expirationDate) : null,
            },
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
        const { id } = req.params;
        const { name, quantity, categoryId, expirationDate } = req.body;

        if (!name || !quantity || !categoryId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const item = await prisma.pantryItem.update({
            where: { id },
            data: {
                name,
                quantity,
                categoryId,
                expirationDate: expirationDate ? new Date(expirationDate) : null,
            },
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
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const items = await prisma.pantryItem.findMany({
            where: {
                expirationDate: {
                    lte: nextWeek,
                    // You might want to filter out already expired items or keep them?
                    // "Expiring" usually implies not yet expired or recently expired.
                    // Let's just return anything expiring <= 7 days from now.
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

// POST /items/bulk
app.post('/items/bulk', async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Items must be an array' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as { item: any; reason: string }[],
            importedItems: [] as any[],
        };

        for (const itemData of items) {
            try {
                const { name, quantity, categoryName, expirationDate } = itemData;

                if (!name || !quantity || !categoryName) {
                    results.failed++;
                    results.errors.push({ item: itemData, reason: 'Missing required fields (name, quantity, or categoryName)' });
                    continue;
                }

                const parsedQuantity = parseInt(quantity);
                if (isNaN(parsedQuantity)) {
                    results.failed++;
                    results.errors.push({ item: itemData, reason: 'Invalid quantity' });
                    continue;
                }

                // Find or create category by name
                let category = await prisma.category.findFirst({
                    where: { name: { equals: categoryName, mode: 'insensitive' } },
                });

                if (!category) {
                    category = await prisma.category.create({
                        data: {
                            id: uuidv7(),
                            name: categoryName
                        },
                    });
                }

                const newItem = await prisma.pantryItem.create({
                    data: {
                        id: uuidv7(),
                        name,
                        quantity: parsedQuantity,
                        categoryId: category.id,
                        expirationDate: expirationDate ? new Date(expirationDate) : null,
                    },
                    include: { category: true },
                });

                results.success++;
                results.importedItems.push(newItem);
            } catch (err) {
                results.failed++;
                results.errors.push({ item: itemData, reason: err instanceof Error ? err.message : 'Unknown error' });
            }
        }

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to bulk import items' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

import pg from 'pg';
import fs from 'fs/promises';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function restore() {
    try {
        console.log('Restoring data...');
        const data = JSON.parse(await fs.readFile('backup.json', 'utf-8'));
        
        const catMap = new Map<string, number>();
        
        // Restore Categories
        for (const cat of data.categories) {
            const exist = await pool.query('SELECT id FROM "Category" WHERE name = $1', [cat.name]);
            if (exist.rows.length > 0) {
                catMap.set(cat.id, exist.rows[0].id);
            } else {
                const res = await pool.query('INSERT INTO "Category" (name) VALUES ($1) RETURNING id', [cat.name]);
                catMap.set(cat.id, res.rows[0].id);
            }
        }
        
        // Restore Items
        for (const item of data.items) {
            const newCatId = catMap.get(item.categoryId);
            if (!newCatId) continue;
            await pool.query(
                'INSERT INTO "PantryItem" (name, quantity, "categoryId", "expirationDate", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)', 
                [item.name, item.quantity, newCatId, item.expirationDate, item.createdAt, item.updatedAt]
            );
        }
        console.log('Restore complete.');
    } catch (e) {
        console.error('Restore failed:', e);
    } finally {
        await pool.end();
    }
}
restore();
import pg from 'pg';
import fs from 'fs/promises';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function backup() {
    try {
        console.log('Backing up data...');
        const { rows: categories } = await pool.query('SELECT * FROM "Category"');
        const { rows: items } = await pool.query('SELECT * FROM "PantryItem"');
        
        await fs.writeFile('backup.json', JSON.stringify({ categories, items }, null, 2));
        console.log(`Backup complete: ${categories.length} categories, ${items.length} items.`);
    } catch (e) {
        console.error('Backup failed:', e);
        // If tables don't exist, that's fine (fresh start)
    } finally {
        await pool.end();
    }
}
backup();

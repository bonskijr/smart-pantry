import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function reset() {
    console.log('Dropping schema public...');
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Schema reset.');
    await pool.end();
}
reset();

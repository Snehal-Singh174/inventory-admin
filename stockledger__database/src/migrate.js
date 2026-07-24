import { pool } from './db.js';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const result = await pool.query('SELECT name FROM _migrations ORDER BY id');
  return result.rows.map(r => r.name);
}

async function applyMigration(name, sql) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
    await client.query('COMMIT');
    console.log(`[migrate] Applied: ${name}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`Migration ${name} failed: ${err.message}`);
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let newCount = 0;
  for (const file of files) {
    if (applied.includes(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    await applyMigration(file, sql);
    newCount++;
  }

  if (newCount === 0) {
    console.log('[migrate] All migrations already applied.');
  } else {
    console.log(`[migrate] Applied ${newCount} new migration(s).`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

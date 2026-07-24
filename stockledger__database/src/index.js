import express from 'express';
import { runMigrations } from './migrate.js';
import { runSeeds } from './seed.js';
import { pool, checkConnection } from './db.js';

const app = express();
const PORT = process.env.PORT || 4010;

let dbReady = false;

app.get('/health', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ status: 'initializing', message: 'Database migrations in progress' });
  }
  try {
    const result = await pool.query('SELECT 1 as check');
    if (result.rows[0].check === 1) {
      return res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    }
  } catch (err) {
    return res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

app.get('/ready', (req, res) => {
  if (dbReady) {
    return res.json({ status: 'ready' });
  }
  return res.status(503).json({ status: 'not_ready' });
});

async function startup() {
  console.log('[stockledger-db] Starting database initialization...');

  const maxRetries = 30;
  let connected = false;

  for (let i = 1; i <= maxRetries; i++) {
    connected = await checkConnection();
    if (connected) break;
    console.log(`[stockledger-db] Waiting for PostgreSQL... attempt ${i}/${maxRetries}`);
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!connected) {
    console.error('[stockledger-db] Failed to connect to PostgreSQL after retries. Exiting.');
    process.exit(1);
  }

  console.log('[stockledger-db] PostgreSQL connected. Running migrations...');
  await runMigrations();

  console.log('[stockledger-db] Running seeds...');
  await runSeeds();

  dbReady = true;
  console.log('[stockledger-db] Database ready.');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[stockledger-db] Health check server listening on port ${PORT}`);
  });
}

startup().catch(err => {
  console.error('[stockledger-db] Fatal startup error:', err);
  process.exit(1);
});

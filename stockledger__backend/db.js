'use strict';

const { Pool } = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://stockledger:stockledger_pass@localhost:4010/stockledger';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error:', err.message);
});

/**
 * Execute a parameterized query against the shared pool.
 * @param {string} text - SQL query with $1 placeholders
 * @param {Array} [params] - Bound parameters
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Attempt to connect with exponential-backoff retry.
 * @param {number} [retries=5]
 */
async function testConnection(retries) {
  const maxRetries = retries || 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await pool.query('SELECT 1');
      console.log('[db] Connected to PostgreSQL');
      return;
    } catch (err) {
      console.error(`[db] Connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw new Error(`[db] Could not connect after ${maxRetries} attempts: ${err.message}`);
      }
    }
  }
}

module.exports = { query, testConnection, pool };

'use strict';

require('dotenv').config();

const express = require('express');
const { testConnection } = require('./db');

const healthRouter    = require('./routes/health');
const authRouter      = require('./routes/auth');
const itemsRouter     = require('./routes/items');
const categoriesRouter = require('./routes/categories');
const suppliersRouter = require('./routes/suppliers');
const auditLogRouter  = require('./routes/auditLog');

const PORT = parseInt(process.env.PORT || '4020', 10);

const app = express();

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Preflight — nginx handles CORS headers, we just 204 OPTIONS ──────────────
app.options('*', (_req, res) => res.sendStatus(204));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api',            healthRouter);
app.use('/api/auth',       authRouter);
app.use('/api/items',      itemsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/suppliers',  suppliersRouter);
app.use('/api/audit-log',  auditLogRouter);

// ─── Centralized error handler ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const code   = err.code   || 'INTERNAL_ERROR';
  console.error(`[error] ${status} ${code}: ${err.message}`);
  res.status(status).json({ error: err.message, code, status });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  await testConnection(5);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] StockLedger API running on 0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('[server] Listen error:', err.message);
    process.exit(1);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[fatal] Uncaught exception:', err.message);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error('[fatal] Bootstrap failed:', err.message);
  process.exit(1);
});

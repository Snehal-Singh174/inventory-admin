import { app } from './app';
import { prisma } from './prisma/client';
import { env } from './config/env';
import { seedAll } from './seed/index';
import { setSeeded } from './routes/health.routes';

async function connectWithRetry(retries = 5): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log(`[DB] Connected to PostgreSQL (attempt ${attempt})`);
      return;
    } catch (err) {
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed:`, err);
      if (attempt === retries) {
        throw new Error('Failed to connect to database after maximum retries');
      }
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function bootstrap(): Promise<void> {
  // 1. Connect to DB
  await connectWithRetry();

  // 2. Seed demo data
  let seedSuccess = false;
  try {
    await seedAll();
    seedSuccess = true;
  } catch (err) {
    console.error('[Seed] Seed failed (server will still start):', err);
  }
  setSeeded(seedSuccess);

  // 3. Start HTTP server
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[Server] InvenTrack backend running on 0.0.0.0:${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
  });
}

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal error during startup:', err);
  process.exit(1);
});

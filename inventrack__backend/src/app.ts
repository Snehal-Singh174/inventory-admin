import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { healthRouter } from './routes/health.routes';
import { categoryRouter } from './routes/category.routes';
import { supplierRouter } from './routes/supplier.routes';
import { inventoryRouter } from './routes/inventory.routes';
import { auditRouter } from './routes/audit.routes';
import { userRouter } from './routes/user.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// CORS — allow the frontend origin defined via CORS_ORIGIN env var (comma-separated list supported)
const rawOrigins = process.env.CORS_ORIGIN || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/suppliers', supplierRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/audit-log', auditRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/dashboard', dashboardRouter);

// Centralized error handler (must be last)
app.use(errorHandler);

export { app };

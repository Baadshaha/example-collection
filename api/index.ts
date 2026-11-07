import express from 'express';
import cookieParser from 'cookie-parser';
import { initDb } from '../src/server/db.ts';
import { seedDatabase } from '../src/server/seed.ts';
import { apiRouter, sessionMiddleware } from '../src/server/api.ts';

// Initialize SQLite database and seed initial data
initDb();
seedDatabase();

const app = express();
const SESSION_SECRET = process.env.SESSION_SECRET || 'krushna_collection_secure_key_1029384756';

// Parsers & Session middleware
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.use(sessionMiddleware);

// API Routes mounted on both /api and / to handle different Vercel rewrite configurations
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Health check endpoint
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    store: 'Example Collection',
    timestamp: new Date().toISOString(),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

export default app;


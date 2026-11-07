import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import tasksRouter from './routes/tasks.js';
import { errorHandler, notFound, requireClient } from './middleware/index.js';

const NETLIFY_PREFIX = '/.netlify/functions/api';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // API data changes constantly; never let the browser serve a cached/304 copy.
  app.set('etag', false);
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // On Netlify the function may see either the original `/api/...` path or the
  // rewritten `/.netlify/functions/api/...` path; normalise to `/api/...`.
  app.use((req, _res, next) => {
    if (req.url.startsWith(NETLIFY_PREFIX)) {
      req.url = '/api' + req.url.slice(NETLIFY_PREFIX.length);
    }
    next();
  });

  app.use(helmet());
  const origins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins?.length ? origins : true }));
  app.use(express.json({ limit: '20kb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'up' : 'down' });
  });
  app.use('/api/tasks', requireClient, tasksRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

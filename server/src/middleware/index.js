import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError.js';

const CLIENT_ID = /^[A-Za-z0-9-]{8,64}$/;

/**
 * There is no login in this app, so each browser generates a random id and
 * sends it on every request. Tasks are scoped to that id, which keeps one
 * visitor's tasks separate from everyone else's on the public deployment.
 */
export function requireClient(req, _res, next) {
  const id = req.get('x-client-id');
  if (!id || !CLIENT_ID.test(id)) {
    return next(new HttpError(400, 'Missing or invalid X-Client-Id header'));
  }
  req.owner = id;
  next();
}

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const details = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      details[key] ??= issue.message;
    }
    return res.status(400).json({
      error: { message: Object.values(details)[0] ?? 'Invalid request', details },
    });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message]),
    );
    return res.status(400).json({ error: { message: 'Invalid task', details } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Malformed JSON body' } });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong' } });
}

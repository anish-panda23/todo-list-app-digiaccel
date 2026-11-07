import { Router } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { HttpError, escapeRegex } from '../lib/httpError.js';
import {
  createTaskSchema,
  listQuerySchema,
  updateTaskSchema,
  weeksQuerySchema,
} from '../lib/validation.js';

const router = Router();

// Express 4 doesn't forward rejected promises to the error handler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function findOwnedTask(req) {
  const { id } = req.params;
  const task = mongoose.isValidObjectId(id)
    ? await Task.findOne({ _id: id, owner: req.owner })
    : null;
  if (!task) throw new HttpError(404, 'Task not found');
  return task;
}

/**
 * GET /api/tasks/weeks?tz=Europe/Berlin
 * One summary per Monday–Sunday week that has tasks, computed in the
 * caller's time zone so a task due Sunday 23:30 local lands in the right week.
 */
router.get(
  '/weeks',
  wrap(async (req, res) => {
    const { tz } = weeksQuerySchema.parse(req.query);
    const weeks = await Task.aggregate([
      { $match: { owner: req.owner } },
      {
        $group: {
          _id: {
            $dateTrunc: { date: '$dueAt', unit: 'week', startOfWeek: 'monday', timezone: tz },
          },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          weekStart: '$_id',
          total: 1,
          completed: 1,
          open: { $subtract: ['$total', '$completed'] },
        },
      },
    ]);
    res.json({ data: weeks });
  }),
);

/**
 * GET /api/tasks?q=&from=&to=&status=&limit=
 * `q` matches title or description (case-insensitive, substring).
 * `from` is inclusive, `to` is exclusive.
 */
router.get(
  '/',
  wrap(async (req, res) => {
    const { q, from, to, status, limit } = listQuerySchema.parse(req.query);
    const filter = { owner: req.owner };
    if (q) {
      // Every word must appear in the title or description, in any order.
      filter.$and = q
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
          const rx = new RegExp(escapeRegex(word), 'i');
          return { $or: [{ title: rx }, { description: rx }] };
        });
    }
    if (from || to) {
      filter.dueAt = {};
      if (from) filter.dueAt.$gte = from;
      if (to) filter.dueAt.$lt = to;
    }
    if (status) filter.status = status;

    const tasks = await Task.find(filter).sort({ dueAt: 1, createdAt: 1 }).limit(limit);
    res.json({ data: tasks });
  }),
);

router.get(
  '/:id',
  wrap(async (req, res) => {
    res.json({ data: await findOwnedTask(req) });
  }),
);

router.post(
  '/',
  wrap(async (req, res) => {
    const body = createTaskSchema.parse(req.body ?? {});
    const task = await Task.create({
      ...body,
      owner: req.owner,
      completedAt: body.status === 'completed' ? new Date() : null,
    });
    res.status(201).json({ data: task });
  }),
);

router.patch(
  '/:id',
  wrap(async (req, res) => {
    const updates = updateTaskSchema.parse(req.body ?? {});
    const task = await findOwnedTask(req);
    if (updates.status && updates.status !== task.status) {
      task.completedAt = updates.status === 'completed' ? new Date() : null;
    }
    task.set(updates);
    await task.save();
    res.json({ data: task });
  }),
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    const task = await findOwnedTask(req);
    await task.deleteOne();
    res.status(204).end();
  }),
);

export default router;

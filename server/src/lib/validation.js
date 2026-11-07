import { z } from 'zod';
import { PRIORITIES, STATUSES } from '../models/Task.js';

const isoDateTime = (message) =>
  z
    .string({ required_error: message, invalid_type_error: message })
    .datetime({ offset: true, message })
    .transform((s) => new Date(s));

export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const taskFields = {
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters'),
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters'),
  dueAt: isoDateTime('A valid date & time is required'),
  priority: z.enum(PRIORITIES).nullable(),
  status: z.enum(STATUSES),
};

export const createTaskSchema = z
  .object({
    title: taskFields.title,
    description: taskFields.description.optional().default(''),
    dueAt: taskFields.dueAt,
    priority: taskFields.priority.optional().default(null),
    status: taskFields.status.optional().default('in_progress'),
  })
  .strict();

export const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'Nothing to update' });

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  from: isoDateTime('`from` must be an ISO date').optional(),
  to: isoDateTime('`to` must be an ISO date').optional(),
  status: z.enum(STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

export const weeksQuerySchema = z.object({
  tz: z
    .string()
    .refine(isValidTimeZone, 'Unknown time zone')
    .optional()
    .default('UTC'),
});

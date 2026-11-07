import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db.js';
import { Task } from '../src/models/Task.js';

let mongo;
const app = createApp();
const CLIENT = 'test-client-0001';
const OTHER = 'test-client-0002';

const api = (client = CLIENT) => ({
  get: (url) => request(app).get(url).set('X-Client-Id', client),
  post: (url, body) => request(app).post(url).set('X-Client-Id', client).send(body),
  patch: (url, body) => request(app).patch(url).set('X-Client-Id', client).send(body),
  delete: (url) => request(app).delete(url).set('X-Client-Id', client),
});

const newTask = (overrides = {}) => ({
  title: 'Write report',
  description: 'Quarterly numbers',
  dueAt: '2026-11-04T10:00:00.000Z', // Wednesday
  priority: 'high',
  ...overrides,
});

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDB(mongo.getUri());
}, 120_000);

afterAll(async () => {
  await disconnectDB();
  await mongo?.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe('client id', () => {
  it('rejects requests without X-Client-Id', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(400);
  });
});

describe('create', () => {
  it('creates a task with defaults', async () => {
    const res = await api().post('/api/tasks', { title: '  Buy milk ', dueAt: '2026-11-04T10:00:00Z' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: 'Buy milk',
      description: '',
      priority: null,
      status: 'in_progress',
      completedAt: null,
    });
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.owner).toBeUndefined();
  });

  it('requires title and date & time', async () => {
    const res = await api().post('/api/tasks', { title: ' ' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toHaveProperty('title');
    expect(res.body.error.details).toHaveProperty('dueAt');
  });

  it('rejects unknown priority and unknown fields', async () => {
    expect((await api().post('/api/tasks', newTask({ priority: 'urgent' }))).status).toBe(400);
    expect((await api().post('/api/tasks', newTask({ owner: 'hacker' }))).status).toBe(400);
  });
});

describe('read, update, delete', () => {
  it('updates fields and tracks completion time', async () => {
    const { body } = await api().post('/api/tasks', newTask());
    const id = body.data.id;

    const done = await api().patch(`/api/tasks/${id}`, { status: 'completed', title: 'Report v2' });
    expect(done.status).toBe(200);
    expect(done.body.data.title).toBe('Report v2');
    expect(done.body.data.completedAt).toBeTruthy();

    const reopened = await api().patch(`/api/tasks/${id}`, { status: 'in_progress', priority: null });
    expect(reopened.body.data.completedAt).toBeNull();
    expect(reopened.body.data.priority).toBeNull();

    expect((await api().patch(`/api/tasks/${id}`, {})).status).toBe(400);
    expect((await api().patch(`/api/tasks/${id}`, { title: '' })).status).toBe(400);
  });

  it('deletes a task', async () => {
    const { body } = await api().post('/api/tasks', newTask());
    expect((await api().delete(`/api/tasks/${body.data.id}`)).status).toBe(204);
    expect((await api().get(`/api/tasks/${body.data.id}`)).status).toBe(404);
  });

  it('returns 404 for malformed ids', async () => {
    expect((await api().get('/api/tasks/not-an-id')).status).toBe(404);
  });

  it("never exposes another client's tasks", async () => {
    const { body } = await api().post('/api/tasks', newTask());
    const id = body.data.id;
    expect((await api(OTHER).get(`/api/tasks/${id}`)).status).toBe(404);
    expect((await api(OTHER).patch(`/api/tasks/${id}`, { title: 'x' })).status).toBe(404);
    expect((await api(OTHER).delete(`/api/tasks/${id}`)).status).toBe(404);
    expect((await api(OTHER).get('/api/tasks')).body.data).toHaveLength(0);
  });
});

describe('list & search', () => {
  beforeEach(async () => {
    await api().post('/api/tasks', newTask({ title: 'Gym session', description: 'Leg day', dueAt: '2026-11-03T07:00:00Z' }));
    await api().post('/api/tasks', newTask({ title: 'Team sync', description: 'Discuss gym budget', dueAt: '2026-11-10T09:00:00Z' }));
    await api().post('/api/tasks', newTask({ title: 'Pay rent (a+b)', description: '', dueAt: '2026-11-01T09:00:00Z' }));
  });

  it('searches title and description, case-insensitively', async () => {
    const res = await api().get('/api/tasks?q=GYM');
    expect(res.body.data.map((t) => t.title)).toEqual(['Gym session', 'Team sync']);
  });

  it('matches multiple words in any order', async () => {
    const res = await api().get(`/api/tasks?q=${encodeURIComponent('budget team')}`);
    expect(res.body.data.map((t) => t.title)).toEqual(['Team sync']);
  });

  it('disables HTTP caching of API responses', async () => {
    const res = await api().get('/api/tasks');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers.etag).toBeUndefined();
  });

  it('treats regex characters literally', async () => {
    const res = await api().get(`/api/tasks?q=${encodeURIComponent('(a+b)')}`);
    expect(res.body.data).toHaveLength(1);
  });

  it('filters by date range sorted by due date', async () => {
    const res = await api().get('/api/tasks?from=2026-11-02T00:00:00Z&to=2026-11-09T00:00:00Z');
    expect(res.body.data.map((t) => t.title)).toEqual(['Gym session']);
  });
});

describe('weekly summary', () => {
  it('groups by Monday-start weeks with open/completed counts', async () => {
    const a = await api().post('/api/tasks', newTask({ dueAt: '2026-11-02T08:00:00Z' })); // Mon
    await api().post('/api/tasks', newTask({ dueAt: '2026-11-08T20:00:00Z' })); // Sun
    await api().post('/api/tasks', newTask({ dueAt: '2026-11-09T08:00:00Z' })); // next Mon
    await api().patch(`/api/tasks/${a.body.data.id}`, { status: 'completed' });

    const res = await api().get('/api/tasks/weeks?tz=UTC');
    expect(res.body.data).toEqual([
      { weekStart: '2026-11-02T00:00:00.000Z', total: 2, completed: 1, open: 1 },
      { weekStart: '2026-11-09T00:00:00.000Z', total: 1, completed: 0, open: 1 },
    ]);
  });

  it("uses the caller's time zone for week boundaries", async () => {
    // Sunday 23:30 in New York is Monday 04:30 UTC.
    await api().post('/api/tasks', newTask({ dueAt: '2026-11-09T04:30:00Z' }));
    const utc = await api().get('/api/tasks/weeks?tz=UTC');
    const ny = await api().get(`/api/tasks/weeks?tz=${encodeURIComponent('America/New_York')}`);
    expect(utc.body.data[0].weekStart).toBe('2026-11-09T00:00:00.000Z');
    expect(ny.body.data[0].weekStart).toBe('2026-11-02T05:00:00.000Z');
  });

  it('rejects unknown time zones', async () => {
    expect((await api().get('/api/tasks/weeks?tz=Mars/Base')).status).toBe(400);
  });
});

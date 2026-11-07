import { getClientId } from './clientId';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') + '/api';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, params } = {}) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== '') query.set(k, v);
  }
  const qs = query.toString();

  let res;
  try {
    res = await fetch(`${BASE}${path}${qs ? `?${qs}` : ''}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Client-Id': getClientId() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', 0);
  }

  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(json?.error?.message ?? `Request failed (${res.status})`, res.status, json?.error?.details);
  }
  return json.data;
}

export const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const api = {
  weeks: () => request('/tasks/weeks', { params: { tz: timeZone } }),
  list: (params) => request('/tasks', { params }),
  get: (id) => request(`/tasks/${id}`),
  create: (task) => request('/tasks', { method: 'POST', body: task }),
  update: (id, changes) => request(`/tasks/${id}`, { method: 'PATCH', body: changes }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};

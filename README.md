# Weekly To-Do (MERN)

A mobile-first to-do app that organises tasks into **Monday → Sunday weeks** and shows how many are **open vs. completed** for each week. It's built with MongoDB, Express, React and Node, uses Tailwind for styling, and follows the provided Figma design.

**Live demo:** `<your-site>.netlify.app` &nbsp;·&nbsp; **API:** `<your-site>.netlify.app/api/health`

---

## Features

| Requirement | Where / how |
| --- | --- |
| Create task (title\*, description, date & time\*, priority) | **+** button opens the *Add New Task* bottom sheet. It is validated on the client and again on the server. |
| Edit task | Edit icon on any row, swipe left → **Edit**, or the detail screen. Every field and the status can be changed. |
| Delete task | Swipe left → **Delete**, or the trash icon. An **Undo** toast lets you restore it. |
| Search | Search bar → lists all tasks, then filters live by keywords in title + description (multi-word, any order), with highlighted matches and view/edit/delete on each result. |
| Weekly organisation (Mon–Sun) | Week strip plus an **All Weeks** list of summary cards. Each card shows **Open** and **Completed** counts and a progress bar, and **expands to list that week's tasks**. |
| Status update | Tap the checkbox to toggle **Completed / In Progress**. The week's counts update instantly (optimistic UI) and are then reconciled with the server. |
| Responsive | Designed at 320–430px. On tablet/desktop the app is centred in a column. Safe-area insets are handled for notched phones. |

Extras:
- Onboarding screen
- Task detail view
- Loading skeletons and empty/error states
- Keyboard and screen-reader support (ARIA roles, focus rings, Esc closes the sheet)
- State is kept across navigation: the selected day, which week cards are open, and the search query (stored in the URL)

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, TanStack Query, date-fns, lucide-react
- **Backend:** Node, Express, Mongoose, Zod (validation), Helmet, CORS
- **Database:** MongoDB Atlas. Local development needs no install because the server starts an in-memory MongoDB automatically.
- **Hosting:** Netlify. The static frontend and the **Express API run as a Netlify Function** behind `/api/*`, so there is one deploy on one origin and no CORS setup.
- **Tests:** Vitest + Supertest (API, against a real in-memory MongoDB) and Vitest (date/week logic)

## Project structure

```
├── client/                 React app
│   └── src/
│       ├── components/     TaskItem, SwipeableRow, WeekCard, WeekStrip, TaskSheet, …
│       ├── pages/          Home, Search, TaskDetail, Onboarding
│       ├── hooks/          data hooks with optimistic cache updates
│       └── lib/            api client, week/date helpers (+ tests)
├── server/                 Express API
│   ├── src/
│   │   ├── app.js          app factory (shared by local server & Netlify Function)
│   │   ├── routes/tasks.js
│   │   ├── models/Task.js
│   │   └── lib/validation.js
│   └── test/               API integration tests
├── netlify/functions/api.mjs   wraps the Express app with serverless-http
└── netlify.toml
```

## API

All task routes need an `X-Client-Id` header (see [Design decisions](#design-decisions)). Bodies are JSON. Responses are `{ data }` on success or `{ error: { message, details? } }` on failure.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/tasks/weeks?tz=Asia/Kolkata` | Per-week summary: `[{ weekStart, total, open, completed }]`. Weeks are Monday-start and computed in the caller's time zone. |
| `GET` | `/api/tasks?q=&from=&to=&status=&limit=` | List or search. `q` matches title or description (case-insensitive). `from` is inclusive and `to` is exclusive (ISO dates). |
| `GET` | `/api/tasks/:id` | Get one task |
| `POST` | `/api/tasks` | Create: `{ title, dueAt, description?, priority?, status? }` |
| `PATCH` | `/api/tasks/:id` | Partial update of any field |
| `DELETE` | `/api/tasks/:id` | Delete (`204`) |

Task shape:

```json
{
  "id": "6729…",
  "title": "Finishing Wireframe",
  "description": "",
  "dueAt": "2026-11-07T08:30:00.000Z",
  "priority": "high",          // "low" | "medium" | "high" | null
  "status": "in_progress",     // "in_progress" | "completed"
  "completedAt": null,
  "createdAt": "…",
  "updatedAt": "…"
}
```

## Running locally

Requires Node 20+.

```bash
npm install
npm run dev        # API on :5000 + web on :5173 (Vite proxies /api)
```

Open http://localhost:5173. With no `MONGODB_URI` set, the API uses an in-memory MongoDB, so data resets when the API restarts. To use a real database, copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.

```bash
npm test           # API + client tests
npm run build      # production build of the client
```

> The first test or dev run downloads a MongoDB binary for the in-memory server. This takes a while once and is cached afterwards.

## Deploying to Netlify

1. Create a free **MongoDB Atlas** cluster:
   - Add a database user.
   - Allow network access from `0.0.0.0/0` (Netlify Functions don't have fixed IPs).
   - Copy the connection string, e.g. `mongodb+srv://user:pass@cluster.x.mongodb.net/todo`.
2. Push this repo to GitHub, then on Netlify choose **Add new site → Import from Git**. `netlify.toml` already sets the build command, publish directory and functions directory.
3. In **Site settings → Environment variables**, add `MONGODB_URI` and set it to the Atlas string.
4. Deploy. Check `https://<site>.netlify.app/api/health`. It should return `{"status":"ok","db":"up"}`.

## Design decisions

- **Weeks are computed in the user's time zone.** A task due *Sunday 11:30 pm* in New York is *Monday* in UTC. The client sends its IANA time zone, and the server groups with MongoDB `$dateTrunc` (`unit: week`, `startOfWeek: monday`, `timezone`), so weekly counts always match what the user sees. The test suite covers this.
- **Anonymous per-device ownership instead of auth.** Login isn't in the brief, but a public demo shouldn't show every visitor the same list. Each browser generates a UUID and sends it as `X-Client-Id`. Every query is scoped by it, and the tests check that one client can't read, edit or delete another client's tasks. Swapping in real auth would only change the middleware that sets `req.owner`.
- **Optimistic UI.** Toggling or deleting a task immediately updates the week counts and lists in the cache, rolls back if the request fails, and refetches once the request settles.
- **One deploy.** The same `createApp()` runs as a normal Express server locally and as a Netlify Function in production. The Mongo connection is cached across warm invocations.
- **Security and validation.** Zod uses strict schemas (unknown fields like `owner` are rejected). User search input is regex-escaped. Helmet is enabled, JSON bodies are size-limited, malformed ids return 404, and errors use a consistent JSON shape.
- **Bottom-sheet form.** As in the Figma, add/edit opens over the current screen (home, search or detail) using React Router's background-location pattern. A direct URL like `/tasks/new` still works.

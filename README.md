# Weekly To-Do (MERN)

A mobile-first to-do app built with MongoDB, Express, React and Node. Tasks are grouped into Monday to Sunday weeks, and each week shows how many tasks are open and how many are completed. Styling is done with Tailwind, based on the given Figma design.

## Features

- Create a task with title, description, date & time and priority
- Edit and delete tasks (swipe left on a task, or use the icons)
- Undo after deleting a task
- Search tasks by title or description
- Week strip on the home screen and an "All Weeks" list with open/completed counts for each week
- Mark tasks as completed or in progress
- Works on mobile screens and is centred on larger screens

## Tech stack

- Frontend: React, Vite, Tailwind CSS, React Router, TanStack Query, date-fns
- Backend: Node, Express, Mongoose, Zod
- Database: MongoDB
- Tests: Vitest and Supertest

## Project structure

```
client/                     React app
  src/components/           UI components
  src/pages/                Home, Search, TaskDetail, Onboarding
  src/hooks/                data fetching hooks
  src/lib/                  api client and date helpers
server/                     Express API
  src/routes/tasks.js
  src/models/Task.js
  test/                     API tests
netlify/functions/api.mjs   runs the Express app as a function
```

## API

| Method | Route | Description |
| --- | --- | --- |
| GET | /api/health | Health check |
| GET | /api/tasks/weeks | Open/completed counts per week |
| GET | /api/tasks | List or search tasks |
| GET | /api/tasks/:id | Get one task |
| POST | /api/tasks | Create a task |
| PATCH | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |

## Running locally

Requires Node 20 or later.

```bash
npm install
npm run dev
```

Open http://localhost:5173. If `MONGODB_URI` is not set, the server uses an in-memory MongoDB, so data is lost when it restarts. To use your own database, copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.

Other commands:

```bash
npm test
npm run build
```

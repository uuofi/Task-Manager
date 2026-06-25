# TaskControl — Team Task Management Platform

A production-grade, real-time team task management platform (think Linear / ClickUp)
built with a clean-architecture Node.js/Express/MongoDB backend and a React 19 + Vite frontend.

## Monorepo layout

```
tasckControl/
├── server/          # Express API — clean architecture (routes → controllers → services → repositories → models)
├── client/          # React 19 + Vite SPA
└── design-system/   # Persisted design system (source of truth for UI)
```

## Tech stack

**Backend:** Node.js, Express, MongoDB/Mongoose, JWT (access + refresh), bcrypt, Socket.IO,
Multer, express-validator, Helmet, rate limiting, Winston.

**Frontend:** React 19, Vite, React Router, TanStack Query, Axios, Tailwind v4, shadcn/ui,
React Hook Form, Zod, Framer Motion, @dnd-kit, Recharts.

## Quick start

Requires **Node ≥ 20** and a running **MongoDB** (local or Atlas).

```bash
# 1. Install both apps
npm run install:all

# 2. Configure the backend
cd server && cp .env.example .env   # then set MONGODB_URI + secrets
cd ..

# 3. Seed demo data (optional but recommended)
npm run seed

# 4. Run client + server together
npm run dev
```

- API: http://localhost:5050/api/v1  (health: `/health`)
- App: http://localhost:5173

The Vite dev server proxies `/api`, `/uploads`, and `/socket.io` to the backend.

### Demo accounts (after `npm run seed`)

| Email | Password | Role |
|-------|----------|------|
| owner@taskcontrol.app | `Password1` | Owner |
| alice@taskcontrol.app | `Password1` | Admin |
| bob@taskcontrol.app | `Password1` | Manager |
| carol@taskcontrol.app | `Password1` | Member |

## Root scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install server + client deps |
| `npm run dev` | Run both apps (concurrently) |
| `npm run dev:server` / `npm run dev:client` | Run one app |
| `npm run seed` | Wipe + seed demo data (dev only) |
| `npm run build` | Production build of the client |
| `npm run lint` | Lint both apps |

## Architecture highlights

- **Clean architecture** on the server: thin controllers → services (business logic) →
  repositories (data access) → Mongoose models. Cross-cutting concerns (activity log,
  notifications, realtime) are isolated services.
- **Security:** Helmet, CORS all-list, rate limiting (stricter on auth), mongo-sanitize, HPP,
  in-memory access token + httpOnly/signed refresh cookie, `tokenVersion` session invalidation.
- **RBAC:** `owner › admin › manager › member`, hierarchy-aware, enforced per mutation.
- **Realtime:** Socket.IO with JWT-auth handshake, per-user/workspace/project rooms, presence,
  typing indicators; services emit through a decoupled emitter.
- **Storage abstraction:** local-disk driver now, swappable to S3/Cloudinary without touching callers.
- **Design system:** teal + orange (Flat Design, Plus Jakarta Sans) generated and persisted in
  `design-system/taskcontrol/MASTER.md`, implemented as Tailwind v4 tokens consumed via shadcn/ui.

## Features

Dashboard (charts + widgets) · Projects (boards) · Drag-and-drop Kanban · Task detail
(status/priority/assignee/dates, **tags**, **recurrence**, **dependencies**, checklist) ·
Built-in **timer** (start/pause/resume/stop → actual hours) · Threaded comments with reactions &
mentions · **Realtime** updates, presence & typing · Notifications center · Task suggestions ·
Team management & invitations · Calendar · Global search · Profile & settings · Light/Dark mode.

## Build status — all steps complete ✅

- [x] **Step 1** — Backend initialization (config, security, logging, error handling, bootstrap)
- [x] **Step 2** — Frontend initialization (Vite + React 19, Tailwind v4, shadcn/ui, Router, React Query, theming)
- [x] **Step 3** — Authentication (JWT access/refresh, bcrypt, RBAC, register/login/logout/forgot/reset, auth UI)
- [x] **Step 4** — Database models (11 collections)
- [x] **Step 5** — REST APIs (auth, users, workspaces/team, invitations, projects, tasks, timer, comments, attachments, suggestions, notifications, activity, search, dashboard)
- [x] **Step 6** — Frontend app (shell, dashboard, projects, DnD board, task detail + timer, calendar, team, suggestions, profile, settings, notifications, search)
- [x] **Step 7** — Socket.IO realtime (auth handshake, rooms, presence, typing, live streaming)
- [x] **Step 8** — Dashboard (stat cards, status donut, project progress, live activity feed)
- [x] **Step 9** — Task management (board filters, tags, recurrence, dependencies, checklist, timer)
- [x] **Step 10** — Notifications (realtime bell + center, mark read/all, deep links)
# Task-Manager

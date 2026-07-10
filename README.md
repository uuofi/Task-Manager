# TaskControl

**A realtime, full-stack team task-management platform** — in the spirit of Linear / ClickUp.

Teams organize work into **projects** and **Kanban boards**, manage **tasks** with statuses,
priorities, assignees, due dates, dependencies, checklists and recurrence, track effort with a
**built-in timer**, collaborate through **threaded comments with @mentions**, watch the team's
health on a **live insights dashboard**, and stay in sync through **realtime updates, presence
and notifications**.

Built as a monorepo: a clean-architecture **Node.js / Express / MongoDB** API and a
**React 19 + Vite** single-page app. Fully bilingual (**English + Arabic with RTL**) and
theme-aware (light / dark / system).

<p align="center">
  <img src="client/src/assets/logo.png" alt="TaskControl" width="96" height="96" />
</p>

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configure the backend](#configure-the-backend)
  - [Seed demo data (optional)](#seed-demo-data-optional)
  - [Run it](#run-it)
- [Environment variables](#environment-variables)
- [npm scripts](#npm-scripts)
- [API overview](#api-overview)
- [Realtime events](#realtime-events)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

**Projects & boards**
- Projects with a short key (e.g. `ENG`) that generates human-friendly task keys (`ENG-42`)
- Drag-and-drop Kanban board with fractional ordering for stable positioning
- Per-project members with roles; a project lead
- Archive / restore projects

**Tasks**
- Statuses (`backlog → todo → in_progress → review → done`, plus `cancelled`), priorities, tags
- Assignee, reporter, watchers; due/start dates with overdue detection
- Checklists, task-to-task **dependencies** (blockers), **recurrence** (daily/weekly/monthly)
- File **attachments** (pluggable storage driver — local disk today, S3/Cloudinary-ready)
- **Time tracking**: start / pause / resume / stop timer, aggregated into actual hours
- Estimated vs. actual hours

**Collaboration**
- **Threaded comments** with edit/delete, emoji **reactions**, and **@mentions** (autocomplete picker)
- **Typing indicators** and live **presence** (online/offline dots)
- **Notifications** (in-app + realtime) for assignments, mentions, comments, invitations
- **Task suggestions** workflow — propose a task to a teammate, they accept/reject

**Team management**
- Workspaces with a role hierarchy: `owner › admin › manager › member`
- Invite members by email (in-app notification **and** email); accept/decline in-app
- Change member roles and remove members inline; **leave workspace**
- **Team Insights** dashboard: per-member workload distribution, completion rate, overdue &
  unassigned counts, status/priority breakdowns (Recharts)

**Planning & visibility**
- Personal **dashboard**: today's work, overdue, upcoming, project progress, recent activity
- **Calendar** view of tasks by due date
- **Contract System** — an interactive map where each project is a "contract" and its tasks are
  "sub-contracts"; draw links between projects (persisted server-side and synced live to the team)
- Global **search** across tasks, projects and people
- **Activity log** for auditability

**Platform**
- Bilingual UI (English / Arabic) with full **RTL** support
- Light / dark / system theme
- JWT auth (in-memory access token + httpOnly refresh cookie) with silent refresh

---

## Tech stack

**Backend** — Node.js, Express `4`, MongoDB + Mongoose `8`, Socket.IO `4`, JSON Web Tokens,
Multer (uploads), Nodemailer (email), Winston (logging), express-validator, Helmet, bcryptjs.

**Frontend** — React `19`, Vite, React Router `7`, TanStack Query `5`, Axios, Zustand,
Tailwind CSS `v4` + shadcn/ui, Recharts, Framer Motion, i18next, date-fns, Socket.IO client.

---

## Architecture

The backend follows a **layered clean architecture** — each layer has a single responsibility:

```
routes → controllers → services → repositories → models (Mongoose)
```

- **routes** map HTTP endpoints to controllers and attach validation / auth middleware.
- **controllers** are thin: parse the request, call a service, shape the response.
- **services** hold all business logic (the only layer that orchestrates rules).
- **repositories** are the only layer that talks to the database.
- **models** define Mongoose schemas.

Cross-cutting concerns live as their own services — activity log, notifications, email,
file storage (swappable driver), and a **decoupled realtime emitter** so any mutation can stream
live to connected clients without services importing Socket.IO directly.

**Realtime** — Socket.IO with a JWT-authenticated handshake and per-user / workspace / project
rooms. Services emit through the shared emitter (updates, presence, typing, notifications,
contract-link sync).

**Frontend** — TanStack Query manages server state over an Axios client; Zustand holds auth/session
state; React Router handles routing; Tailwind v4 + shadcn/ui provide the UI; a Socket.IO client
keeps everything in sync in real time.

---

## Project structure

```
task-control/
├── server/                 # Express REST API + Socket.IO (clean architecture)
│   ├── config/             # env, database, logger
│   ├── constants/          # roles, statuses, socket events, …
│   ├── controllers/        # thin request handlers
│   ├── services/           # business logic
│   ├── repositories/       # data access (Mongoose)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # versioned route modules
│   ├── middleware/         # auth, RBAC, validation, rate-limit, uploads, errors
│   ├── validators/         # express-validator rule sets
│   ├── sockets/            # Socket.IO setup + realtime emitter
│   ├── utils/              # ApiError/ApiResponse, jwt, crypto, pagination, …
│   ├── jobs/seed.js        # demo-data seeder
│   └── server.js           # entry point
├── client/                 # React 19 + Vite SPA
│   └── src/
│       ├── api/            # Axios clients per resource
│       ├── components/     # UI (board, layout, common, shadcn/ui primitives)
│       ├── contexts/       # Auth, Socket, Theme
│       ├── hooks/          # data hooks (TanStack Query)
│       ├── layouts/        # app + auth shells
│       ├── lib/            # i18n, query keys, socket, formatting, task metadata
│       ├── pages/          # route pages (dashboard, board, team, insights, …)
│       ├── routes/         # route tree + guards
│       └── store/          # Zustand stores
└── design-system/          # source-of-truth design tokens
```

---

## Getting started

### Prerequisites

- **Node.js ≥ 20**
- **MongoDB** — a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Installation

```bash
# 1. Clone
git clone https://github.com/uuofi/Task-Manager.git
cd Task-Manager

# 2. Install both apps (server + client)
npm run install:all
```

### Configure the backend

```bash
cd server
cp .env.example .env      # then edit .env
cd ..
```

At minimum, set these in `server/.env` (the server refuses to start without them):

| Variable | What it is |
|----------|------------|
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_ACCESS_SECRET` | Random secret for access tokens (`openssl rand -hex 64`) |
| `JWT_REFRESH_SECRET` | Random secret for refresh tokens (a **different** value) |
| `COOKIE_SECRET` | Random secret for signing cookies |

Email is optional: without SMTP credentials, emails are logged to the console instead of sent, so
every flow (password reset, invites) still works in development. See the full list in
[`server/.env.example`](server/.env.example).

The client needs no configuration in development — Vite proxies `/api`, `/uploads` and `/socket.io`
to the backend. To point at a remote API, set `VITE_API_URL` / `VITE_SOCKET_URL` in `client/.env`.

### Seed demo data (optional)

Populates a workspace, projects, tasks and demo users. **This wipes the database — run once, in dev.**

```bash
npm run seed
```

Demo accounts (all share the password **`Password1`**):

| Email | Role |
|-------|------|
| `owner@taskcontrol.app` | Owner |
| `alice@taskcontrol.app` | Admin |
| `bob@taskcontrol.app`   | Manager |
| `carol@taskcontrol.app` | Member |

### Run it

```bash
npm run dev          # runs the API and the client together
```

- **App:** http://localhost:5173
- **API:** http://localhost:5050/api/v1  (health check: `/health`)

Run them separately if you prefer: `npm run dev:server` / `npm run dev:client`.

---

## Environment variables

Backend (`server/.env`) — grouped highlights; see [`server/.env.example`](server/.env.example) for the
documented full list:

| Group | Keys |
|-------|------|
| Server | `NODE_ENV`, `PORT` (default `5050`), `API_PREFIX` (`/api/v1`) |
| CORS | `CLIENT_URL`, `CORS_ORIGINS` (comma-separated allow-list) |
| Database | `MONGODB_URI` |
| JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `RESET_TOKEN_EXPIRES_MIN` |
| Cookies | `COOKIE_SECRET` |
| Rate limiting | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX` |
| Storage | `STORAGE_DRIVER` (`local`), `UPLOAD_DIR`, `MAX_FILE_SIZE_MB` |
| Email (SMTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Logging | `LOG_LEVEL` |

Frontend (`client/.env`) — both optional in dev (the Vite proxy is used when empty):

| Key | What it is |
|-----|------------|
| `VITE_API_URL` | Absolute API base URL, e.g. `https://api.example.com/api/v1` |
| `VITE_SOCKET_URL` | Socket.IO server URL (same-origin when empty) |

> `.env` files are git-ignored — never commit secrets.

---

## npm scripts

Run from the repo root:

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install server + client dependencies |
| `npm run dev` | Run both apps together |
| `npm run dev:server` / `npm run dev:client` | Run a single app |
| `npm run seed` | Wipe + seed demo data (dev only) |
| `npm run build` | Production build of the client |
| `npm run start` | Start the API server (production) |
| `npm run lint` | Lint both apps |

---

## API overview

REST, versioned under `API_PREFIX` (default `/api/v1`). All responses share a consistent
`{ success, message, data }` envelope. Protected routes require a `Bearer` access token; workspace-
scoped routes resolve the workspace from an `x-workspace-id` header (or body/query).

| Base path | Purpose |
|-----------|---------|
| `/auth` | Register, login, refresh, logout, current user |
| `/users` | Profile, password, avatar |
| `/workspaces` | Current workspace, members, roles, leave |
| `/invitations` | Create / list / respond / revoke workspace invites |
| `/projects` | CRUD, archive/restore, project members |
| `/tasks` | CRUD, move, checklist, dependencies, comments, attachments, timer |
| `/comments` | Update, delete, react |
| `/attachments` | Download / delete files |
| `/suggestions` | Task-suggestion workflow (send / receive / accept / reject) |
| `/notifications` | List, unread count, mark read, delete |
| `/activity` | Activity log |
| `/search` | Global search |
| `/dashboard` | Personal dashboard + `/dashboard/team` insights |
| `/contract-links` | Project-to-project links for the Contract System map |

Health check: `GET /health`.

---

## Realtime events

Socket.IO uses a JWT-authenticated handshake and rooms: `user:<id>`, `workspace:<id>`,
`project:<id>`. Notable events (names shared between server and client):

- **Presence** — `presence:online`, `presence:offline`, `presence:list`
- **Tasks** — `task:created`, `task:updated`, `task:deleted`
- **Comments** — `comment:created`, `comment:updated`, `comment:deleted`
- **Typing** — `typing:start`, `typing:stop`
- **Notifications** — `notification:new`
- **Workspace** — `workspace:member_joined`, `workspace:joined`
- **Contract links** — `contract_link:created`, `contract_link:deleted`

---

## Security

- JWT auth: short-lived in-memory access token + httpOnly, signed refresh cookie with silent refresh
- Role-based access control (`owner › admin › manager › member`) enforced by middleware
- Passwords hashed with bcrypt
- Helmet security headers, CORS allow-list, HPP, mongo-sanitize
- Rate limiting (stricter on auth endpoints)
- Request validation on every mutating endpoint (express-validator)

---

## Deployment

- **Backend** — any Node host (Railway, Render, Fly.io, a VM…). Set the production env vars, point
  `MONGODB_URI` at your cluster, run `npm run start` in `server/`. Persist the `uploads/` directory
  (or switch `STORAGE_DRIVER` to a cloud driver) and set `CORS_ORIGINS` to your frontend origin.
- **Frontend** — `npm run build` in `client/` produces static assets in `client/dist/` for any static
  host (Vercel, Netlify, Cloudflare Pages…). Set `VITE_API_URL` and `VITE_SOCKET_URL` to your API.
- Share one database across the team by pointing everyone's `MONGODB_URI` at the same Atlas cluster
  (allow their IPs under **Atlas → Network Access**).

---

## Contributing

Contributions are welcome!

1. Fork the repo and create a feature branch: `git checkout -b feature/my-change`
2. Follow the existing structure (routes → controllers → services → repositories → models) and match
   the surrounding code style.
3. Run `npm run lint` before opening a PR.
4. Open a pull request describing what changed and why.

---

## License

Released under the **MIT License** — free to use, modify and distribute. See [`LICENSE`](LICENSE)
(update the copyright holder to your name before publishing).

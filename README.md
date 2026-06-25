# TaskControl

A real-time team task management platform (in the spirit of Linear / ClickUp).
Teams organize work into projects and Kanban boards, manage tasks with statuses,
priorities, assignees, due dates, dependencies and checklists, track time with a
built-in timer, collaborate through threaded comments, and stay in sync via live
updates, presence and notifications.

Built as a monorepo with a clean-architecture Node.js/Express/MongoDB API and a
React 19 + Vite single-page app.

## Architecture

```
tasckControl/
├── server/          # Express REST API + Socket.IO (clean architecture)
├── client/          # React 19 + Vite SPA
└── design-system/   # Source-of-truth design tokens for the UI
```

**Backend** — layered clean architecture, each layer with a single responsibility:

```
routes → controllers → services → repositories → models (Mongoose)
```

- **routes** map HTTP endpoints to controllers and attach validation/auth middleware.
- **controllers** are thin: parse the request, call a service, shape the response.
- **services** hold all business logic (the only layer that orchestrates rules).
- **repositories** are the only layer that touches the database.
- **models** define Mongoose schemas.

Cross-cutting concerns are isolated as their own services: activity log,
notifications, email, file storage (a swappable driver — local disk today, S3/Cloudinary later),
and a decoupled realtime emitter. Security is handled by middleware: JWT auth
(in-memory access token + httpOnly refresh cookie), role-based access control
(`owner › admin › manager › member`), Helmet, CORS allow-list, rate limiting,
mongo-sanitize and HPP.

**Realtime** — Socket.IO with a JWT-authenticated handshake and per-user / workspace /
project rooms. Services emit through the shared emitter so any mutation can stream
live to connected clients (updates, presence, typing indicators).

**Frontend** — React 19 + Vite. TanStack Query manages server state over an Axios
client, React Router handles routing, Tailwind v4 + shadcn/ui provide the UI, and a
Socket.IO client keeps the app in sync in real time.

**Tech stack** — Node.js, Express, MongoDB/Mongoose, JWT, Socket.IO, Multer, Winston ·
React 19, Vite, React Router, TanStack Query, Axios, Tailwind v4, shadcn/ui, Zustand, Recharts.

## Running the project

**Prerequisites:** Node ≥ 20 and a MongoDB database (local or MongoDB Atlas).

```bash
# 1. Install both apps (server + client)
npm run install:all

# 2. Configure the backend
cd server
cp .env.example .env      # then fill in MONGODB_URI + the JWT/cookie secrets
cd ..

# 3. (Optional) Seed demo data — wipes the database, run once
npm run seed

# 4. Run client + server together
npm run dev
```

- API: `http://localhost:5050/api/v1`  (health check: `/health`)
- App: `http://localhost:5173`

The Vite dev server proxies `/api`, `/uploads` and `/socket.io` to the backend.

### Environment variables

The server will not start without a valid `.env`. The required values are
`MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `COOKIE_SECRET`.
See [server/.env.example](server/.env.example) for the full, documented list.

To share one database across the whole team, point everyone's `MONGODB_URI` at the
same MongoDB Atlas cluster (and allow their IPs under Atlas → Network Access).
`.env` is git-ignored — never commit it.

### Root scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install server + client dependencies |
| `npm run dev` | Run both apps together |
| `npm run dev:server` / `npm run dev:client` | Run a single app |
| `npm run seed` | Wipe + seed demo data (dev only) |
| `npm run build` | Production build of the client |
| `npm run lint` | Lint both apps |
# Qrtise

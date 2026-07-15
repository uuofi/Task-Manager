# TaskControl — Docker & CI/CD

## Architecture

Only Caddy is exposed to the internet. Mongo and Redis sit on an `internal`
docker network with no host ports and no route out, so they are reachable only
by the API container.

```
                  ┌─────────────────────────────────────────┐
  Internet ──443──▶  caddy   (TLS, auto Let's Encrypt)       │
                  └──┬──────────────────────┬────────────────┘
                     │ /                    │ /api /uploads /socket.io
                     ▼                      ▼
                ┌─────────┐           ┌──────────┐
                │ client  │           │  server  │  Node 22 · Express
                │ nginx   │           │  :5050   │  Socket.IO · BullMQ
                └─────────┘           └────┬─────┘
                                           │  (internal network)
                                  ┌────────┴────────┐
                                  ▼                 ▼
                             ┌────────┐        ┌────────┐
                             │ mongo  │        │ redis  │
                             └────────┘        └────────┘
```

Everything is same-origin, so `src/lib/config.js` keeps its `/api/v1` +
same-origin Socket.IO defaults and the refresh-token cookie stays first-party.

| File                     | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| `server/Dockerfile`      | API image (`dev` and `runner` stages)      |
| `client/Dockerfile`      | Vite build → nginx (`build`/`runner`)      |
| `client/nginx.conf`      | SPA fallback + asset caching               |
| `docker-compose.yml`     | Production stack (pulls images from GHCR)  |
| `docker-compose.dev.yml` | Local dev stack (builds, hot reload)       |
| `Caddyfile`              | TLS + routing                              |
| `.env.example`           | Template for the server's `.env`           |
| `.github/workflows/ci-cd.yml` | Verify → build → push → deploy        |

---

## Local development

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Client: http://localhost:3000
- API health: http://localhost:5050/api/v1/health

Source is bind-mounted, so edits hot-reload. No `.env` needed — the dev compose
file supplies development placeholders for the JWT/cookie secrets that
`config/env.js` requires at startup.

Seed data (optional):

```bash
docker compose -f docker-compose.dev.yml exec server npm run seed
```

---

## First-time server setup

Requires a VPS with Docker Engine + the compose plugin, and a DNS `A` record for
your domain already pointing at it (Caddy validates the domain over :80 before
it can issue a certificate).

```bash
# 1. Open only what the edge needs
sudo ufw allow 22,80,443/tcp && sudo ufw enable

# 2. Create the deploy directory
sudo mkdir -p /opt/taskcontrol && sudo chown "$USER" /opt/taskcontrol
cd /opt/taskcontrol

# 3. Create .env from the template in this repo, then fill it in
nano .env
chmod 600 .env
```

Generate real secrets — do not ship the placeholders:

```bash
openssl rand -hex 64   # JWT_ACCESS_SECRET  (repeat for REFRESH + COOKIE)
openssl rand -hex 24   # MONGO_ROOT_PASSWORD / REDIS_PASSWORD
```

> **Keep DB passwords alphanumeric.** They are interpolated into `MONGODB_URI`
> and `REDIS_URL`; characters like `@ : / ? #` are URI syntax and will break
> authentication in confusing ways.

Set `SITE_ADDRESS`, and point `CLIENT_URL` / `CORS_ORIGINS` at the same public
HTTPS origin — the API rejects any other origin, and invitation/reset emails are
built from `CLIENT_URL`.

---

## GitHub setup

**Settings → Secrets and variables → Actions:**

| Secret           | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| `DEPLOY_HOST`    | Server IP or hostname                                     |
| `DEPLOY_USER`    | SSH user (must be in the `docker` group)                  |
| `DEPLOY_SSH_KEY` | **Private** key whose public half is in `authorized_keys` |
| `DEPLOY_PORT`    | Optional, defaults to `22`                                |

Create a dedicated key rather than reusing a personal one:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f deploy_key -N ""
ssh-copy-id -i deploy_key.pub user@your-server   # public half → server
cat deploy_key                                   # private half → DEPLOY_SSH_KEY
```

No registry secret is needed: the workflow authenticates to GHCR with the
built-in `GITHUB_TOKEN`.

---

## Pipeline

One workflow, `.github/workflows/ci-cd.yml`, covers both halves. The deploy
stages `needs` the verify stages, so code that fails linting or fails to build
can never reach production.

```
             lint (server, client) ─┐
             build client bundle   ─┼─▶ build images ─▶ push to GHCR ─▶ deploy ─▶ health check
             validate compose      ─┘   (server, client)
             └──────── every PR + push ────────┘   └──────── main only ────────┘
```

**On a pull request** it stops after building the images: nothing is pushed,
nothing is deployed — it only proves the branch is still deployable.

**On a push to `main`** (or *Run workflow*) it continues:

1. Pushes both images to GHCR tagged with the commit SHA (plus `latest`).
2. Copies `docker-compose.yml` + `Caddyfile` to `/opt/taskcontrol`, pins
   `IMAGE_TAG` to that SHA, then `docker compose pull && up -d`.
3. Waits for the API container's healthcheck to report `healthy`, dumping logs
   and failing the run if it never does.

`.env` on the server is never touched by CI. Deploys are serialized by the
`deploy-production` concurrency group, and runs on `main` are never
cancel-in-progress, so a deploy is never interrupted midway.

### Rollback

Every commit keeps its own image tag, so rolling back is repointing the tag:

```bash
cd /opt/taskcontrol
sed -i "s|^IMAGE_TAG=.*|IMAGE_TAG=<previous-commit-sha>|" .env
docker compose pull && docker compose up -d
```

---

## Operations

```bash
docker compose logs -f server        # tail API logs
docker compose ps                    # health of each service
docker compose restart server        # restart just the API
```

**Database indexes.** `config/database.js` sets `autoIndex: false` in
production, so Mongoose will not build indexes on boot. Build them once after
the first deploy:

```bash
docker compose exec server node --input-type=module -e "
  import('./config/database.js').then(async (db) => {
    await db.connectDatabase();
    const { default: mongoose } = await import('mongoose');
    await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
    console.log('indexes synced');
    process.exit(0);
  });"
```

**Backups.** `mongo_data`, `redis_data` and `uploads` are docker volumes — they
survive `docker compose down`, but are destroyed by `down -v`. Back Mongo and
the uploaded attachments up off-box:

```bash
docker compose exec -T mongo mongodump \
  --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --archive --gzip > "backup-$(date +%F).gz"

docker run --rm -v taskcontrol_uploads:/data -v "$PWD":/out alpine \
  tar czf /out/uploads-$(date +%F).tgz -C /data .
```

Restore with `mongorestore --archive --gzip --drop`.

---

## Troubleshooting

| Symptom | Cause |
| ------- | ----- |
| Caddy can't get a certificate | DNS not pointing at the server yet, or :80 blocked — Caddy needs :80 reachable for the ACME challenge. |
| `Missing required environment variable` | `.env` is absent or incomplete at `/opt/taskcontrol`. |
| API healthy, but login fails from the browser | `CORS_ORIGINS` / `CLIENT_URL` don't exactly match the public origin (scheme included). |
| Mongo auth errors | A non-alphanumeric password broke `MONGODB_URI`, or `mongo_data` was initialised with different credentials — the root user is only created on the volume's *first* start. |
| Uploads vanish after redeploy | Something is writing outside `/app/uploads`; only that path is on a volume. |

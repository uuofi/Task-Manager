# syntax=docker/dockerfile:1.7

# ---------- deps: production node_modules only ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- dev: nodemon + devDependencies (used by docker-compose.dev.yml) ----------
# Declared before `runner` so that `runner` stays the default build target.
FROM node:22-alpine AS dev
RUN apk add --no-cache tini
ENV NODE_ENV=development \
    PORT=5050 \
    API_PREFIX=/api/v1
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5050
ENTRYPOINT ["/sbin/tini", "--"]
# nodemon is invoked directly rather than via `npm run dev` because nodemon only
# reads its own flags BEFORE the script name — anything after `server.js` is
# forwarded to the app instead. --legacy-watch (polling) is required because bind
# mounts, especially from Windows/WSL, do not deliver inotify events into the
# container. nodemon.json still applies (watch/ext/ignore).
CMD ["npx", "nodemon", "--legacy-watch", "server.js"]

# ---------- runner ----------
FROM node:22-alpine AS runner

# tini reaps zombies and forwards SIGTERM to node, so the graceful shutdown in
# server.js (drain sockets, close BullMQ workers, close mongo) actually runs.
RUN apk add --no-cache tini

ENV NODE_ENV=production \
    PORT=5050 \
    API_PREFIX=/api/v1

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# Written at runtime by multer and winston-daily-rotate-file. Created here so
# they exist and are writable even before a volume is mounted over them.
RUN mkdir -p uploads logs && chown -R node:node uploads logs

USER node

EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}${API_PREFIX}/health" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

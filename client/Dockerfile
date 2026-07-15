# syntax=docker/dockerfile:1.7

# ---------- deps: shared node_modules layer ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- dev: vite dev server (used by docker-compose.dev.yml) ----------
# Stops short of the production build, which `dev` never needs.
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# ---------- build: compile the Vite bundle ----------
FROM deps AS build
COPY . .

# Vite inlines VITE_* vars at BUILD time, so they are build args, not runtime env.
# Both default to empty: behind the Caddy reverse proxy the API and Socket.IO are
# same-origin, and src/lib/config.js then falls back to "/api/v1" + same-origin
# sockets. Only set these if the API is served from a different domain.
ARG VITE_API_URL=""
ARG VITE_SOCKET_URL=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# ---------- runner ----------
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

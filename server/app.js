import path from 'node:path';
import { fileURLToPath } from 'node:url';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';

import { env } from './config/env.js';
import { morganStream } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes/index.js';
import { ApiError } from './utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Builds and configures the Express application. Kept separate from the HTTP
 * server bootstrap (server.js) so it can be imported in tests without binding
 * a port
 */
export const createApp = () => {
  const app = express();

  // Behind a reverse proxy (nginx, load balancer) — trust X-Forwarded-* headers.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // --- Security headers ---
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploads
    }),
  );

  // --- CORS ---
  const allowedOrigins = new Set(env.corsOrigins);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser clients (curl, mobile) with no Origin header.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(new ApiError(403, `CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    }),
  );

  // --- Body & cookie parsing ---
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.cookieSecret));

  // --- Sanitization & hardening ---
  app.use(mongoSanitize()); // strips $ and . from keys to block NoSQL injection
  app.use(hpp()); // prevents HTTP parameter pollution
  app.use(compression());

  // --- Request logging ---
  app.use(
    morgan(env.isProd ? 'combined' : 'dev', {
      stream: morganStream,
      skip: (req) => req.originalUrl === `${env.apiPrefix}/health`,
    }),
  );

  // --- Static uploads ---
  app.use('/uploads', express.static(path.resolve(__dirname, env.storage.uploadDir)));

  // --- Rate limiting (API only) ---
  app.use(env.apiPrefix, apiLimiter);

  // --- API routes ---
  app.use(env.apiPrefix, apiRouter);

  app.get('/', (_req, res) => {
    res.json({ name: 'TaskControl API', version: '1.0.0', docs: `${env.apiPrefix}/health` });
  });

  // --- 404 + global error handler (must be last) ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;

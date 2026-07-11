import http from 'node:http';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { redis } from './config/redis.js';
// Side-effect import: registers every Mongoose model so populate() across
// refs (e.g. Task -> Attachment) works regardless of import order.
import './models/index.js';
// Side-effect import: starts the BullMQ workers that process queued
// invitation emails and notifications (see queues/workers.js).
import { closeWorkers } from './queues/workers.js';
import { initSocketServer } from './sockets/index.js';

/**
 * Binds the HTTP server, retrying on EADDRINUSE. Under nodemon on Windows the
 * previous instance's port isn't always released by the time the restarted
 * process binds (Windows lags releasing a socket with open long-lived
 * connections, e.g. Socket.IO clients) — without this, that race surfaces as
 * an uncaught exception that crashes nodemon instead of just retrying.
 */
const listenWithRetry = (server, port, retriesLeft = 8) =>
  new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener('error', onError);
      if (err.code === 'EADDRINUSE' && retriesLeft > 0) {
        logger.warn(`Port ${port} still in use — retrying in 500ms (${retriesLeft} left)`);
        setTimeout(() => listenWithRetry(server, port, retriesLeft - 1).then(resolve, reject), 500);
      } else {
        reject(err);
      }
    };
    server.once('error', onError);
    server.listen(port, () => {
      server.removeListener('error', onError);
      resolve();
    });
  });

/**
 * Application bootstrap: connect to the database, start the HTTP server, attach
 * realtime (Socket.IO is wired in a later step), and wire graceful shutdown.
 */
const start = async () => {
  try {
    await connectDatabase();

    const app = createApp();
    const server = http.createServer(app);

    // Attach realtime (Socket.IO) — connects the realtime emitter used by services.
    initSocketServer(server);

    await listenWithRetry(server, env.port);
    logger.info(`🚀 TaskControl API running in ${env.nodeEnv} mode on port ${env.port}`);
    logger.info(`   Base URL: http://localhost:${env.port}${env.apiPrefix}`);

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      // Socket.IO clients hold long-lived connections open, so server.close()'s
      // callback would otherwise wait indefinitely for them to disconnect.
      server.closeAllConnections?.();
      server.close(async () => {
        await closeWorkers();
        await redis.quit();
        await disconnectDatabase();
        logger.info('HTTP server closed. Bye 👋');
        process.exit(0);
      });

      // Force-exit if connections do not drain in time.
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000).unref();
    };

    ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}\n${error.stack}`);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.stack}`);
  process.exit(1);
});

start();

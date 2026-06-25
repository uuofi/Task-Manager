import http from 'node:http';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
// Side-effect import: registers every Mongoose model so populate() across
// refs (e.g. Task -> Attachment) works regardless of import order.
import './models/index.js';
import { initSocketServer } from './sockets/index.js';

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

    server.listen(env.port, () => {
      logger.info(`🚀 TaskControl API running in ${env.nodeEnv} mode on port ${env.port}`);
      logger.info(`   Base URL: http://localhost:${env.port}${env.apiPrefix}`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
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

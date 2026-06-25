import mongoose from 'mongoose';

import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Establishes the MongoDB connection with sensible production defaults and
 * structured logging on connection lifecycle events.
 *
 * @returns {Promise<typeof mongoose>}
 */
export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);

  // Surface slow/odd queries in development.
  if (env.isDev) {
    mongoose.set('debug', false);
  }

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
    autoIndex: !env.isProd, // build indexes automatically in dev only
  });

  return mongoose;
};

/** Gracefully closes the MongoDB connection. */
export const disconnectDatabase = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

export default connectDatabase;

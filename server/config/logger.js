import path from 'node:path';
import { fileURLToPath } from 'node:url';

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.resolve(__dirname, '../logs');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} ${level}: ${stack || message}`;
  }),
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const transports = [
  new winston.transports.Console({ format: consoleFormat }),
];

// Persist rotating logs only outside of test runs to keep CI clean.
if (!env.isTest) {
  transports.push(
    new DailyRotateFile({
      dirname: logDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat,
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),
  );
}

export const logger = winston.createLogger({
  level: env.logLevel,
  transports,
  exitOnError: false,
});

/** A Morgan-compatible stream that pipes HTTP logs through Winston. */
export const morganStream = {
  write: (message) => logger.http?.(message.trim()) ?? logger.info(message.trim()),
};

export default logger;

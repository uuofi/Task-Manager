import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server root regardless of where the process is started.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Reads an environment variable, throwing if it is required and missing.
 * Keeps configuration explicit and fails fast on misconfiguration.
 */
const required = (key) => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toList = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const nodeEnv = optional('NODE_ENV', 'development');
const isProd = nodeEnv === 'production';

/**
 * Centralized, validated configuration object.
 * Import this instead of reading `process.env` directly elsewhere.
 */
export const env = Object.freeze({
  nodeEnv,
  isProd,
  isDev: nodeEnv === 'development',
  isTest: nodeEnv === 'test',

  port: toInt(optional('PORT', '5000'), 5000),
  apiPrefix: optional('API_PREFIX', '/api/v1'),

  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),
  corsOrigins: toList(optional('CORS_ORIGINS', 'http://localhost:5173')),

  mongoUri: required('MONGODB_URI'),

  redisUrl: optional('REDIS_URL', 'redis://127.0.0.1:6379'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
    resetTokenExpiresMin: toInt(optional('RESET_TOKEN_EXPIRES_MIN', '30'), 30),
  },

  cookieSecret: optional('COOKIE_SECRET', 'insecure-dev-cookie-secret'),

  storage: {
    driver: optional('STORAGE_DRIVER', 'local'),
    uploadDir: optional('UPLOAD_DIR', 'uploads'),
    maxFileSizeMb: toInt(optional('MAX_FILE_SIZE_MB', '10'), 10),
  },

  smtp: {
    host: optional('SMTP_HOST', ''),
    port: toInt(optional('SMTP_PORT', '587'), 587),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('SMTP_FROM', 'TaskControl <no-reply@taskcontrol.app>'),
  },

  // Telegram bot that receives messages submitted through the public contact form.
  telegram: {
    botToken: optional('TELEGRAM_BOT_TOKEN', ''),
    chatId: optional('TELEGRAM_CHAT_ID', ''),
  },

  rateLimit: {
    windowMs: toInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 900000),
    max: toInt(optional('RATE_LIMIT_MAX', '300'), 300),
    authMax: toInt(optional('AUTH_RATE_LIMIT_MAX', '20'), 20),
    contactMax: toInt(optional('CONTACT_RATE_LIMIT_MAX', '5'), 5),
  },

  logLevel: optional('LOG_LEVEL', isProd ? 'info' : 'debug'),
});

export default env;

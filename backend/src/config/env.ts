import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load backend/.env, falling back to process.cwd() .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  HOST: process.env.HOST || '0.0.0.0',
  MONGO_URI:
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/haztrack',
  JWT_SECRET: process.env.JWT_SECRET || 'haztrack-super-secure-jwt-token-key-2026-eec',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  DEMO_MODE:
    process.env.DEMO_MODE === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE !== 'false'),
  ALLOW_EMBEDDED_DB_FALLBACK:
    process.env.ALLOW_EMBEDDED_DB_FALLBACK === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.ALLOW_EMBEDDED_DB_FALLBACK !== 'false'),
  SERVE_FRONTEND:
    process.env.SERVE_FRONTEND === 'true' ||
    process.env.SERVE_STATIC === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND !== 'false'),
};

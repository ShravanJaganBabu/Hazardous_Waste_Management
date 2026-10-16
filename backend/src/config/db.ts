import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongodMem: any = null;

// Helper to mask credentials in connection URI for security
const sanitizeUri = (rawUri: string): string => {
  return rawUri.replace(/\/\/(.*):(.*)@/, '//$1:*****@');
};

export const connectDB = async (): Promise<void> => {
  const isRemote = ENV.MONGO_URI.includes('mongodb+srv://') || !ENV.MONGO_URI.includes('127.0.0.1');
  const timeoutMs = isRemote ? 15000 : 2500;

  // Attempt 1: Direct connect to remote Atlas or local configured MongoDB instance
  try {
    console.log(`[HAZTRACK DB] Connecting to database (${sanitizeUri(ENV.MONGO_URI)})...`);
    await mongoose.connect(ENV.MONGO_URI, {
      dbName: 'haztrack',
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
      socketTimeoutMS: 45000,
    });
    console.log(`[HAZTRACK DB] ✓ Database Connected Successfully: ${sanitizeUri(ENV.MONGO_URI)}`);
    return;
  } catch (error: any) {
    console.warn(`[HAZTRACK DB] Primary database connection failed (${error.message}).`);
    if (isRemote) {
      console.warn('[HAZTRACK DB] Note: If deploying with MongoDB Atlas, ensure Network Access allows 0.0.0.0/0 (anywhere).');
    }
  }

  // Attempt 2: Embedded MongoMemoryServer (works 100% offline & without external services)
  if (ENV.ALLOW_EMBEDDED_DB_FALLBACK) {
    try {
      console.log('[HAZTRACK DB] Activating Embedded MongoDB Engine...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      try {
        mongodMem = await MongoMemoryServer.create();
      } catch (firstErr) {
        console.warn('[HAZTRACK DB] Initial embedded start timed out. Retrying after cleanup...');
        await new Promise((r) => setTimeout(r, 2000));
        mongodMem = await MongoMemoryServer.create();
      }
      const uri = mongodMem.getUri();
      await mongoose.connect(uri, {
        dbName: 'haztrack',
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`[HAZTRACK DB] ✓ Connected to Embedded MongoDB at: ${uri}`);
    } catch (memError: any) {
      console.error('[HAZTRACK DB] Critical: Unable to initialize Embedded MongoDB:', memError.message);
      process.exit(1);
    }
  } else {
    console.error('\n============================================================');
    console.error('[HAZTRACK DB CRITICAL ERROR] Failed to connect to persistent database.');
    console.error(`Attempted URI: ${sanitizeUri(ENV.MONGO_URI)}`);
    console.error('Environment: ' + ENV.NODE_ENV);
    console.error('Embedded fallback is disabled (ALLOW_EMBEDDED_DB_FALLBACK=false).');
    console.error('Troubleshooting checklist for MongoDB Atlas:');
    console.error('  1. Check MONGODB_URI in Render environment variables.');
    console.error('  2. In MongoDB Atlas -> Network Access, ensure 0.0.0.0/0 (anywhere) is allowed.');
    console.error('  3. In MongoDB Atlas -> Database Access, verify user password and permissions.');
    console.error('============================================================\n');
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodMem) {
    await mongodMem.stop();
  }
};



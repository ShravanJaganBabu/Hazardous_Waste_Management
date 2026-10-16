import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import { ENV } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { initSocket } from './socket/socketHandler.js';
import { seedDatabase } from './seed/seedDatabase.js';
import { User } from './models/User.js';
import { MonitoringEngine } from './services/monitoringEngine.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import wasteRoutes from './routes/wasteRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import investigationRoutes from './routes/investigationRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Dynamic CORS Origin Validator (Supports Vercel, Netlify, Render, Localhost, & Custom Origins)
const configuredOrigins = ENV.CORS_ORIGIN
  ? ENV.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const defaultAllowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Server-to-server, curl, mobile
  if (configuredOrigins.includes('*')) return true;
  if (configuredOrigins.includes(origin) || defaultAllowedOrigins.includes(origin)) return true;
  // Allow all standard cloud preview and deployment subdomains
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/.*\.netlify\.app$/.test(origin)) return true;
  if (/^https:\/\/.*\.onrender\.com$/.test(origin)) return true;
  if (/^https:\/\/.*\.railway\.app$/.test(origin)) return true;
  return false;
};

// Security & Parsing
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS REJECTED] Origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role', 'x-demo-userid'],
  })
);

// Resilient Zero-Dependency UTF-8 JSON Body Parser
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    let rawBody = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      rawBody += chunk;
    });
    req.on('end', () => {
      try {
        req.body = rawBody.trim() ? JSON.parse(rawBody) : {};
      } catch (parseErr) {
        req.body = {};
      }
      next();
    });
    req.on('error', (err) => {
      console.error('[STREAM ERROR]', err);
      req.body = {};
      next();
    });
  } else {
    express.json({ limit: '10mb' })(req, res, () => {
      express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
    });
  }
});

// Socket.IO with production CORS matching
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});
initSocket(io);

// Health Check Endpoint (Essential for Render/Railway/Fly.io Health Checks)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OPERATIONAL',
    system: 'HAZTRACK // ENTERPRISE SECURE CHAIN',
    version: '2.0.0-PROD',
    department: 'Hazardous Waste Management & Tracking System',
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV,
    port: ENV.PORT,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/investigations', investigationRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/ai', aiRoutes);

// Production Static Assets & SPA Routing Fallback
// Enables single-service monolithic deployment on Render/Railway if frontend is pre-built
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`[HAZTRACK] Serving production frontend build from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    // Preserve API & Socket paths
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal error occurred.',
  });
});

const startServer = async () => {
  try {
    // Validate JWT Secret in production
    if (ENV.NODE_ENV === 'production') {
      const isDefaultSecret = !process.env.JWT_SECRET || process.env.JWT_SECRET === 'haztrack-super-secure-jwt-token-key-2026-eec';
      if (isDefaultSecret) {
        console.warn('\n[SECURITY WARNING] Production running with default JWT_SECRET.');
        console.warn('Set a strong, random 64+ char JWT_SECRET in your Render environment variables.\n');
      }
    }

    await connectDB();

    // Auto-seed ONLY if database is completely fresh
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[HAZTRACK] Fresh database detected. Executing initial seed...');
      await seedDatabase();
    } else {
      console.log(`[HAZTRACK] Persistent database active (${userCount} registered stakeholders). Preserving existing records.`);
    }

    // Schedule monitoring engine checks every 60 seconds
    setInterval(() => {
      MonitoringEngine.runScheduledChecks();
    }, 60000);

    const port = Number(ENV.PORT) || 5000;
    const host = ENV.HOST || '0.0.0.0';

    server.listen(port, host, () => {
      console.log(`
============================================================
  HAZTRACK // SECURE CHAIN BACKEND SERVER
  Status:  ONLINE
  Host:    ${host}
  Port:    ${port}
  Env:     ${ENV.NODE_ENV}
  Auth:    JWT + Bcrypt RBAC
  Engine:  Smart Monitoring & Recipient Voice Routing
  System:  HazTrack Regulatory & Compliance Network
============================================================
      `);
    });
  } catch (error) {
    console.error('[STARTUP FAILED]', error);
    process.exit(1);
  }
};

startServer();

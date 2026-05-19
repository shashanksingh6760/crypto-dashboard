import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { initializeWebSocket } from './websocket';

const app = express();
const httpServer = createServer(app);

// ─── Middleware Stack ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { status: 'error', message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─── Routes ─────────────────────────────────────────────────
app.use('/api', routes);

// ─── Error Handling ─────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── WebSocket ──────────────────────────────────────────────
initializeWebSocket(httpServer);

// ─── Redis Pub/Sub Subscriber ───────────────────────────────
import { initializeSubscriber } from './services/subscriber.service';
initializeSubscriber();

// ─── Background Worker ──────────────────────────────────────
import { initializeWorker } from './worker';
initializeWorker();

// ─── Start Server ───────────────────────────────────────────
httpServer.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🚀 Crypto Intelligence API Server          ║
  ║   Port: ${config.port}                              ║
  ║   Mode: ${config.nodeEnv.padEnd(16)}              ║
  ║   WebSocket: Enabled                          ║
  ╚══════════════════════════════════════════════╝
  `);
});

export default app;

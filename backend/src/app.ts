import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { env } from './config/env';

const app = express();

// ─── Rate Limiting ───
// Protects the Gemini API key from being exhausted by repeated/abusive requests.

// Strict limit on the chat endpoint (LLM calls) — 30 requests per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 30,                  // 30 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a moment before sending another message.',
    },
  },
});

// General limit on all other routes — 60 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down.',
    },
  },
});

// ─── Middleware ───
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (env.ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);

// Apply rate limits
app.use('/api/chat', chatLimiter);
app.use('/api', generalLimiter);

// ─── Routes ───
app.use('/api', routes);

// ─── 404 ───
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist.',
    },
  });
});

// ─── Error handler (must be last) ───
app.use(errorHandler);

export default app;

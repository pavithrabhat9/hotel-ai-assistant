import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { env } from './config/env';

const app = express();

// ─── Middleware ───
app.use(cors({
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);

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

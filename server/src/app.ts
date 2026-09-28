import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';

export function createApp(): Application {
  const app = express();

  // Security Headers via Helmet
  app.use(helmet());

  // CORS Configuration - Supports frontend dev and production
  app.use(cors({
    origin: (origin, callback) => {
      // Allow localhost, client origin, or mobile/curl/postman requests
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Global Rate Limiter: 500 requests per 15 minutes per IP
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    },
  });
  app.use(limiter);

  // Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes Mount - supports both /api and /api/v1
  app.use('/api', apiRouter);
  app.use('/api/v1', apiRouter);

  // Fallback 404 for unmapped API routes
  app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `The requested endpoint ${req.method} ${req.originalUrl} was not found on this server.`,
      errorCode: 'ENDPOINT_NOT_FOUND',
    });
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
}

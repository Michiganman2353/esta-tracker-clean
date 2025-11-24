import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { accrualRouter } from './routes/accrual.js';
import { requestsRouter } from './routes/requests.js';
import { auditRouter } from './routes/audit.js';
import { retaliationRouter } from './routes/retaliation.js';
import { employerRouter } from './routes/employer.js';
import { documentsRouter } from './routes/documents.js';
import policiesRouter from './routes/policies.js';
import importRouter from './routes/import.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());

// Rate limiting - Apply general rate limiter to all requests
app.use(generalLimiter);

// CORS configuration to support multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://estatracker.com',
  'https://www.estatracker.com',
  process.env.CORS_ORIGIN,
  process.env.ALLOWED_ORIGIN,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list or matches Vercel preview deployments
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ESTA Tracker API', version: '2.0.0' });
});

// API Routes
// Apply strict rate limiting to auth endpoints
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/accrual', accrualRouter);
app.use('/api/v1/requests', requestsRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/retaliation', retaliationRouter);
app.use('/api/v1/employer', employerRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/policies', policiesRouter);
app.use('/api/v1/import', importRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ ESTA Tracker API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;

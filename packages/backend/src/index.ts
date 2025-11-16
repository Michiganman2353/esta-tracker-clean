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
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ESTA Tracker API', version: '2.0.0' });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/accrual', accrualRouter);
app.use('/api/v1/requests', requestsRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/retaliation', retaliationRouter);
app.use('/api/v1/employer', employerRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ ESTA Tracker API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;

import { Router } from 'express';

export const auditRouter = Router();

auditRouter.get('/logs', (_req, res) => {
  res.json({ logs: [] });
});

auditRouter.get('/export', (_req, res) => {
  res.json({ url: 'mock-export-url' });
});

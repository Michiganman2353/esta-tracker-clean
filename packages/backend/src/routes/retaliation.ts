import { Router } from 'express';

export const retaliationRouter = Router();

retaliationRouter.post('/report', (req, res) => {
  res.json({ success: true, report: { id: '1', ...req.body } });
});

retaliationRouter.get('/reports', (_req, res) => {
  res.json({ reports: [] });
});

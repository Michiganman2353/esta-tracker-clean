import { Router } from 'express';

export const employerRouter = Router();

employerRouter.get('/employees', (_req, res) => {
  res.json({ employees: [] });
});

employerRouter.patch('/settings', (_req, res) => {
  res.json({ success: true });
});

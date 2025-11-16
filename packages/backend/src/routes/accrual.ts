import { Router } from 'express';

export const accrualRouter = Router();

accrualRouter.get('/balance/:userId', (_req, res) => {
  res.json({ balance: { availablePaidHours: 40, yearlyAccrued: 10 } });
});

accrualRouter.get('/work-logs/:userId', (_req, res) => {
  res.json({ logs: [] });
});

accrualRouter.post('/log-work', (_req, res) => {
  res.json({ success: true });
});

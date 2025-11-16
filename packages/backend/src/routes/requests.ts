import { Router } from 'express';

export const requestsRouter = Router();

requestsRouter.get('/', (_req, res) => {
  res.json({ requests: [] });
});

requestsRouter.post('/', (req, res) => {
  res.json({ success: true, request: { id: '1', ...req.body } });
});

requestsRouter.patch('/:id', (req, res) => {
  res.json({ success: true, status: req.body.status });
});

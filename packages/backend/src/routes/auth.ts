import { Router } from 'express';

export const authRouter = Router();

// Mock authentication endpoints
authRouter.post('/login', (req, res) => {
  res.json({ token: 'mock-token', user: { id: '1', email: req.body.email, name: 'Test User', role: 'employee' } });
});

authRouter.post('/register', (req, res) => {
  res.json({ token: 'mock-token', user: { id: '1', email: req.body.email, name: req.body.name, role: 'employee' } });
});

authRouter.post('/logout', (_req, res) => {
  res.json({ success: true });
});

authRouter.get('/me', (_req, res) => {
  res.json({ user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' } });
});

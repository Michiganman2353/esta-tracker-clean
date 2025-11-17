import { Router, Request, Response, NextFunction } from 'express';

export const authRouter = Router();

// Simple in-memory store for mock tokens
const tokenStore = new Map<string, { email: string; name: string; role: 'employee' | 'employer' | 'admin' }>();

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: { email: string; name: string; role: 'employee' | 'employer' | 'admin' };
}

// Helper function to create a complete mock user
function createMockUser(email: string, name: string, role: 'employee' | 'employer' | 'admin' = 'employee') {
  const now = new Date().toISOString();
  return {
    id: '1',
    email,
    name,
    role,
    employerSize: 'large' as const,
    employerId: 'emp-1',
    createdAt: now,
    updatedAt: now,
  };
}

// Middleware to check authentication
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth middleware: No token provided');
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const userData = tokenStore.get(token);
  
  if (!userData) {
    console.log('Auth middleware: Invalid token');
    return res.status(401).json({ message: 'Invalid token' });
  }

  (req as AuthRequest).user = userData;
  next();
}

// Mock authentication endpoints
authRouter.post('/login', (req, res) => {
  console.log('Login request:', req.body.email);
  const token = `mock-token-${Date.now()}`;
  const userData = { email: req.body.email, name: 'Test User', role: 'employee' as const };
  tokenStore.set(token, userData);
  
  const user = createMockUser(userData.email, userData.name, userData.role);
  res.json({ token, user });
});

authRouter.post('/register', (req, res) => {
  console.log('Register request:', req.body.email, req.body.name);
  const token = `mock-token-${Date.now()}`;
  const userData = { email: req.body.email, name: req.body.name, role: 'employee' as const };
  tokenStore.set(token, userData);
  
  const user = createMockUser(userData.email, userData.name, userData.role);
  res.json({ token, user });
});

authRouter.post('/logout', authenticate, (req, res) => {
  console.log('Logout request');
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    tokenStore.delete(token);
  }
  res.json({ success: true });
});

authRouter.get('/me', authenticate, (req, res) => {
  console.log('Get current user request');
  const userData = (req as AuthRequest).user;
  if (!userData) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const user = createMockUser(userData.email, userData.name, userData.role);
  res.json({ user });
});

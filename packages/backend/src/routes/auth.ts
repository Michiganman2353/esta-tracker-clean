import { Router } from 'express';
import { randomUUID } from 'crypto';

export const authRouter = Router();

// In-memory user storage for development
// In production, this would be a database
interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  employerSize: string;
  employerId?: string;
  companyName?: string;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

const users = new Map<string, StoredUser>();
const tokenToUserId = new Map<string, string>();

// Mock authentication endpoints
authRouter.post('/login', (req, res) => {
  const { email } = req.body;
  
  // Find user by email
  let user: StoredUser | undefined;
  for (const [, u] of users) {
    if (u.email === email) {
      user = u;
      break;
    }
  }
  
  if (user) {
    // Generate token and store mapping
    const token = `mock-token-${user.role}-${user.id}`;
    tokenToUserId.set(token, user.id);
    
    res.json({ 
      token, 
      user
    });
  } else {
    // For testing, create a default employee user
    const defaultUser: StoredUser = {
      id: '1',
      email: email,
      name: 'Test User',
      role: 'employee',
      status: 'approved',
      employerSize: 'small',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const token = 'mock-token-employee-1';
    users.set('1', defaultUser);
    tokenToUserId.set(token, '1');
    
    res.json({ 
      token, 
      user: defaultUser 
    });
  }
});

authRouter.post('/register', (req, res) => {
  const { email, name } = req.body;
  const userId = 'user-' + randomUUID();
  const token = `mock-token-employee-${userId}`;
  
  const user: StoredUser = {
    id: userId,
    email,
    name,
    role: 'employee',
    status: 'approved',
    employerSize: 'small',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.set(userId, user);
  tokenToUserId.set(token, userId);
  
  res.json({ token, user });
});

// Employee registration endpoint
authRouter.post('/register/employee', (req, res) => {
  const { name, email, password } = req.body;
  
  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  // Check if email already exists
  for (const [, user] of users) {
    if (user.email === email) {
      return res.status(409).json({ message: 'Email already registered' });
    }
  }

  // In a real app, you would:
  // 1. Hash the password
  // 2. Save to database
  // 3. Generate real JWT token
  
  const userId = 'emp-' + randomUUID();
  const token = `mock-token-employee-${userId}`;
  
  const user: StoredUser = {
    id: userId,
    email,
    name,
    role: 'employee',
    employerSize: 'small',
    status: 'approved', // Employees are auto-approved
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.set(userId, user);
  tokenToUserId.set(token, userId);
  
  res.json({ 
    token, 
    user
  });
});

// Manager registration endpoint
authRouter.post('/register/manager', (req, res) => {
  const { name, email, password, companyName, employeeCount } = req.body;
  
  // Basic validation
  if (!name || !email || !password || !companyName || !employeeCount) {
    return res.status(400).json({ 
      message: 'Name, email, password, company name, and employee count are required' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  if (employeeCount < 1) {
    return res.status(400).json({ message: 'Employee count must be at least 1' });
  }

  // Check if email already exists
  for (const [, user] of users) {
    if (user.email === email) {
      return res.status(409).json({ message: 'Email already registered' });
    }
  }

  // Determine employer size based on Michigan ESTA law
  // Small employers: < 10 employees (40 hours max paid, 32 hours unpaid)
  // Large employers: >= 10 employees (72 hours max paid)
  const employerSize = employeeCount < 10 ? 'small' : 'large';

  // In a real app, you would:
  // 1. Hash the password
  // 2. Save user and company info to database
  // 3. Send notification to admin for approval
  // 4. Create employer settings record after approval
  
  // Manager registration requires approval before access is granted
  // Return token so user can be logged in immediately after registration
  // NOTE: In production, use cryptographically secure JWT tokens instead of mock tokens
  
  const userId = 'mgr-' + randomUUID();
  const employerId = 'company-' + randomUUID();
  const token = `mock-token-manager-${userId}`;
  
  const user: StoredUser = {
    id: userId,
    email,
    name,
    role: 'employer',
    employerId,
    employerSize,
    companyName,
    employeeCount,
    status: 'approved', // Changed to 'approved' for immediate access during development
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.set(userId, user);
  tokenToUserId.set(token, userId);
  
  res.json({ 
    success: true,
    message: 'Registration completed successfully.',
    token,
    user
  });
});

authRouter.post('/logout', (_req, res) => {
  res.json({ success: true });
});

authRouter.get('/me', (req, res) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token || token === 'null') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Get user ID from token
  const userId = tokenToUserId.get(token);
  
  if (!userId) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  // Get user data
  const user = users.get(userId);
  
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }
  
  res.json({ user });
});

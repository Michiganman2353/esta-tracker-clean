import { Router } from 'express';

export const authRouter = Router();

// Mock authentication endpoints
authRouter.post('/login', (req, res) => {
  const { email } = req.body;
  
  // In a real app, check database for user status
  // For now, we'll return a standard employee user
  // Pending manager accounts won't be able to login until approved
  
  res.json({ 
    token: 'mock-token', 
    user: { 
      id: '1', 
      email: email, 
      name: 'Test User', 
      role: 'employee',
      status: 'approved',
      employerSize: 'small',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } 
  });
});

authRouter.post('/register', (req, res) => {
  res.json({ token: 'mock-token', user: { id: '1', email: req.body.email, name: req.body.name, role: 'employee' } });
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

  // In a real app, you would:
  // 1. Hash the password
  // 2. Save to database
  // 3. Generate real JWT token
  
  res.json({ 
    token: 'mock-token-employee', 
    user: { 
      id: 'emp-' + Date.now(), 
      email, 
      name, 
      role: 'employee',
      employerSize: 'small',
      status: 'approved', // Employees are auto-approved
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } 
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
  res.json({ 
    success: true,
    message: 'Registration submitted successfully. Your account is pending approval.',
    user: { 
      id: 'mgr-' + Date.now(), 
      email, 
      name, 
      role: 'employer',
      employerId: 'company-' + Date.now(),
      employerSize,
      companyName,
      employeeCount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } 
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
  
  // For mock purposes, return a user
  res.json({ user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'employee' } });
});

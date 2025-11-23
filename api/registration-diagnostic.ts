import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Registration diagnostic endpoint
 * Tests Firebase Auth connectivity and configuration
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {},
  };

  // Check Firebase configuration
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Missing',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✓ Set' : '✗ Missing',
    appId: process.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing',
  };

  diagnostics.checks.firebaseConfig = firebaseConfig;

  // Check CORS configuration
  diagnostics.checks.cors = {
    allowedOrigin: process.env.ALLOWED_ORIGIN || 'https://estatracker.com',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  };

  // Check if running on Vercel
  diagnostics.checks.platform = {
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV || 'not on Vercel',
    vercelUrl: process.env.VERCEL_URL || 'not available',
  };

  // Check Edge Config
  diagnostics.checks.edgeConfig = {
    configured: !!process.env.EDGE_CONFIG,
    connectionString: process.env.EDGE_CONFIG ? 'Set (hidden)' : 'Not set',
  };

  // Determine overall health
  const criticalConfigMissing = 
    !process.env.VITE_FIREBASE_API_KEY ||
    !process.env.VITE_FIREBASE_AUTH_DOMAIN ||
    !process.env.VITE_FIREBASE_PROJECT_ID;

  diagnostics.healthy = !criticalConfigMissing;
  diagnostics.issues = [];

  if (criticalConfigMissing) {
    diagnostics.issues.push('Critical Firebase configuration missing');
  }

  if (!process.env.EDGE_CONFIG) {
    diagnostics.issues.push('Edge Config not configured (optional feature)');
  }

  return res.status(diagnostics.healthy ? 200 : 503).json(diagnostics);
}

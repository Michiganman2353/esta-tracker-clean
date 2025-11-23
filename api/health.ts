import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health check endpoint for registration system
 * Tests all critical dependencies and returns detailed status
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};
  let allHealthy = true;

  // Check 1: Environment Variables
  try {
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'FIREBASE_PROJECT_ID', // Backend/API server-side use only
    ];

    const missing = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missing.length > 0) {
      checks.environment = {
        status: 'error',
        message: `Missing environment variables: ${missing.join(', ')}`,
      };
      allHealthy = false;
    } else {
      checks.environment = { status: 'ok' };
    }
  } catch (error) {
    checks.environment = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    allHealthy = false;
  }

  // Check 2: Firebase Configuration
  try {
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    };

    if (
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId
    ) {
      checks.firebase = { status: 'ok' };
    } else {
      checks.firebase = {
        status: 'error',
        message: 'Firebase configuration incomplete',
      };
      allHealthy = false;
    }
  } catch (error) {
    checks.firebase = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    allHealthy = false;
  }

  // Check 3: Edge Config
  try {
    if (process.env.EDGE_CONFIG) {
      checks.edgeConfig = { status: 'ok' };
    } else {
      checks.edgeConfig = {
        status: 'error',
        message: 'Edge Config not configured (optional)',
      };
      // Not critical, don't mark as unhealthy
    }
  } catch (error) {
    checks.edgeConfig = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check 4: CORS Configuration
  try {
    const allowedOrigin =
      process.env.ALLOWED_ORIGIN || 'https://estatracker.com';
    checks.cors = {
      status: 'ok',
      message: `Configured for: ${allowedOrigin}`,
    };
  } catch (error) {
    checks.cors = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Return health status
  const status = allHealthy ? 200 : 503;
  
  return res.status(status).json({
    healthy: allHealthy,
    timestamp: new Date().toISOString(),
    checks,
    version: '2.0.0',
  });
}

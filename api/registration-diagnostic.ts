import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Registration diagnostic endpoint
 * Tests Firebase Auth connectivity and configuration
 *
 * This endpoint validates both frontend (VITE_) and backend (FIREBASE_) environment variables.
 * - Frontend variables (VITE_*): Required for client-side Firebase SDK initialization
 * - Backend variables (FIREBASE_*): Required for server-side Firebase Admin SDK initialization
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {},
  };

  // Check Frontend Firebase configuration (VITE_ prefixed - for client-side)
  const frontendConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
      ? '✓ Set'
      : '✗ Missing',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID
      ? '✓ Set'
      : '✗ Missing',
    appId: process.env.VITE_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing',
  };

  // Check Backend Firebase configuration (FIREBASE_ prefixed - for server-side Admin SDK)
  const backendConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID
      ? '✓ Set'
      : '✗ Missing (using VITE_FIREBASE_PROJECT_ID fallback)',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      ? '✓ Set'
      : '✗ Missing (using VITE_FIREBASE_STORAGE_BUCKET fallback)',
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT
      ? '✓ Set (hidden)'
      : '✗ Missing (using ADC)',
  };

  (diagnostics.checks as Record<string, unknown>).frontendConfig =
    frontendConfig;
  (diagnostics.checks as Record<string, unknown>).backendConfig = backendConfig;

  // Check CORS configuration
  (diagnostics.checks as Record<string, unknown>).cors = {
    allowedOrigin: process.env.ALLOWED_ORIGIN || 'https://estatracker.com',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  };

  // Check if running on Vercel
  (diagnostics.checks as Record<string, unknown>).platform = {
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV || 'not on Vercel',
    vercelUrl: process.env.VERCEL_URL || 'not available',
  };

  // Check Edge Config
  (diagnostics.checks as Record<string, unknown>).edgeConfig = {
    configured: !!process.env.EDGE_CONFIG,
    connectionString: process.env.EDGE_CONFIG ? 'Set (hidden)' : 'Not set',
  };

  // Determine overall health
  // Frontend config is critical for client-side auth flows
  const frontendConfigMissing =
    !process.env.VITE_FIREBASE_API_KEY ||
    !process.env.VITE_FIREBASE_AUTH_DOMAIN ||
    !process.env.VITE_FIREBASE_PROJECT_ID;

  // Backend config uses fallbacks, so check if at least one source is available
  const backendProjectIdAvailable =
    process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  diagnostics.healthy = !frontendConfigMissing && !!backendProjectIdAvailable;
  diagnostics.issues = [];

  if (frontendConfigMissing) {
    (diagnostics.issues as string[]).push(
      'Critical frontend Firebase configuration missing (VITE_* variables)'
    );
  }

  if (!backendProjectIdAvailable) {
    (diagnostics.issues as string[]).push(
      'Backend Firebase Project ID not available (set FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID)'
    );
  }

  if (!process.env.EDGE_CONFIG) {
    (diagnostics.issues as string[]).push(
      'Edge Config not configured (optional feature)'
    );
  }

  return res.status(diagnostics.healthy ? 200 : 503).json(diagnostics);
}

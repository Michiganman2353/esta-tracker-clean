import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Logout API Endpoint
 * POST /api/v1/auth/logout
 * 
 * Note: Actual logout is handled on the client side by Firebase Auth SDK
 * This endpoint is mainly for consistency and future extensions
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://estatracker.com',
    'https://www.estatracker.com',
  ];

  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Logout is handled client-side with Firebase Auth SDK
  // This endpoint just confirms successful logout
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

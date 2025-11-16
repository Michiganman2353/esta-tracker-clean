// pages/api/hello.js
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Lazy init Firebase Admin
const adminApp = getApps().length 
  ? getApps()[0] 
  : initializeApp({
      credential: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}'),
    });

const auth = getAuth(adminApp);
const db = getFirestore(adminApp);

// Rate limiting (in-memory – upgrade to Redis for prod)
const requests = new Map();

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  // Rate limit
  const userRequests = requests.get(ip) || { count: 0, resetTime: now };
  if (now > userRequests.resetTime) {
    userRequests.count = 1;
    userRequests.resetTime = now + windowMs;
  } else {
    userRequests.count++;
  }
  requests.set(ip, userRequests);

  if (userRequests.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
    });
  }

  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://estatracker.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // CSP
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'none'");

  try {
    // Health checks
    const timestamp = new Date().toISOString();
    const firebaseReady = !!process.env.fIREBASE_PROJECT_ID;
    const authReady = await auth.listUsers(1).then(() => true).catch(() => false);
    const dbReady = await db.listCollections().then(() => true).catch(() => false);

    // Optional: Verify token from header
    const authHeader = req.headers.authorization;
    let user = null;
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decoded = await auth.verifyIdToken(idToken);
        user = { uid: decoded.uid, email: decoded.email };
      } catch (err) {
        // Invalid token – continue as guest
      }
    }

    // Response
    res.status(200).json({
      status: 'API elite & operational',
      timestamp,
      uptime: process.uptime(),
      environment: process.env.VERCEL_ENV || 'development',
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || 'not-set',
        auth: authReady,
        firestore: dbReady,
      },
      auth: user ? { uid: user.uid, email: user.email } : 'guest',
      rateLimit: {
        remaining: maxRequests - userRequests.count,
        resetIn: Math.ceil((userRequests.resetTime - now) / 1000),
      },
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        deployment: process.env.VERCEL_URL || 'local',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}

// Config
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
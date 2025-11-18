/**
 * Vercel Edge Middleware for ESTA Tracker
 * 
 * This middleware runs on Vercel's Edge Network for minimal latency.
 * 
 * Key Responsibilities:
 * 1. Maintenance mode checks (via Edge Config)
 * 2. Security headers enforcement
 * 3. Request correlation and tracking
 * 4. Early routing optimization
 * 
 * Note: Since this is a React SPA (not Next.js), full authentication and
 * authorization is primarily handled client-side in the React application.
 * The middleware provides edge-level optimizations and maintenance mode.
 * 
 * For production-grade token verification on Edge, integrate Firebase Admin
 * SDK via Vercel Edge Functions (serverless functions with edge runtime).
 * 
 * @see https://vercel.com/docs/functions/edge-middleware
 * @see https://vercel.com/docs/storage/edge-config
 */

import { NextRequest, NextResponse } from 'next/server';

// Try to import Edge Config, fallback gracefully if not configured
let getEdgeConfig: ((key: string) => Promise<unknown>) | null = null;
try {
  // Dynamic import for Edge Config
  const edgeConfigModule = await import('@vercel/edge-config');
  getEdgeConfig = edgeConfigModule.get;
} catch (error) {
  // Edge Config not available - this is fine for development
  console.warn('Edge Config not configured:', error);
}

/**
 * Check if the application is in maintenance mode
 */
async function isMaintenanceMode(): Promise<boolean> {
  if (!getEdgeConfig) {
    return false;
  }

  try {
    const maintenanceMode = await getEdgeConfig('maintenanceMode');
    return maintenanceMode === true;
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    return false;
  }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|json|woff|woff2|ttf|eot|map)$/)
  ) {
    return NextResponse.next();
  }

  // Check maintenance mode
  const inMaintenanceMode = await isMaintenanceMode();
  
  if (inMaintenanceMode) {
    // Allow the maintenance page itself to load
    if (pathname === '/maintenance') {
      return NextResponse.next();
    }
    
    // For a SPA, rewrite to index.html and add a header
    // The React app will detect this header and show maintenance page
    const response = NextResponse.rewrite(new URL('/index.html', request.url));
    response.headers.set('X-Maintenance-Mode', 'true');
    response.headers.set('X-Maintenance-Message', 'System under maintenance');
    return response;
  }

  // Add security and tracking headers
  const response = NextResponse.next();
  
  // Correlation ID for request tracking and debugging
  const correlationId = crypto.randomUUID();
  response.headers.set('X-Correlation-ID', correlationId);
  
  // Edge timestamp for performance monitoring
  response.headers.set('X-Edge-Time', new Date().toISOString());
  
  // Additional security headers (supplementing vercel.json)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

/**
 * Middleware configuration
 * Define which routes should be processed by this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - API routes (if any)
     * - Static files
     * - Build artifacts
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

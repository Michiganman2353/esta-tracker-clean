import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter - 100 requests per 15 minutes
 * Protects against basic DoS attacks
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks and static assets
  skip: (req) => {
    return req.path === '/health' || req.path.startsWith('/public/');
  },
});

/**
 * Strict rate limiter for authentication endpoints - 5 requests per 15 minutes
 * Protects against brute force attacks on login/signup
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message:
    'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  // Disable express-rate-limit's built-in validation for the custom keyGenerator.
  // The library throws ERR_ERL_KEY_GEN_IPV6 warning when using custom keyGenerator with req.ip
  // because IPv6 addresses may not be normalized consistently. Our implementation handles this
  // by preferring email/username identifiers and falling back to 'unknown' when IP is undefined.
  // See: https://express-rate-limit.github.io/ERR_ERL_KEY_GEN_IPV6/
  validate: false,
  keyGenerator: (req) => {
    // Try to use email/username from body if available, otherwise use IP
    const identifier = req.body?.email || req.body?.username || req.ip;
    return identifier || 'unknown';
  },
});

/**
 * Moderate rate limiter for sensitive operations - 20 requests per 15 minutes
 * For operations like password reset, profile updates, etc.
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many requests for this operation, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter - 10 uploads per hour
 * Protects against abuse of file upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: 'Upload limit exceeded, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Export rate limiter - 3 exports per hour
 * CSV/PDF exports can be resource intensive
 */
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 exports per hour
  message: 'Export limit exceeded, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// src/constants/routes.js

/**
 * Route constants for the application.
 * Usage: Import and use directly in Router/Link.
 * Type-safe for TypeScript. Extensible for guards/lazy loading.
 * @type {Object}
 */
export const ROUTES = {
  /** Landing page – public, no auth required */
  LANDING: '/',
  /** Sign up page – public */
  SIGN_UP: '/signup',
  /** Sign in page – public */
  SIGN_IN: '/signin',
  /** Home page – protected (auth required) */
  HOME: '/home',
  /** Account page – protected */
  ACCOUNT: '/account',
  /** Password forget page – public */
  PASSWORD_FORGET: '/pw-forget',
  /** Admin page – protected (admin role) */
  ADMIN: '/admin',
  /** Admin user details – protected, dynamic param :id */
  ADMIN_DETAILS: '/admin/:id',
} as const;

/**
 * Type-safe route enum for TypeScript.
 * @enum {keyof typeof ROUTES}
 */
export type RouteKey = keyof typeof ROUTES;

/**
 * Route metadata for guards/lazy loading.
 * Extend with { authRequired: true, roles: ['ADMIN'], lazy: () => import('./Component') }
 * @type {Object<RouteKey, Object>}
 */
export const ROUTE_METADATA = {
  LANDING: { authRequired: false, roles: [] },
  SIGN_UP: { authRequired: false, roles: [] },
  SIGN_IN: { authRequired: false, roles: [] },
  HOME: { authRequired: true, roles: [] },
  ACCOUNT: { authRequired: true, roles: [] },
  PASSWORD_FORGET: { authRequired: false, roles: [] },
  ADMIN: { authRequired: true, roles: ['ADMIN'] },
  ADMIN_DETAILS: { authRequired: true, roles: ['ADMIN'] },
} as const;

/**
 * Validate if route requires auth.
 * @param {RouteKey} route - Route key
 * @returns {boolean} True if auth required
 */
export const requiresAuth = (route) => ROUTE_METADATA[route].authRequired;

/**
 * Validate if route requires specific role.
 * @param {RouteKey} route - Route key
 * @param {string[]} userRoles - User's roles
 * @returns {boolean} True if authorized
 */
export const hasRoutePermission = (route, userRoles) => {
  const requiredRoles = ROUTE_METADATA[route].roles;
  return requiredRoles.length === 0 || requiredRoles.some(role => userRoles.includes(role));
};
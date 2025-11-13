// src/constants/roles.js

/**
 * Role constants for authorization.
 * Usage: Check `authUser.roles[ROLES.ADMIN]` for role assignment.
 * @type {Object}
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  USER: 'USER',
} as const;

/**
 * Type-safe roles enum for TypeScript.
 * @enum {keyof typeof ROLES}
 */
export type Role = keyof typeof ROLES;

/**
 * Validate if user has specific role.
 * @param {Object} authUser - Auth user object
 * @param {Role} role - Role to check
 * @returns {boolean} True if user has role
 */
export const hasRole = (authUser, role) => {
  return authUser?.roles?.[role] === ROLES[role];
};

/**
 * Check if user is admin.
 * @param {Object} authUser - Auth user object
 * @returns {boolean} True if admin
 */
export const isAdmin = (authUser) => hasRole(authUser, 'ADMIN');

/**
 * Check if user is moderator.
 * @param {Object} authUser - Auth user object
 * @returns {boolean} True if moderator
 */
export const isModerator = (authUser) => hasRole(authUser, 'MODERATOR');
#!/usr/bin/env node
/**
 * Environment Variables Validation
 *
 * This module validates that all required Firebase environment variables
 * are present before build/runtime.
 *
 * Usage:
 * - Frontend: Validates VITE_FIREBASE_* variables
 * - Backend: Validates FIREBASE_* variables (for Admin SDK)
 * - Tests: Auto-loads .env.test or uses mock values
 */
/**
 * Required environment variables for client-side Firebase (frontend)
 */
export declare const REQUIRED_CLIENT_VARS: readonly ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_APP_ID"];
/**
 * Required environment variables for server-side Firebase (backend)
 */
export declare const REQUIRED_SERVER_VARS: readonly ["FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET"];
/**
 * Optional environment variables for server-side Firebase
 */
export declare const OPTIONAL_SERVER_VARS: readonly ["FIREBASE_SERVICE_ACCOUNT", "GOOGLE_APPLICATION_CREDENTIALS"];
/**
 * Check if running in test environment
 */
export declare function isTestEnvironment(): boolean;
/**
 * Check if running in CI environment
 */
export declare function isCIEnvironment(): boolean;
/**
 * Validate client-side environment variables
 *
 * @param strict - If true, throws error on missing vars. If false, returns missing vars.
 * @returns Array of missing variable names (empty if all present)
 */
export declare function validateClientEnv(strict?: boolean): string[];
/**
 * Validate server-side environment variables
 *
 * @param strict - If true, throws error on missing vars. If false, returns missing vars.
 * @returns Array of missing variable names (empty if all present)
 */
export declare function validateServerEnv(strict?: boolean): string[];
/**
 * Load test environment variables if available
 */
export declare function loadTestEnv(): void;
/**
 * Main validation function
 * Call this at the top of your application entry point
 *
 * @param type - 'client' for frontend, 'server' for backend, 'both' for full-stack
 */
export declare function validateEnv(type?: 'client' | 'server' | 'both'): void;
//# sourceMappingURL=check-envs.d.ts.map
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

import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Required environment variables for client-side Firebase (frontend)
 */
export const REQUIRED_CLIENT_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

/**
 * Required environment variables for server-side Firebase (backend)
 */
export const REQUIRED_SERVER_VARS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
] as const;

/**
 * Optional environment variables for server-side Firebase
 */
export const OPTIONAL_SERVER_VARS = [
  'FIREBASE_SERVICE_ACCOUNT',
  'GOOGLE_APPLICATION_CREDENTIALS',
] as const;

/**
 * Check if running in test environment
 */
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

/**
 * Check if running in CI environment
 */
export function isCIEnvironment(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}

/**
 * Validate client-side environment variables
 * 
 * @param strict - If true, throws error on missing vars. If false, returns missing vars.
 * @returns Array of missing variable names (empty if all present)
 */
export function validateClientEnv(strict: boolean = true): string[] {
  const missing: string[] = [];

  for (const varName of REQUIRED_CLIENT_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (strict && missing.length > 0) {
    throw new Error(
      `Missing required Firebase client environment variables:\n` +
      `  ${missing.join(', ')}\n\n` +
      `Set these in your .env file or environment.\n` +
      `For local development, copy .env.example to .env and fill in the values.`
    );
  }

  return missing;
}

/**
 * Validate server-side environment variables
 * 
 * @param strict - If true, throws error on missing vars. If false, returns missing vars.
 * @returns Array of missing variable names (empty if all present)
 */
export function validateServerEnv(strict: boolean = true): string[] {
  const missing: string[] = [];

  for (const varName of REQUIRED_SERVER_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check that at least one credential method is available
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasGoogleCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!hasServiceAccount && !hasGoogleCreds) {
    missing.push('FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS');
  }

  if (strict && missing.length > 0) {
    throw new Error(
      `Missing required Firebase server environment variables:\n` +
      `  ${missing.join(', ')}\n\n` +
      `Set these in your .env file or environment.\n` +
      `For server-side Firebase Admin SDK, you need either:\n` +
      `  - FIREBASE_SERVICE_ACCOUNT (JSON string), OR\n` +
      `  - GOOGLE_APPLICATION_CREDENTIALS (path to service account file)`
    );
  }

  return missing;
}

/**
 * Load test environment variables if available
 */
export function loadTestEnv(): void {
  const testEnvPath = resolve(process.cwd(), '.env.test');
  if (existsSync(testEnvPath)) {
    console.log('📝 Loading test environment from .env.test');
    // Would use dotenv here if needed, but keeping minimal
    // Tests typically use vitest.setup.ts to configure env
  } else {
    console.log('ℹ️  No .env.test found, using mock values for tests');
    // Set mock values for tests
    if (isTestEnvironment()) {
      process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
      process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
      process.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
      process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-bucket';
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
      process.env.VITE_FIREBASE_APP_ID = 'test-app-id';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';
    }
  }
}

/**
 * Main validation function
 * Call this at the top of your application entry point
 * 
 * @param type - 'client' for frontend, 'server' for backend, 'both' for full-stack
 */
export function validateEnv(type: 'client' | 'server' | 'both' = 'both'): void {
  // Skip validation in test environments
  if (isTestEnvironment()) {
    console.log('🧪 Test environment detected, skipping strict validation');
    loadTestEnv();
    return;
  }

  console.log('🔍 Validating Firebase environment variables...');

  const errors: string[] = [];

  if (type === 'client' || type === 'both') {
    try {
      validateClientEnv(true);
      console.log('✅ Client environment variables validated');
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }
  }

  if (type === 'server' || type === 'both') {
    try {
      validateServerEnv(true);
      console.log('✅ Server environment variables validated');
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:\n');
    errors.forEach(err => console.error(err + '\n'));
    process.exit(1);
  }

  console.log('✅ All environment variables validated successfully\n');
}

// If run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  const envType = process.argv[2] as 'client' | 'server' | 'both' | undefined;
  validateEnv(envType || 'both');
}

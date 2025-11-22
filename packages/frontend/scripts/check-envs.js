#!/usr/bin/env node

/**
 * Frontend Environment Check Script
 * 
 * This script validates required environment variables before build.
 * It ensures Firebase configuration and other necessary variables are set.
 */

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const optionalEnvVars = [
  'VITE_FIREBASE_MEASUREMENT_ID',
  'EDGE_CONFIG',
  'VITE_API_URL',
];

let hasErrors = false;

console.log('🔍 Frontend Environment Check\n');

// Check required environment variables
console.log('Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === '') {
    console.error(`❌ MISSING: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}`);
  }
});

// Check optional environment variables (warnings only)
console.log('\nOptional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === '') {
    console.warn(`⚠️  NOT SET: ${varName} (optional)`);
  } else {
    console.log(`✅ ${varName}`);
  }
});

// Exit with error if required variables are missing
if (hasErrors) {
  console.error('\n❌ Build cannot proceed: Required environment variables are missing');
  console.error('💡 Please set the missing variables in your .env.local file or environment');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set\n');
process.exit(0);

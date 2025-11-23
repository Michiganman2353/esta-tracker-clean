// Node 22 compatible - CommonJS
// Usage: node ./scripts/check-envs.js
const fs = require('fs');
const path = require('path');

// Load local .env for dev if present (do not run in CI if you don't want)
try {
  const dotenvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    // eslint-disable-next-line import/no-dynamic-require
    require('dotenv').config({ path: dotenvPath });
  }
} catch (err) {
  // ignore errors loading .env
}

// VITE_ prefix is the only supported prefix for frontend Firebase configuration
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missing = [];
const present = [];

for (const varName of requiredVars) {
  if (typeof process.env[varName] === 'string' && process.env[varName].length > 0) {
    present.push(varName);
  } else {
    missing.push(varName);
  }
}

if (missing.length > 0) {
  console.error('');
  console.error('ERROR: Missing required Firebase environment variables:');
  console.error(`  Required: ${requiredVars.join(', ')}`);
  console.error('');
  console.error(`Currently missing: ${missing.join(', ')}`);
  console.error('');
  console.error('Set these in your environment, in Vercel project settings, or as GitHub Actions secrets.');
  console.error('For local development, create a .env with the VITE_ prefixed keys.');
  console.error('');
  console.error('⚠️  NOTE: REACT_APP_* and unprefixed FIREBASE_* variables are NO LONGER SUPPORTED.');
  console.error('    The monorepo exclusively uses VITE_* prefix for all frontend environment variables.');
  process.exit(1);
}

console.log('✅ Firebase environment variables check passed. Found the following keys:');
console.log(present.join(', '));
process.exit(0);

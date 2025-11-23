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

const pairs = [
  ['VITE_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_API_KEY', 'FIREBASE_API_KEY'],
  ['VITE_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN'],
  ['VITE_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID'],
  ['VITE_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET'],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID'],
  ['VITE_FIREBASE_APP_ID', 'REACT_APP_FIREBASE_APP_ID', 'FIREBASE_APP_ID']
];

const missing = [];
const present = [];

for (const names of pairs) {
  const found = names.find(n => typeof process.env[n] === 'string' && process.env[n].length > 0);
  if (found) {
    present.push(found);
  } else {
    missing.push(names);
  }
}

if (missing.length > 0) {
  const missingList = missing.map(group => `(${group.join(' or ')})`).join(', ');
  console.error('');
  console.error('ERROR: Missing required Firebase environment variables:');
  console.error(`  Required (per item): ${pairs.map(g => `(${g.join(' or ')})`).join(', ')}`);
  console.error('');
  console.error(`Currently missing: ${missingList}`);
  console.error('');
  console.error('Set these in your environment, in Vercel project settings, or as GitHub Actions secrets.');
  console.error('For local development, create a .env with the VITE_ or REACT_APP_ prefixed keys.');
  process.exit(1);
}

console.log('✅ Firebase environment variables check passed. Found the following keys:');
console.log(present.join(', '));
process.exit(0);

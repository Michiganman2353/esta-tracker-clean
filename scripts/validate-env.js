#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * This script checks that all required environment variables are present
 * and provides helpful error messages if any are missing.
 * 
 * Usage:
 *   node scripts/validate-env.js
 */

const requiredEnvVars = {
  frontend: [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ],
  optional: [
    'VITE_FIREBASE_MEASUREMENT_ID',
    'EDGE_CONFIG',
    'VITE_API_URL',
  ],
  production: [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_SERVICE_ACCOUNT',
  ],
};

let hasErrors = false;
let hasWarnings = false;

console.log('🔍 ESTA Tracker Environment Validation\n');
console.log('='.repeat(50));

// Check Node version
const nodeVersion = process.version;
const requiredNodeVersion = '18.0.0';
console.log(`\n📦 Node.js Version: ${nodeVersion}`);
if (nodeVersion.replace('v', '').split('.')[0] < requiredNodeVersion.split('.')[0]) {
  console.error(`❌ ERROR: Node.js ${requiredNodeVersion} or higher is required`);
  hasErrors = true;
} else {
  console.log('✅ Node.js version is compatible');
}

// Check npm version
try {
  const { execSync } = require('child_process');
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  console.log(`📦 npm Version: ${npmVersion}`);
  console.log('✅ npm is available');
} catch (error) {
  console.error('❌ ERROR: npm is not available');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));
console.log('\n🔑 Required Frontend Environment Variables:\n');

requiredEnvVars.frontend.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === '') {
    console.error(`❌ MISSING: ${varName}`);
    hasErrors = true;
  } else {
    // Show partial value for security
    const displayValue = value.length > 20 
      ? value.substring(0, 10) + '...' + value.substring(value.length - 5)
      : value.substring(0, 5) + '...';
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('\n⚠️  Optional Environment Variables:\n');

requiredEnvVars.optional.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === '') {
    console.warn(`⚠️  NOT SET: ${varName} (optional, but recommended)`);
    hasWarnings = true;
  } else {
    const displayValue = value.length > 20 
      ? value.substring(0, 10) + '...' + value.substring(value.length - 5)
      : value.substring(0, 5) + '...';
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

// Check for production environment
if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
  console.log('\n' + '='.repeat(50));
  console.log('\n🏭 Production Environment Variables:\n');
  
  requiredEnvVars.production.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === '') {
      console.error(`❌ MISSING: ${varName}`);
      hasErrors = true;
    } else {
      const displayValue = varName.includes('SERVICE_ACCOUNT') 
        ? '[SERVICE_ACCOUNT_JSON]'
        : value.substring(0, 10) + '...';
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  });
}

// Check for .env.local file in development
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  const fs = require('fs');
  const path = require('path');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📄 Development Environment Files:\n');
  
  if (fs.existsSync(envLocalPath)) {
    console.log('✅ .env.local file found');
  } else {
    console.warn('⚠️  .env.local file not found');
    console.warn('   Copy .env.example to .env.local and configure your values');
    hasWarnings = true;
  }
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (fs.existsSync(envExamplePath)) {
    console.log('✅ .env.example file found');
  } else {
    console.error('❌ .env.example file not found');
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Validation Summary:\n');

if (hasErrors) {
  console.error('❌ Validation FAILED - Critical environment variables are missing');
  console.error('\n💡 To fix:');
  console.error('   1. Copy .env.example to .env.local');
  console.error('   2. Fill in all required values');
  console.error('   3. For production, set environment variables in Vercel Dashboard');
  console.error('   4. See docs/DEPLOYMENT_TROUBLESHOOTING.md for details\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  Validation PASSED with warnings');
  console.warn('   Some optional variables are not set');
  console.warn('   The app will work but some features may be limited\n');
  process.exit(0);
} else {
  console.log('✅ All validation checks PASSED');
  console.log('   Your environment is properly configured\n');
  process.exit(0);
}

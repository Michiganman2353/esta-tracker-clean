#!/usr/bin/env node

/**
 * Frontend Environment Check Script
 * 
 * This script validates REQUIRED environment variables before build.
 * It ensures Firebase configuration is properly set.
 * 
 * IMPORTANT: This script ONLY uses static configuration.
 * It does NOT use dynamic require() calls or load files based on env var values.
 * All environment variables are explicitly required - no optional variables.
 * 
 * If any required variable is missing, the build fails immediately with
 * a clear, fatal error message indicating which variable is missing.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load environment variables from .env files
 * Loads in order: .env, .env.local (local overrides default)
 * This mimics Vite's behavior for environment variable loading
 */
function loadEnvFiles() {
  // Find repository root by looking for package.json with workspaces
  let rootDir = __dirname;
  while (rootDir !== '/' && rootDir !== '.') {
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        // Check if this is the monorepo root (has workspaces)
        if (packageJson.workspaces) {
          break;
        }
      } catch (e) {
        // Invalid package.json, continue searching
      }
    }
    rootDir = path.dirname(rootDir);
  }
  
  const envFiles = [
    path.join(rootDir, '.env'),
    path.join(rootDir, '.env.local'),
  ];
  
  envFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      content.split('\n').forEach(line => {
        // Skip comments and empty lines
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        
        // Parse KEY=VALUE format
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Only set if not already in process.env (allow override from actual env vars)
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  });
}

// Load environment variables from .env files
loadEnvFiles();

/**
 * Required Firebase environment variable keys.
 * These can be provided with either REACT_APP_ or VITE_ prefix.
 * The script checks for both prefixes to support different deployment environments.
 * 
 * Note: MEASUREMENT_ID is intentionally NOT included.
 * It is used for Firebase Analytics (Google Analytics) which is optional.
 * The app functions correctly without it - analytics just won't be tracked.
 */
const REQUIRED_FIREBASE_KEYS = [
  'API_KEY',
  'AUTH_DOMAIN',
  'PROJECT_ID',
  'STORAGE_BUCKET',
  'MESSAGING_SENDER_ID',
  'APP_ID',
];

/**
 * Build the list of environment variable names to check.
 * Supports both REACT_APP_ and VITE_ prefixes.
 */
const VITE_ENV_VARS = REQUIRED_FIREBASE_KEYS.map(key => `VITE_FIREBASE_${key}`);
const REACT_APP_ENV_VARS = REQUIRED_FIREBASE_KEYS.map(key => `REACT_APP_FIREBASE_${key}`);

/**
 * Validate that all required environment variables are set.
 * Checks for either REACT_APP_ or VITE_ prefix for each Firebase config key.
 * @returns {Object} { isValid: boolean, missingVars: string[], foundPrefix: string }
 */
function validateEnvironmentVariables() {
  const missingVars = [];
  let foundPrefix = null;
  
  // First, determine which prefix is being used
  const hasVite = VITE_ENV_VARS.some(varName => process.env[varName]);
  const hasReactApp = REACT_APP_ENV_VARS.some(varName => process.env[varName]);
  
  if (hasVite && hasReactApp) {
    // Both prefixes found - use VITE_ as primary, but log this for transparency
    console.log('ℹ️  Note: Found both VITE_ and REACT_APP_ prefixed variables');
    console.log('   Using VITE_ prefix as primary (standard for Vite builds)');
    foundPrefix = 'VITE_';
  } else if (hasVite) {
    foundPrefix = 'VITE_';
  } else if (hasReactApp) {
    foundPrefix = 'REACT_APP_';
  } else {
    // No variables found with either prefix
    foundPrefix = 'VITE_'; // default for error reporting
  }
  
  // Check for required variables with the appropriate prefix
  const varsToCheck = foundPrefix === 'REACT_APP_' ? REACT_APP_ENV_VARS : VITE_ENV_VARS;
  
  for (const varName of varsToCheck) {
    const value = process.env[varName];
    
    // Check if variable is missing or empty
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars,
    foundPrefix
  };
}

/**
 * Print fatal error message and exit.
 * @param {string[]} missingVars - Array of missing variable names
 * 
 * Note: Uses process.exit(1) directly because this is a prebuild validation script
 * that must halt the build process immediately if required variables are missing.
 * This prevents builds from proceeding with invalid configuration.
 */
function exitWithError(missingVars) {
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ FATAL ERROR: Required Environment Variables Missing');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.error('The following REQUIRED environment variables are not set:\n');
  
  missingVars.forEach((varName, index) => {
    console.error(`  ${index + 1}. ${varName}`);
  });
  
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📋 HOW TO FIX:');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.error('For local development:');
  console.error('  1. Copy .env.example to .env.local in the repository root');
  console.error('  2. Fill in the missing Firebase configuration values');
  console.error('  3. Run the build again\n');
  
  console.error('For Vercel deployment:');
  console.error('  1. Go to Vercel Dashboard → Project Settings → Environment Variables');
  console.error('  2. Add each missing variable with its correct value');
  console.error('  3. Redeploy the project\n');
  
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Exit with error code 1 to fail the build
  process.exit(1);
}

/**
 * Main execution
 */
function main() {
  console.log('\n🔍 Validating Frontend Environment Variables...\n');
  
  const { isValid, missingVars, foundPrefix } = validateEnvironmentVariables();
  
  if (!isValid) {
    // Fatal error - missing required variables
    exitWithError(missingVars);
  }
  
  // Success - all required variables are set
  console.log('✅ All required environment variables are properly set');
  console.log(`✅ Using ${foundPrefix}FIREBASE_* prefix`);
  console.log(`✅ Validated ${REQUIRED_FIREBASE_KEYS.length} environment variables\n`);
  
  // List validated variables for transparency
  console.log('Validated variables:');
  const varsToCheck = foundPrefix === 'REACT_APP_' ? REACT_APP_ENV_VARS : VITE_ENV_VARS;
  varsToCheck.forEach((varName) => {
    console.log(`  ✓ ${varName}`);
  });
  
  console.log('\n✅ Environment check passed - proceeding with build\n');
  
  // Exit successfully
  process.exit(0);
}

// Execute the script
main();

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

/**
 * Strict list of required environment variables.
 * ALL of these MUST be set for the build to proceed.
 * There are NO optional environment variables.
 * 
 * Note: VITE_FIREBASE_MEASUREMENT_ID is intentionally NOT included.
 * It is used for Firebase Analytics (Google Analytics) which is optional.
 * The app functions correctly without it - analytics just won't be tracked.
 * Per the requirements, ALL variables must be explicitly required with no optionals.
 */
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

/**
 * Validate that all required environment variables are set.
 * @returns {Object} { isValid: boolean, missingVars: string[] }
 */
function validateEnvironmentVariables() {
  const missingVars = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    
    // Check if variable is missing or empty
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

/**
 * Print fatal error message and exit.
 * @param {string[]} missingVars - Array of missing variable names
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
  
  const { isValid, missingVars } = validateEnvironmentVariables();
  
  if (!isValid) {
    // Fatal error - missing required variables
    exitWithError(missingVars);
  }
  
  // Success - all required variables are set
  console.log('✅ All required environment variables are properly set');
  console.log(`✅ Validated ${REQUIRED_ENV_VARS.length} environment variables\n`);
  
  // List validated variables for transparency
  console.log('Validated variables:');
  REQUIRED_ENV_VARS.forEach((varName) => {
    console.log(`  ✓ ${varName}`);
  });
  
  console.log('\n✅ Environment check passed - proceeding with build\n');
  
  // Exit successfully
  process.exit(0);
}

// Execute the script
main();

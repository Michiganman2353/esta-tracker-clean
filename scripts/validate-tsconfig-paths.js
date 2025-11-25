#!/usr/bin/env node
/**
 * Validates that all tsconfig path aliases point to valid directories.
 * This helps catch build issues early before deployment.
 */

const fs = require('fs');
const path = require('path');

const TSCONFIG_PATH = path.join(__dirname, '..', 'tsconfig.base.json');

function stripJsonComments(jsonString) {
  // Remove single-line comments (// ...)
  let result = jsonString.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments (/* ... */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

function validateTsconfigPaths() {
  console.log('🔍 Validating tsconfig path aliases...\n');

  if (!fs.existsSync(TSCONFIG_PATH)) {
    console.error('❌ tsconfig.base.json not found');
    process.exit(1);
  }

  let config;
  try {
    const rawContent = fs.readFileSync(TSCONFIG_PATH, 'utf-8');
    const cleanedContent = stripJsonComments(rawContent);
    config = JSON.parse(cleanedContent);
  } catch (err) {
    console.error('❌ Failed to parse tsconfig.base.json:', err.message);
    process.exit(1);
  }

  const paths = config.compilerOptions?.paths || {};
  const baseUrl = config.compilerOptions?.baseUrl || '.';
  const rootDir = path.dirname(TSCONFIG_PATH);

  let hasErrors = false;
  const validatedPaths = [];
  const missingPaths = [];

  for (const [alias, targets] of Object.entries(paths)) {
    for (const target of targets) {
      // Skip wildcard paths - just validate the base directory
      const cleanTarget = target.replace(/\/\*$/, '');
      const fullPath = path.resolve(rootDir, baseUrl, cleanTarget);

      // For dist directories, check if the source exists instead
      // since dist might not exist before build
      const sourcePath = fullPath.replace('/dist', '/src');

      if (fs.existsSync(fullPath)) {
        validatedPaths.push({ alias, target, status: 'exists' });
      } else if (fs.existsSync(sourcePath)) {
        validatedPaths.push({ alias, target, status: 'source-exists' });
      } else {
        missingPaths.push({ alias, target, fullPath });
        hasErrors = true;
      }
    }
  }

  console.log('✅ Valid path aliases:');
  for (const { alias, target, status } of validatedPaths) {
    const statusNote =
      status === 'source-exists' ? ' (source exists, build required)' : '';
    console.log(`   ${alias} → ${target}${statusNote}`);
  }

  if (missingPaths.length > 0) {
    console.log('\n❌ Missing path targets:');
    for (const { alias, target, fullPath } of missingPaths) {
      console.log(`   ${alias} → ${target}`);
      console.log(`      Expected at: ${fullPath}`);
    }
  }

  if (hasErrors) {
    console.log('\n⚠️  Some path aliases point to missing directories.');
    console.log(
      '   This may cause build failures. Run "npm run build:libs" to generate dist folders.'
    );
    console.log('   Use --strict flag to fail on missing paths.\n');
    // Exit with warning code (0) by default, but allow strict mode via flag
    const strictMode = process.argv.includes('--strict');
    process.exit(strictMode ? 1 : 0);
  }

  console.log('\n✅ All tsconfig path aliases validated successfully!\n');
  process.exit(0);
}

validateTsconfigPaths();

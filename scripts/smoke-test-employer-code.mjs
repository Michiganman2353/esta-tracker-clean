#!/usr/bin/env node
/**
 * Smoke Test: Employer Code Generation
 * 
 * Verifies that employer code generation logic works correctly.
 * This is a fast, dependency-free test that can run in CI without Firebase.
 * 
 * NOTE: This test requires the shared-types package to be built first.
 * Run `npm run build` or `npx nx build shared-types` before running this test.
 */

import { generateRandomEmployerCode, isValidEmployerCode, EMPLOYER_CODE_MIN, EMPLOYER_CODE_MAX } from '../packages/shared-types/dist/employer-profile.js';

let exitCode = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    exitCode = 1;
  }
}

// Test 1: Code generation produces 4-digit codes
test('Generate 4-digit code', () => {
  const code = generateRandomEmployerCode();
  if (!/^\d{4}$/.test(code)) {
    throw new Error(`Code ${code} is not 4 digits`);
  }
});

// Test 2: Codes are in valid range
test('Codes are in valid range (1000-9999)', () => {
  for (let i = 0; i < 20; i++) {
    const code = generateRandomEmployerCode();
    const num = parseInt(code, 10);
    if (num < EMPLOYER_CODE_MIN || num > EMPLOYER_CODE_MAX) {
      throw new Error(`Code ${code} is outside valid range`);
    }
  }
});

// Test 3: Validation accepts valid codes
test('Validation accepts valid codes', () => {
  const validCodes = ['1000', '5432', '9999'];
  for (const code of validCodes) {
    if (!isValidEmployerCode(code)) {
      throw new Error(`Valid code ${code} rejected`);
    }
  }
});

// Test 4: Validation rejects invalid codes
test('Validation rejects invalid codes', () => {
  const invalidCodes = ['999', '10000', 'abcd', '12.4', ''];
  for (const code of invalidCodes) {
    if (isValidEmployerCode(code)) {
      throw new Error(`Invalid code ${code} accepted`);
    }
  }
});

// Test 5: Codes have sufficient randomness
test('Codes have sufficient randomness', () => {
  const codes = new Set();
  for (let i = 0; i < 30; i++) {
    codes.add(generateRandomEmployerCode());
  }
  // With 30 attempts, we should get at least 28 unique codes
  if (codes.size < 28) {
    throw new Error(`Insufficient randomness: only ${codes.size}/30 unique codes`);
  }
});

if (exitCode === 0) {
  console.log('\n✅ All smoke tests passed!');
} else {
  console.log('\n❌ Some smoke tests failed');
}

process.exit(exitCode);

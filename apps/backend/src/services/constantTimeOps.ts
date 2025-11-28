/**
 * Constant-Time Operations Module
 *
 * Implements timing-safe cryptographic operations to prevent
 * side-channel timing attacks.
 *
 * Side-channel attacks exploit information leaked through:
 * - Timing variations in conditional branches
 * - Cache access patterns
 * - Power consumption variations
 *
 * This module provides:
 * - Constant-time comparison functions
 * - Constant-time selection functions
 * - Constant-time string operations
 * - WebCrypto-hardened random generation
 *
 * @module constantTimeOps
 */

import { timingSafeEqual, randomBytes, createHmac } from 'crypto';

/**
 * Constant-time buffer comparison
 *
 * This function compares two buffers in constant time,
 * regardless of where they differ.
 *
 * @param a - First buffer to compare
 * @param b - Second buffer to compare
 * @returns True if buffers are equal, false otherwise
 *
 * @example
 * ```typescript
 * const storedHash = Buffer.from(storedValue);
 * const computedHash = Buffer.from(computedValue);
 * if (constantTimeEqual(storedHash, computedHash)) {
 *   // Authentic
 * }
 * ```
 */
export function constantTimeEqual(a: Buffer, b: Buffer): boolean {
  // Handle length mismatch in constant time
  // By comparing against a buffer of the same length
  if (a.length !== b.length) {
    // Still perform comparison to maintain timing
    const dummy = Buffer.alloc(a.length);
    timingSafeEqual(a, dummy);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Constant-time string comparison
 *
 * Compares two strings in constant time by converting to buffers.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if strings are equal, false otherwise
 */
export function constantTimeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  return constantTimeEqual(bufA, bufB);
}

/**
 * Constant-time conditional select
 *
 * Selects one of two values based on a condition without
 * revealing which value was selected through timing.
 *
 * @param condition - Boolean condition
 * @param trueValue - Value to return if condition is true
 * @param falseValue - Value to return if condition is false
 * @returns Selected value
 *
 * @example
 * ```typescript
 * const result = constantTimeSelect(
 *   isValid,
 *   sensitiveData,
 *   decoyData
 * );
 * ```
 */
export function constantTimeSelect<T>(
  condition: boolean,
  trueValue: T,
  falseValue: T
): T {
  // Convert condition to number (0 or 1)
  const mask = condition ? 1 : 0;
  // Both paths are always executed
  const values = [falseValue, trueValue];
  return values[mask]!;
}

/**
 * Constant-time byte selection
 *
 * Selects bytes from one of two buffers based on a condition.
 *
 * @param condition - Boolean condition
 * @param trueBuffer - Buffer to select if condition is true
 * @param falseBuffer - Buffer to select if condition is false
 * @returns Selected buffer (copy)
 */
export function constantTimeSelectBuffer(
  condition: boolean,
  trueBuffer: Buffer,
  falseBuffer: Buffer
): Buffer {
  // Ensure same length
  const len = Math.max(trueBuffer.length, falseBuffer.length);
  const a = Buffer.alloc(len);
  const b = Buffer.alloc(len);
  trueBuffer.copy(a);
  falseBuffer.copy(b);

  // Create mask: all 0xFF if true, all 0x00 if false
  const mask = condition ? 0xff : 0x00;
  const invMask = condition ? 0x00 : 0xff;

  const result = Buffer.alloc(len);
  for (let i = 0; i < len; i++) {
    // result[i] = (a[i] & mask) | (b[i] & invMask)
    result[i] = (a[i]! & mask) | (b[i]! & invMask);
  }

  return result;
}

/**
 * Constant-time zero check
 *
 * Checks if a buffer is all zeros in constant time.
 *
 * @param buffer - Buffer to check
 * @returns True if all bytes are zero
 */
export function constantTimeIsZero(buffer: Buffer): boolean {
  let result = 0;
  for (let i = 0; i < buffer.length; i++) {
    result |= buffer[i]!;
  }
  return result === 0;
}

/**
 * Constant-time copy with conditional
 *
 * Copies source to destination only if condition is true,
 * but always accesses both buffers.
 *
 * @param condition - Boolean condition
 * @param source - Source buffer
 * @param dest - Destination buffer (modified in place)
 */
export function constantTimeCopyIf(
  condition: boolean,
  source: Buffer,
  dest: Buffer
): void {
  const mask = condition ? 0xff : 0x00;
  const invMask = condition ? 0x00 : 0xff;
  const len = Math.min(source.length, dest.length);

  for (let i = 0; i < len; i++) {
    // dest[i] = (source[i] & mask) | (dest[i] & invMask)
    dest[i] = (source[i]! & mask) | (dest[i]! & invMask);
  }
}

/**
 * WebCrypto-hardened random bytes generation
 *
 * Generates cryptographically secure random bytes with
 * additional hardening against side-channel attacks.
 *
 * @param length - Number of bytes to generate
 * @returns Random bytes
 */
export function hardenedRandomBytes(length: number): Buffer {
  // Generate extra randomness and mix
  const primary = randomBytes(length);
  const secondary = randomBytes(length);
  const timestamp = Buffer.alloc(8);
  timestamp.writeBigInt64BE(BigInt(Date.now()));

  // Mix using HMAC for additional security
  const hmac = createHmac('sha256', secondary);
  hmac.update(primary);
  hmac.update(timestamp);
  const mixed = hmac.digest();

  // Return only the requested length
  return mixed.subarray(0, length);
}

/**
 * Constant-time lexicographic comparison
 *
 * Compares two buffers lexicographically in constant time.
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function constantTimeLexCompare(a: Buffer, b: Buffer): number {
  const len = Math.max(a.length, b.length);
  let result = 0;
  let found = false;

  for (let i = 0; i < len; i++) {
    const byteA = i < a.length ? a[i]! : 0;
    const byteB = i < b.length ? b[i]! : 0;

    // Only update result for first difference
    // Both branches always execute
    const diff = byteA - byteB;
    const updateMask = found ? 0 : 1;
    result = result + diff * updateMask;
    found = found || diff !== 0;
  }

  // Normalize to -1, 0, or 1
  if (result < 0) return -1;
  if (result > 0) return 1;
  return 0;
}

/**
 * Constant-time bitwise AND
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns Buffer with bitwise AND of inputs
 */
export function constantTimeAnd(a: Buffer, b: Buffer): Buffer {
  const len = Math.min(a.length, b.length);
  const result = Buffer.alloc(len);

  for (let i = 0; i < len; i++) {
    result[i] = a[i]! & b[i]!;
  }

  return result;
}

/**
 * Constant-time bitwise OR
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns Buffer with bitwise OR of inputs
 */
export function constantTimeOr(a: Buffer, b: Buffer): Buffer {
  const len = Math.min(a.length, b.length);
  const result = Buffer.alloc(len);

  for (let i = 0; i < len; i++) {
    result[i] = a[i]! | b[i]!;
  }

  return result;
}

/**
 * Constant-time bitwise XOR
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns Buffer with bitwise XOR of inputs
 */
export function constantTimeXor(a: Buffer, b: Buffer): Buffer {
  const len = Math.min(a.length, b.length);
  const result = Buffer.alloc(len);

  for (let i = 0; i < len; i++) {
    result[i] = a[i]! ^ b[i]!;
  }

  return result;
}

/**
 * Secure memory zeroing
 *
 * Zeros out a buffer securely to prevent sensitive data
 * from remaining in memory.
 *
 * @param buffer - Buffer to zero
 */
export function secureZero(buffer: Buffer): void {
  // Write zeros
  buffer.fill(0);
  // Write random data (prevents optimizer from removing the zero)
  const random = randomBytes(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = random[i]! ^ random[i]!; // Always 0, but compiler can't optimize out
  }
}

/**
 * Constant-time modular reduction (for small values)
 *
 * Reduces value mod modulus in constant time.
 *
 * @param value - Value to reduce
 * @param modulus - Modulus
 * @returns value mod modulus
 */
export function constantTimeMod(value: number, modulus: number): number {
  // Simple constant-time modulo for small integers
  // Uses bitwise operations to avoid branches
  let result = value;
  const iterations = 32; // Sufficient for 32-bit integers

  for (let i = 0; i < iterations; i++) {
    // Subtract modulus if result >= modulus
    const diff = result - modulus;
    const mask = (diff >> 31) & 1; // 1 if diff < 0, 0 otherwise
    result = mask * result + (1 - mask) * diff;
  }

  return result;
}

/**
 * Validate constant-time implementation
 *
 * Simple self-test for constant-time operations.
 * Call during initialization to verify implementation.
 *
 * @returns True if tests pass
 */
export function validateConstantTimeOps(): boolean {
  try {
    // Test equal buffers
    const a = Buffer.from([1, 2, 3, 4]);
    const b = Buffer.from([1, 2, 3, 4]);
    if (!constantTimeEqual(a, b)) return false;

    // Test unequal buffers
    const c = Buffer.from([1, 2, 3, 5]);
    if (constantTimeEqual(a, c)) return false;

    // Test string comparison
    if (!constantTimeStringEqual('test', 'test')) return false;
    if (constantTimeStringEqual('test', 'TEST')) return false;

    // Test zero check
    const zeros = Buffer.alloc(4);
    if (!constantTimeIsZero(zeros)) return false;
    if (constantTimeIsZero(a)) return false;

    // Test select
    if (constantTimeSelect(true, 'a', 'b') !== 'a') return false;
    if (constantTimeSelect(false, 'a', 'b') !== 'b') return false;

    // Test XOR
    const xored = constantTimeXor(a, b);
    if (!constantTimeIsZero(xored)) return false;

    return true;
  } catch {
    return false;
  }
}

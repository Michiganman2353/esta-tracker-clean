/**
 * KMS Service Tests
 * 
 * Tests for Google Cloud KMS integration.
 * Basic unit tests that don't require actual GCP credentials.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KMSService } from '../kmsService';

describe('KMSService Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Set test environment
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.KMS_LOCATION = 'us-central1';
    process.env.KMS_KEYRING_NAME = 'test-keyring';
    process.env.KMS_ENCRYPTION_KEY_NAME = 'test-key';
    process.env.KMS_KEY_VERSION = '1';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });
  it('should load configuration from environment', () => {
    const service = new KMSService();
    const keyPath = service.getKeyPath();
    
    expect(keyPath).toContain('test-project');
    expect(keyPath).toContain('us-central1');
    expect(keyPath).toContain('test-keyring');
    expect(keyPath).toContain('test-key');
  });

  it('should throw error if project ID is not set', () => {
    delete process.env.GCP_PROJECT_ID;
    delete process.env.FIREBASE_PROJECT_ID;
    
    expect(() => new KMSService()).toThrow('GCP_PROJECT_ID or FIREBASE_PROJECT_ID must be set');
  });

  it('should use default values for optional config', () => {
    delete process.env.KMS_LOCATION;
    delete process.env.KMS_KEYRING_NAME;
    delete process.env.KMS_ENCRYPTION_KEY_NAME;
    
    const service = new KMSService();
    const keyPath = service.getKeyPath();
    
    expect(keyPath).toContain('us-central1');
    expect(keyPath).toContain('esta-tracker-keyring');
    expect(keyPath).toContain('esta-encryption-key');
  });

  it('should generate correct key path', () => {
    const service = new KMSService();
    const keyPath = service.getKeyPath();
    
    expect(keyPath).toBe(
      'projects/test-project/locations/us-central1/keyRings/test-keyring/cryptoKeys/test-key/cryptoKeyVersions/1'
    );
  });

  it('should generate key path with custom version', () => {
    const service = new KMSService();
    const keyPath = service.getKeyPath('2');
    
    expect(keyPath).toContain('cryptoKeyVersions/2');
  });

  it('should generate crypto key path without version', () => {
    const service = new KMSService();
    const cryptoKeyPath = service.getCryptoKeyPath();
    
    expect(cryptoKeyPath).toBe(
      'projects/test-project/locations/us-central1/keyRings/test-keyring/cryptoKeys/test-key'
    );
    expect(cryptoKeyPath).not.toContain('cryptoKeyVersions');
  });

  it('should allow clearing cache', () => {
    const service = new KMSService();
    
    // Should not throw
    expect(() => service.clearCache()).not.toThrow();
  });
});

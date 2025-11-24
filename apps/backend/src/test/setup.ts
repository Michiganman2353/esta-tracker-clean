/**
 * Vitest setup file for backend tests
 * Sets up environment variables needed for KMS and other services
 */

// Set test environment variables for KMS service
process.env.GCP_PROJECT_ID = 'test-project';
process.env.KMS_LOCATION = 'us-central1';
process.env.KMS_KEYRING_NAME = 'test-keyring';
process.env.KMS_ENCRYPTION_KEY_NAME = 'test-key';
process.env.KMS_KEY_VERSION = '1';
process.env.NODE_ENV = 'test';

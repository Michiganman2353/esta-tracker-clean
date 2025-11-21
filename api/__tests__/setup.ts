/**
 * Test setup file for API tests
 * Sets up environment variables and global mocks
 */

// Set required environment variables for tests
process.env.GCP_PROJECT_ID = 'test-project-id';
process.env.FIREBASE_PROJECT_ID = 'test-firebase-project';
process.env.NODE_ENV = 'test';

// Mock environment for KMS operations in tests
process.env.GCP_KMS_KEY_RING = 'test-key-ring';
process.env.GCP_KMS_KEY_NAME = 'test-key-name';
process.env.GCP_KMS_LOCATION = 'global';

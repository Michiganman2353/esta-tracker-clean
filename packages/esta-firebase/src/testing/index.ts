/**
 * Firebase Testing Mocks
 * 
 * Provides mock implementations of Firebase services for testing.
 * Use these in your tests to avoid hitting real Firebase services.
 * 
 * Usage in tests:
 * ```typescript
 * import { mockApp, mockAuth, mockDb, mockStorage } from '@esta/firebase/testing';
 * ```
 */

/**
 * Mock Firebase App
 */
export const mockApp = {
  name: '[DEFAULT]',
  options: {
    projectId: 'test-project',
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    storageBucket: 'test-bucket',
    messagingSenderId: '123456789',
    appId: 'test-app-id',
  },
  automaticDataCollectionEnabled: false,
};

/**
 * Mock Firebase Auth
 */
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: any) => void) => {
    callback(null);
    return () => {}; // unsubscribe function
  },
  signInWithEmailAndPassword: async (email: string, _password: string) => {
    return {
      user: {
        uid: 'test-uid',
        email,
        emailVerified: true,
        displayName: 'Test User',
      },
    };
  },
  signOut: async () => {},
  createUserWithEmailAndPassword: async (email: string, _password: string) => {
    return {
      user: {
        uid: 'test-uid',
        email,
        emailVerified: false,
        displayName: null,
      },
    };
  },
  sendPasswordResetEmail: async (_email: string) => {},
  updateProfile: async (_updates: any) => {},
};

/**
 * Mock Firestore
 */
export const mockDb = {
  collection: (path: string) => mockCollectionRef(path),
  doc: (path: string) => mockDocRef(path),
};

/**
 * Mock Firestore Collection Reference
 */
export function mockCollectionRef(path: string) {
  return {
    path,
    id: path.split('/').pop(),
    doc: (id: string) => mockDocRef(`${path}/${id}`),
    add: async (_data: any) => mockDocRef(`${path}/mock-id`),
    get: async () => ({
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {},
    }),
    where: () => mockQuery(),
    orderBy: () => mockQuery(),
    limit: () => mockQuery(),
  };
}

/**
 * Mock Firestore Document Reference
 */
export function mockDocRef(path: string) {
  return {
    path,
    id: path.split('/').pop(),
    collection: (subPath: string) => mockCollectionRef(`${path}/${subPath}`),
    get: async () => ({
      exists: false,
      data: () => undefined,
      id: path.split('/').pop(),
    }),
    set: async (_data: any) => {},
    update: async (_data: any) => {},
    delete: async () => {},
    onSnapshot: (callback: (snapshot: any) => void) => {
      callback({ exists: false, data: () => undefined });
      return () => {}; // unsubscribe
    },
  };
}

/**
 * Mock Firestore Query
 */
export function mockQuery() {
  return {
    where: () => mockQuery(),
    orderBy: () => mockQuery(),
    limit: () => mockQuery(),
    get: async () => ({
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {},
    }),
  };
}

/**
 * Mock Firebase Storage
 */
export const mockStorage = {
  ref: (path?: string) => mockStorageRef(path || '/'),
};

/**
 * Mock Storage Reference
 */
export function mockStorageRef(path: string) {
  return {
    path,
    name: path.split('/').pop(),
    bucket: 'test-bucket',
    fullPath: path,
    put: async (_data: any) => ({
      ref: mockStorageRef(path),
      metadata: {},
    }),
    putString: async (_data: string) => ({
      ref: mockStorageRef(path),
      metadata: {},
    }),
    delete: async () => {},
    getDownloadURL: async () => `https://storage.test/test-bucket/${path}`,
    listAll: async () => ({
      items: [],
      prefixes: [],
    }),
  };
}

/**
 * Mock Admin SDK App
 */
export const mockAdminApp = {
  name: '[DEFAULT]',
  options: {
    projectId: 'test-project',
    storageBucket: 'test-bucket',
  },
  auth: () => mockAdminAuth,
  firestore: () => mockAdminDb,
  storage: () => mockAdminStorage,
  delete: async () => {},
};

/**
 * Mock Admin Auth
 */
export const mockAdminAuth = {
  verifyIdToken: async (_token: string) => ({
    uid: 'test-uid',
    email: 'test@example.com',
    email_verified: true,
  }),
  getUser: async (uid: string) => ({
    uid,
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
  }),
  getUserByEmail: async (email: string) => ({
    uid: 'test-uid',
    email,
    emailVerified: true,
    displayName: 'Test User',
  }),
  createUser: async (properties: any) => ({
    uid: 'test-uid',
    ...properties,
  }),
  updateUser: async (uid: string, properties: any) => ({
    uid,
    ...properties,
  }),
  deleteUser: async (_uid: string) => {},
  setCustomUserClaims: async (_uid: string, _claims: any) => {},
};

/**
 * Mock Admin Firestore
 */
export const mockAdminDb = {
  collection: (path: string) => mockAdminCollectionRef(path),
  doc: (path: string) => mockAdminDocRef(path),
};

/**
 * Mock Admin Firestore Collection Reference
 */
export function mockAdminCollectionRef(path: string) {
  return {
    path,
    id: path.split('/').pop(),
    doc: (id: string) => mockAdminDocRef(`${path}/${id}`),
    add: async (_data: any) => mockAdminDocRef(`${path}/mock-id`),
    get: async () => ({
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {},
    }),
    where: () => mockAdminQuery(),
    orderBy: () => mockAdminQuery(),
    limit: () => mockAdminQuery(),
  };
}

/**
 * Mock Admin Firestore Document Reference
 */
export function mockAdminDocRef(path: string) {
  return {
    path,
    id: path.split('/').pop(),
    collection: (subPath: string) => mockAdminCollectionRef(`${path}/${subPath}`),
    get: async () => ({
      exists: false,
      data: () => undefined,
      id: path.split('/').pop(),
    }),
    set: async (_data: any) => {},
    update: async (_data: any) => {},
    delete: async () => {},
  };
}

/**
 * Mock Admin Query
 */
export function mockAdminQuery() {
  return {
    where: () => mockAdminQuery(),
    orderBy: () => mockAdminQuery(),
    limit: () => mockAdminQuery(),
    get: async () => ({
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {},
    }),
  };
}

/**
 * Mock Admin Storage
 */
export const mockAdminStorage = {
  bucket: (name?: string) => mockAdminBucket(name),
};

/**
 * Mock Admin Storage Bucket
 */
export function mockAdminBucket(name?: string) {
  return {
    name: name || 'test-bucket',
    file: (path: string) => mockAdminFile(path),
  };
}

/**
 * Mock Admin Storage File
 */
export function mockAdminFile(path: string) {
  return {
    name: path.split('/').pop(),
    save: async (_data: any) => {},
    delete: async () => {},
    exists: async () => [false],
    download: async () => [Buffer.from('test')],
    getSignedUrl: async (_config: any) => [`https://storage.test/test-bucket/${path}`],
  };
}

/**
 * Reset all mocks (useful between tests)
 */
export function resetMocks(): void {
  // Reset client auth state
  mockAuth.currentUser = null;
  
  // Note: Mock functions return fresh objects each time,
  // so no need to reset collections/docs/storage refs.
  // This is sufficient for most test isolation needs.
}

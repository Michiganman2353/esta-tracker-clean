/**
 * Google Cloud KMS Service
 *
 * Manages encryption keys using Google Cloud Key Management Service (KMS).
 * Provides secure key generation, storage, rotation, and access control.
 *
 * Key Features:
 * - RSA key pair management via Cloud KMS
 * - Automatic key rotation support
 * - Secure key storage (never leaves KMS)
 * - IAM-based access control
 * - Audit logging integration
 *
 * @module kmsService
 */
import { KeyManagementServiceClient } from '@google-cloud/kms';
/**
 * Get KMS configuration from environment
 */
function getKMSConfig() {
    const config = {
        projectId: process.env.GCP_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
        locationId: process.env.KMS_LOCATION || 'us-central1',
        keyRingId: process.env.KMS_KEYRING_NAME || 'esta-tracker-keyring',
        keyId: process.env.KMS_ENCRYPTION_KEY_NAME || 'esta-encryption-key',
        keyVersion: process.env.KMS_KEY_VERSION || '1'
    };
    if (!config.projectId) {
        throw new Error('GCP_PROJECT_ID or FIREBASE_PROJECT_ID must be set for KMS operations');
    }
    return config;
}
/**
 * KMS Service for key management
 */
class KMSService {
    constructor() {
        this.publicKeyCache = new Map();
        this.CACHE_TTL = 3600000; // 1 hour in milliseconds
        this.config = getKMSConfig();
        // Initialize KMS client with credentials
        const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        this.client = credentials
            ? new KeyManagementServiceClient({ keyFilename: credentials })
            : new KeyManagementServiceClient(); // Uses default credentials in GCP
    }
    /**
     * Get the full KMS key path
     */
    getKeyPath(version) {
        const { projectId, locationId, keyRingId, keyId } = this.config;
        const keyVersion = version || this.config.keyVersion || '1';
        return `projects/${projectId}/locations/${locationId}/keyRings/${keyRingId}/cryptoKeys/${keyId}/cryptoKeyVersions/${keyVersion}`;
    }
    /**
     * Get the crypto key path (without version)
     */
    getCryptoKeyPath() {
        const { projectId, locationId, keyRingId, keyId } = this.config;
        return `projects/${projectId}/locations/${locationId}/keyRings/${keyRingId}/cryptoKeys/${keyId}`;
    }
    /**
     * Get public key from KMS (with caching)
     *
     * @param version - Optional key version (defaults to configured version)
     * @returns KMS key pair information
     */
    async getPublicKey(version) {
        const keyPath = this.getKeyPath(version);
        // Check cache
        const cached = this.publicKeyCache.get(keyPath);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return {
                publicKey: cached.publicKey,
                keyPath,
                keyVersion: version || this.config.keyVersion || '1',
                algorithm: 'RSA_DECRYPT_OAEP_4096_SHA256'
            };
        }
        try {
            // Get public key from KMS
            const [publicKey] = await this.client.getPublicKey({ name: keyPath });
            if (!publicKey.pem) {
                throw new Error('Public key PEM not found in KMS response');
            }
            // Cache the public key
            this.publicKeyCache.set(keyPath, {
                publicKey: publicKey.pem,
                timestamp: Date.now()
            });
            return {
                publicKey: publicKey.pem,
                keyPath,
                keyVersion: version || this.config.keyVersion || '1',
                algorithm: publicKey.algorithm || 'RSA_DECRYPT_OAEP_4096_SHA256'
            };
        }
        catch (error) {
            console.error('Failed to get public key from KMS:', error);
            throw new Error(`KMS public key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Encrypt data with KMS (asymmetric encryption)
     *
     * Note: This uses KMS public key encryption where the public key is used to encrypt
     * and the private key (in KMS) is used to decrypt. This is different from the
     * asymmetricDecrypt operation.
     *
     * For KMS, we'll use the public key to encrypt locally and KMS to decrypt.
     *
     * @param plaintext - Data to encrypt (should be small, like an AES key)
     * @returns Encrypted data as base64 string
     */
    async asymmetricEncrypt(plaintext) {
        // Get the public key from KMS
        const keyInfo = await this.getPublicKey();
        // Use Node.js crypto to encrypt with the public key (RSA-OAEP)
        const crypto = await import('crypto');
        const encrypted = crypto.publicEncrypt({
            key: keyInfo.publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        }, plaintext);
        return encrypted.toString('base64');
    }
    /**
     * Decrypt data with KMS (asymmetric decryption)
     *
     * @param ciphertext - Base64 encrypted data
     * @param version - Optional key version
     * @returns Decrypted data as Buffer
     */
    async asymmetricDecrypt(ciphertext, version) {
        const keyPath = this.getKeyPath(version);
        try {
            const [response] = await this.client.asymmetricDecrypt({
                name: keyPath,
                ciphertext: Buffer.from(ciphertext, 'base64')
            });
            if (!response.plaintext) {
                throw new Error('No plaintext returned from KMS');
            }
            return Buffer.from(response.plaintext);
        }
        catch (error) {
            console.error('KMS asymmetric decryption failed:', error);
            throw new Error(`KMS decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a new key ring in KMS
     *
     * Call this once during initial setup.
     * Key rings cannot be deleted, so use carefully.
     *
     * @returns Key ring path
     */
    async createKeyRing() {
        const { projectId, locationId, keyRingId } = this.config;
        const parent = `projects/${projectId}/locations/${locationId}`;
        try {
            const [keyRing] = await this.client.createKeyRing({
                parent,
                keyRingId,
                keyRing: {}
            });
            console.log(`Created key ring: ${keyRing.name}`);
            return keyRing.name || '';
        }
        catch (error) {
            // Key ring might already exist
            if (error instanceof Error && error.message.includes('ALREADY_EXISTS')) {
                console.log('Key ring already exists');
                return `${parent}/keyRings/${keyRingId}`;
            }
            throw error;
        }
    }
    /**
     * Create a new asymmetric encryption key in KMS
     *
     * Call this once during initial setup or for key rotation.
     *
     * @returns Crypto key path
     */
    async createCryptoKey() {
        const { projectId, locationId, keyRingId, keyId } = this.config;
        const parent = `projects/${projectId}/locations/${locationId}/keyRings/${keyRingId}`;
        try {
            const [key] = await this.client.createCryptoKey({
                parent,
                cryptoKeyId: keyId,
                cryptoKey: {
                    purpose: 'ASYMMETRIC_DECRYPT',
                    versionTemplate: {
                        algorithm: 'RSA_DECRYPT_OAEP_4096_SHA256',
                        protectionLevel: 'SOFTWARE' // Use 'HSM' for hardware security module
                    },
                    // Enable automatic rotation (recommended for production)
                    // rotationPeriod: { seconds: 7776000 }, // 90 days
                    // nextRotationTime: { seconds: Math.floor(Date.now() / 1000) + 7776000 }
                }
            });
            console.log(`Created crypto key: ${key.name}`);
            return key.name || '';
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('ALREADY_EXISTS')) {
                console.log('Crypto key already exists');
                return `${parent}/cryptoKeys/${keyId}`;
            }
            throw error;
        }
    }
    /**
     * List all key versions for rotation management
     *
     * @returns Array of key version paths
     */
    async listKeyVersions() {
        const parent = this.getCryptoKeyPath();
        try {
            const [versions] = await this.client.listCryptoKeyVersions({ parent });
            return versions.map(v => v.name || '').filter(n => n.length > 0);
        }
        catch (error) {
            console.error('Failed to list key versions:', error);
            throw error;
        }
    }
    /**
     * Enable automatic key rotation
     *
     * @param rotationPeriodDays - Days between rotations (default: 90)
     */
    async enableKeyRotation(rotationPeriodDays = 90) {
        const keyPath = this.getCryptoKeyPath();
        const rotationPeriodSeconds = rotationPeriodDays * 24 * 60 * 60;
        try {
            await this.client.updateCryptoKey({
                cryptoKey: {
                    name: keyPath,
                    rotationPeriod: { seconds: rotationPeriodSeconds },
                    nextRotationTime: {
                        seconds: Math.floor(Date.now() / 1000) + rotationPeriodSeconds
                    }
                },
                updateMask: {
                    paths: ['rotation_period', 'next_rotation_time']
                }
            });
            console.log(`Enabled key rotation every ${rotationPeriodDays} days`);
        }
        catch (error) {
            console.error('Failed to enable key rotation:', error);
            throw error;
        }
    }
    /**
     * Check if KMS is properly configured and accessible
     *
     * @returns true if KMS is accessible
     */
    async healthCheck() {
        try {
            // Try to get the public key
            await this.getPublicKey();
            return true;
        }
        catch (error) {
            console.error('KMS health check failed:', error);
            return false;
        }
    }
    /**
     * Clear public key cache (useful for testing or after key rotation)
     */
    clearCache() {
        this.publicKeyCache.clear();
    }
}
// Export singleton instance
export const kmsService = new KMSService();
// Export class for testing
export { KMSService };

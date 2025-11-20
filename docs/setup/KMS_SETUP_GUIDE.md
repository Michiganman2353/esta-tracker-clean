# Google Cloud KMS Integration Guide

## Overview

ESTA Tracker uses Google Cloud Key Management Service (KMS) for production-grade encryption key management. This guide covers setup, configuration, IAM permissions, and usage.

## Why KMS?

Traditional encryption approaches store private keys in:
- Environment variables (risky)
- Files on disk (vulnerable)
- Application code (extremely dangerous)

**KMS provides:**
- ✅ Hardware-backed key storage
- ✅ Automatic key rotation
- ✅ Audit logging
- ✅ IAM-based access control
- ✅ Compliance (FIPS 140-2, etc.)
- ✅ No private keys ever leave Google's infrastructure

## Architecture

### Hybrid Encryption Flow with KMS

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Encrypt data with AES-256-GCM
       │    (random AES key generated)
       │
       ▼
┌─────────────────┐
│  ESTA Tracker   │
│     Server      │
├─────────────────┤
│ 2. Get public   │
│    key from KMS │
│                 │
│ 3. Encrypt AES  │
│    key with     │
│    public key   │
└────────┬────────┘
         │
         │ 4. Store encrypted data + encrypted AES key
         │
         ▼
┌─────────────────┐
│    Firestore    │
│   (Database)    │
└─────────────────┘

For Decryption:
┌─────────────────┐
│    Firestore    │
└────────┬────────┘
         │
         │ 1. Retrieve encrypted data + encrypted AES key
         │
         ▼
┌─────────────────┐
│  ESTA Tracker   │
│     Server      │
├─────────────────┤
│ 2. Send         │
│    encrypted    │
│    AES key      │
│    to KMS       │
└────────┬────────┘
         │
         │ 3. KMS decrypts AES key (private key never leaves KMS)
         │
         ▼
┌─────────────────┐
│   Google KMS    │
│ (Private key    │
│  in HSM)        │
└────────┬────────┘
         │
         │ 4. Return decrypted AES key
         │
         ▼
┌─────────────────┐
│  ESTA Tracker   │
│     Server      │
├─────────────────┤
│ 5. Decrypt data │
│    with AES key │
│                 │
│ 6. Return       │
│    plaintext    │
└─────────────────┘
```

## Prerequisites

1. **GCP Project** with billing enabled
2. **Cloud KMS API** enabled
3. **Service Account** with appropriate permissions
4. **Firebase Project** (already configured for ESTA Tracker)

## Setup Instructions

### Step 1: Enable Cloud KMS API

```bash
# Enable the API
gcloud services enable cloudkms.googleapis.com

# Verify it's enabled
gcloud services list --enabled | grep cloudkms
```

### Step 2: Create Service Account (if needed)

```bash
# Create service account
gcloud iam service-accounts create esta-tracker-kms \
  --display-name="ESTA Tracker KMS Service Account" \
  --description="Service account for KMS encryption operations"

# Get the service account email
SA_EMAIL=$(gcloud iam service-accounts list \
  --filter="displayName:ESTA Tracker KMS Service Account" \
  --format="value(email)")

echo "Service Account: $SA_EMAIL"
```

### Step 3: Run KMS Setup Script

```bash
# Set environment variables
export GCP_PROJECT_ID="your-firebase-project-id"
export KMS_LOCATION="us-central1"
export KMS_KEYRING_NAME="esta-tracker-keyring"
export KMS_ENCRYPTION_KEY_NAME="esta-encryption-key"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"

# Run setup script
npm run setup:kms
```

This script will:
- Create a key ring (if it doesn't exist)
- Create an asymmetric encryption key (RSA-OAEP 4096-bit)
- Verify public key access
- Display IAM setup instructions

### Step 4: Grant IAM Permissions

```bash
# Required permissions for encryption/decryption
gcloud kms keys add-iam-policy-binding esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

# Required for public key access
gcloud kms keys add-iam-policy-binding esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudkms.publicKeyViewer"
```

### Step 5: Configure Environment Variables

Update your `.env.local` or Vercel environment variables:

```bash
# GCP Project (should match Firebase project)
GCP_PROJECT_ID=esta-tracker
FIREBASE_PROJECT_ID=esta-tracker

# KMS Configuration
KMS_LOCATION=us-central1
KMS_KEYRING_NAME=esta-tracker-keyring
KMS_ENCRYPTION_KEY_NAME=esta-encryption-key
KMS_KEY_VERSION=1

# Service Account Credentials
# For local development:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

# For Vercel (add as environment variable):
# Upload serviceAccountKey.json content or use Workload Identity
```

### Step 6: Verify Setup

```bash
# Test KMS health check
npm run test:backend -- kmsService

# Test encryption/decryption
npm run test:backend -- kmsHybridEncryption
```

## Usage

### Server-Side Encryption

```typescript
import { encryptWithKMS, decryptWithKMS } from './services/kmsHybridEncryption';

// Encrypt sensitive data
const encrypted = await encryptWithKMS('SSN: 123-45-6789');

// Store in database
await firestore.collection('employees').doc(employeeId).update({
  encrypted: {
    ssn: {
      encryptedData: encrypted.encryptedData,
      encryptedAESKey: encrypted.encryptedAESKey,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      keyPath: encrypted.keyPath,
      keyVersion: encrypted.keyVersion
    }
  }
});

// Later, decrypt
const decrypted = await decryptWithKMS({
  encryptedData: doc.encrypted.ssn.encryptedData,
  encryptedAESKey: doc.encrypted.ssn.encryptedAESKey,
  iv: doc.encrypted.ssn.iv,
  authTag: doc.encrypted.ssn.authTag,
  keyVersion: doc.encrypted.ssn.keyVersion
});

console.log(decrypted); // "SSN: 123-45-6789"
```

### API Endpoints

#### Encrypt Endpoint

```bash
POST /api/secure/encrypt
Authorization: Bearer <firebase-token>

{
  "data": "sensitive information",
  "metadata": {
    "resourceType": "employee_ssn",
    "resourceId": "emp_123",
    "tenantId": "tenant_456"
  }
}

Response:
{
  "success": true,
  "encrypted": {
    "encryptedData": "base64...",
    "encryptedAESKey": "base64...",
    "iv": "base64...",
    "authTag": "base64...",
    "keyPath": "projects/.../cryptoKeys/.../cryptoKeyVersions/1",
    "keyVersion": "1"
  }
}
```

#### Decrypt Endpoint

```bash
POST /api/secure/decrypt
Authorization: Bearer <firebase-token>

{
  "payload": {
    "encryptedData": "base64...",
    "encryptedAESKey": "base64...",
    "iv": "base64...",
    "authTag": "base64...",
    "keyVersion": "1"
  },
  "useKMS": true,
  "tenantId": "tenant_456"
}

Response:
{
  "success": true,
  "decrypted": "sensitive information"
}
```

## Key Rotation

### Manual Key Rotation

```bash
# Create new key version (KMS does this automatically if rotation is enabled)
gcloud kms keys versions create \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --key=esta-encryption-key

# List versions
gcloud kms keys versions list \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --key=esta-encryption-key
```

### Automatic Key Rotation

```typescript
import { kmsService } from './services/kmsService';

// Enable automatic rotation (every 90 days)
await kmsService.enableKeyRotation(90);
```

### Re-encryption After Rotation

When you rotate keys, old data encrypted with version 1 can still be decrypted. To re-encrypt with the new key:

```typescript
// Get documents encrypted with old key version
const docs = await firestore
  .collection('employees')
  .where('encrypted.ssn.keyVersion', '==', '1')
  .get();

for (const doc of docs.docs) {
  const encrypted = doc.data().encrypted.ssn;
  
  // Decrypt with old key
  const decrypted = await decryptWithKMS({
    ...encrypted,
    keyVersion: '1'
  });
  
  // Re-encrypt with new key (version 2)
  const reencrypted = await encryptWithKMS(decrypted, '2');
  
  // Update document
  await doc.ref.update({
    'encrypted.ssn': reencrypted
  });
}
```

## Security Best Practices

### 1. Service Account Security

- ✅ Use separate service accounts for dev/staging/production
- ✅ Grant minimum necessary permissions
- ✅ Rotate service account keys every 90 days
- ✅ Never commit service account keys to Git
- ✅ Use Workload Identity in production if possible

### 2. Key Management

- ✅ Enable automatic key rotation (90 days recommended)
- ✅ Use separate key rings for different environments
- ✅ Monitor key usage with Cloud Logging
- ✅ Set up alerts for unusual key usage patterns
- ✅ Use HSM protection level for highly sensitive data

### 3. Access Control

- ✅ Restrict KMS access to backend services only
- ✅ Never expose KMS operations to frontend
- ✅ Log all decryption operations
- ✅ Implement rate limiting on decrypt endpoint
- ✅ Require authentication for all KMS operations

### 4. Data Classification

**Always Encrypt:**
- Social Security Numbers (SSN)
- Tax IDs (EIN)
- Bank account numbers
- Medical information
- Home addresses (if required by law)
- Salary information

**Never Encrypt:**
- Employee names (needed for search)
- Email addresses (used for auth)
- Company names (needed for display)
- Timestamps
- Document IDs

## Monitoring and Auditing

### View KMS Audit Logs

```bash
# View encryption operations
gcloud logging read \
  "resource.type=cloudkms_cryptokeyversion" \
  --limit=50 \
  --format=json

# Filter by specific key
gcloud logging read \
  "resource.labels.crypto_key_id=esta-encryption-key" \
  --limit=50
```

### Set Up Alerts

```bash
# Create alert for failed decrypt operations
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="KMS Decrypt Failures" \
  --condition-display-name="High decrypt failure rate" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=300s
```

## Troubleshooting

### Error: "Permission denied"

**Cause:** Service account doesn't have KMS permissions

**Solution:**
```bash
gcloud kms keys add-iam-policy-binding esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --member="serviceAccount:YOUR_SA@PROJECT.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
```

### Error: "Key not found"

**Cause:** Key ring or key doesn't exist

**Solution:**
```bash
npm run setup:kms
```

### Error: "Decryption failed: wrong key version"

**Cause:** Trying to decrypt with wrong key version

**Solution:**
```typescript
// Always store keyVersion with encrypted data
const encrypted = await encryptWithKMS(data);

// Use the same version for decryption
const decrypted = await decryptWithKMS({
  ...payload,
  keyVersion: encrypted.keyVersion
});
```

### Error: "GOOGLE_APPLICATION_CREDENTIALS not set"

**Cause:** Service account credentials not configured

**Solution:**
```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"

# Or for Vercel, add as environment variable in dashboard
```

## Cost Considerations

### KMS Pricing (as of 2024)

- **Key storage:** $0.06/key/month
- **Key versions:** $0.06/version/month
- **Encrypt/Decrypt operations:** $0.03 per 10,000 operations
- **Admin operations:** Free

### Cost Optimization

1. **Cache public keys** (already implemented - 1 hour TTL)
2. **Batch operations** when possible
3. **Use appropriate key protection level:**
   - SOFTWARE: Standard security, lower cost
   - HSM: Hardware security module, higher cost (for compliance)

## Compliance

### Supported Standards

- ✅ **FIPS 140-2 Level 3** (HSM protection level)
- ✅ **HIPAA** compliant
- ✅ **SOC 2 Type II** certified
- ✅ **ISO 27001** certified
- ✅ **PCI DSS** compliant

### Audit Requirements

For Michigan ESTA compliance:
- ✅ 3-year retention of encrypted employee data
- ✅ Access logging for all decrypt operations
- ✅ Immutable audit trail
- ✅ Secure key management

## Migration from Legacy Encryption

If you have data encrypted with the old RSA system:

```typescript
async function migrateLegacyEncryption() {
  // Get all documents with legacy encryption
  const docs = await firestore
    .collection('employees')
    .where('encrypted.legacy', '==', true)
    .get();

  for (const doc of docs.docs) {
    const data = doc.data();
    
    // Decrypt with legacy system
    const decrypted = decryptHybrid(
      data.encrypted.ssn,
      process.env.LEGACY_PRIVATE_KEY
    );
    
    // Re-encrypt with KMS
    const encrypted = await encryptWithKMS(decrypted);
    
    // Update document
    await doc.ref.update({
      encrypted: {
        ssn: encrypted,
        legacy: false
      }
    });
    
    console.log(`Migrated ${doc.id}`);
  }
}
```

## Additional Resources

- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)
- [KMS Best Practices](https://cloud.google.com/kms/docs/best-practices)
- [KMS Pricing](https://cloud.google.com/kms/pricing)
- [KMS Quotas and Limits](https://cloud.google.com/kms/quotas)
- [ESTA Tracker Security Summary](./SECURITY_SUMMARY.md)
- [Hybrid Encryption Implementation](./HYBRID_ENCRYPTION_IMPLEMENTATION.md)

## Support

For issues with KMS integration:
1. Check this documentation
2. Review troubleshooting section
3. Check GCP audit logs
4. Open an issue in the repository

# Google Cloud IAM Configuration for KMS

## Overview

This document provides detailed IAM (Identity and Access Management) configuration for Google Cloud KMS in ESTA Tracker.

## Service Accounts

### Production Service Account

```bash
# Create production service account
gcloud iam service-accounts create esta-tracker-prod \
  --display-name="ESTA Tracker Production" \
  --description="Production service account for KMS and Firebase operations"

# Get service account email
PROD_SA=$(gcloud iam service-accounts list \
  --filter="displayName:ESTA Tracker Production" \
  --format="value(email)")

echo "Production SA: $PROD_SA"
```

### Staging Service Account

```bash
# Create staging service account
gcloud iam service-accounts create esta-tracker-staging \
  --display-name="ESTA Tracker Staging" \
  --description="Staging service account for testing"

# Get service account email
STAGING_SA=$(gcloud iam service-accounts list \
  --filter="displayName:ESTA Tracker Staging" \
  --format="value(email)")

echo "Staging SA: $STAGING_SA"
```

### Development Service Account

```bash
# Create development service account
gcloud iam service-accounts create esta-tracker-dev \
  --display-name="ESTA Tracker Development" \
  --description="Development service account for local testing"

# Get service account email
DEV_SA=$(gcloud iam service-accounts list \
  --filter="displayName:ESTA Tracker Development" \
  --format="value(email)")

echo "Development SA: $DEV_SA"
```

## KMS Permissions

### Required IAM Roles

#### 1. Cloud KMS CryptoKey Encrypter/Decrypter

Allows encryption and decryption operations.

```bash
# Production
gcloud kms keys add-iam-policy-binding esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --member="serviceAccount:${PROD_SA}" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

# Staging
gcloud kms keys add-iam-policy-binding esta-encryption-key-staging \
  --location=us-central1 \
  --keyring=esta-tracker-keyring-staging \
  --member="serviceAccount:${STAGING_SA}" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

# Development
gcloud kms keys add-iam-policy-binding esta-encryption-key-dev \
  --location=us-central1 \
  --keyring=esta-tracker-keyring-dev \
  --member="serviceAccount:${DEV_SA}" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
```

**Permissions included:**
- `cloudkms.cryptoKeyVersions.useToEncrypt`
- `cloudkms.cryptoKeyVersions.useToDecrypt`

#### 2. Cloud KMS Public Key Viewer

Allows reading public keys (needed for encryption).

```bash
# Production
gcloud kms keys add-iam-policy-binding esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --member="serviceAccount:${PROD_SA}" \
  --role="roles/cloudkms.publicKeyViewer"

# Staging
gcloud kms keys add-iam-policy-binding esta-encryption-key-staging \
  --location=us-central1 \
  --keyring=esta-tracker-keyring-staging \
  --member="serviceAccount:${STAGING_SA}" \
  --role="roles/cloudkms.publicKeyViewer"

# Development
gcloud kms keys add-iam-policy-binding esta-encryption-key-dev \
  --location=us-central1 \
  --keyring=esta-tracker-keyring-dev \
  --member="serviceAccount:${DEV_SA}" \
  --role="roles/cloudkms.publicKeyViewer"
```

**Permissions included:**
- `cloudkms.cryptoKeyVersions.viewPublicKey`

#### 3. Cloud KMS Viewer (Optional - for monitoring)

Allows viewing KMS resources (read-only).

```bash
# Grant at keyring level for monitoring
gcloud kms keyrings add-iam-policy-binding esta-tracker-keyring \
  --location=us-central1 \
  --member="serviceAccount:${PROD_SA}" \
  --role="roles/cloudkms.viewer"
```

**Permissions included:**
- `cloudkms.cryptoKeys.list`
- `cloudkms.cryptoKeyVersions.list`
- `cloudkms.cryptoKeyVersions.get`

## Firebase Permissions

### Required for Backend Operations

```bash
# Firebase Admin SDK requires these roles
gcloud projects add-iam-policy-binding esta-tracker \
  --member="serviceAccount:${PROD_SA}" \
  --role="roles/firebase.admin"

# Firestore permissions
gcloud projects add-iam-policy-binding esta-tracker \
  --member="serviceAccount:${PROD_SA}" \
  --role="roles/datastore.user"

# Cloud Storage (for document uploads)
gcloud projects add-iam-policy-binding esta-tracker \
  --member="serviceAccount:${PROD_SA}" \
  --role="roles/storage.objectAdmin"
```

## Least Privilege Principles

### Custom Role for KMS (Recommended for Production)

Create a custom role with only the permissions needed:

```bash
# Create custom role definition
cat > kms-encrypter-role.yaml << EOF
title: "ESTA KMS Encrypter Decrypter"
description: "Custom role for KMS encryption/decryption"
stage: "GA"
includedPermissions:
- cloudkms.cryptoKeyVersions.useToEncrypt
- cloudkms.cryptoKeyVersions.useToDecrypt
- cloudkms.cryptoKeyVersions.viewPublicKey
- cloudkms.cryptoKeys.get
EOF

# Create the role
gcloud iam roles create estaKmsEncrypter \
  --project=esta-tracker \
  --file=kms-encrypter-role.yaml

# Assign custom role
gcloud kms keys add-iam-policy-binding esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --member="serviceAccount:${PROD_SA}" \
  --role="projects/esta-tracker/roles/estaKmsEncrypter"
```

## Service Account Key Management

### Create and Download Keys

```bash
# Production (use with extreme caution)
gcloud iam service-accounts keys create prod-key.json \
  --iam-account=${PROD_SA}

# Staging
gcloud iam service-accounts keys create staging-key.json \
  --iam-account=${STAGING_SA}

# Development
gcloud iam service-accounts keys create dev-key.json \
  --iam-account=${DEV_SA}
```

### Key Rotation Schedule

**Best Practice:** Rotate service account keys every 90 days.

```bash
# List keys
gcloud iam service-accounts keys list \
  --iam-account=${PROD_SA}

# Delete old key
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=${PROD_SA}

# Create new key
gcloud iam service-accounts keys create new-prod-key.json \
  --iam-account=${PROD_SA}
```

### Automated Key Rotation (Advanced)

```bash
# Create Cloud Scheduler job to rotate keys
gcloud scheduler jobs create http rotate-sa-keys \
  --schedule="0 0 1 */3 *" \
  --uri="https://us-central1-esta-tracker.cloudfunctions.net/rotateSAKeys" \
  --http-method=POST \
  --message-body='{"action":"rotate"}'
```

## Workload Identity (Recommended for GKE/Cloud Run)

If deploying to GKE or Cloud Run, use Workload Identity instead of service account keys:

```bash
# Enable Workload Identity
gcloud container clusters update esta-cluster \
  --workload-pool=esta-tracker.svc.id.goog

# Configure service account
gcloud iam service-accounts add-iam-policy-binding ${PROD_SA} \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:esta-tracker.svc.id.goog[default/esta-backend]"

# Annotate Kubernetes service account
kubectl annotate serviceaccount esta-backend \
  iam.gke.io/gcp-service-account=${PROD_SA}
```

## Audit Logging

### Enable Data Access Logs

```bash
# Create audit config
cat > audit-config.yaml << EOF
auditConfigs:
- auditLogConfigs:
  - logType: ADMIN_READ
  - logType: DATA_READ
  - logType: DATA_WRITE
  service: cloudkms.googleapis.com
EOF

# Apply audit config
gcloud projects set-iam-policy esta-tracker audit-config.yaml
```

### View Audit Logs

```bash
# View recent KMS operations
gcloud logging read \
  "resource.type=cloudkms_cryptokeyversion AND 
   protoPayload.methodName=Decrypt" \
  --limit=50 \
  --format=json

# View by service account
gcloud logging read \
  "resource.type=cloudkms_cryptokeyversion AND 
   protoPayload.authenticationInfo.principalEmail=${PROD_SA}" \
  --limit=50
```

## Monitoring and Alerting

### Create KMS Metrics

```bash
# Failed decrypt operations
gcloud logging metrics create kms_decrypt_failures \
  --description="Failed KMS decrypt operations" \
  --log-filter='resource.type="cloudkms_cryptokeyversion"
    AND protoPayload.methodName="Decrypt"
    AND severity="ERROR"'
```

### Create Alerts

```bash
# Alert on high failure rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="KMS Decrypt Failures" \
  --condition-display-name="High failure rate" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=300s \
  --condition-filter='metric.type="logging.googleapis.com/user/kms_decrypt_failures"'
```

## Security Best Practices

### 1. Environment Separation

✅ **DO:**
- Use separate service accounts for prod/staging/dev
- Use separate key rings for each environment
- Never share keys between environments

❌ **DON'T:**
- Use production keys in development
- Share service account keys between teams
- Commit service account keys to Git

### 2. Access Control

✅ **DO:**
- Grant minimum necessary permissions
- Use custom roles for fine-grained control
- Regularly review IAM policies
- Enable multi-factor authentication for admin accounts

❌ **DON'T:**
- Grant project-wide permissions
- Use "Owner" or "Editor" roles
- Share service account keys via email
- Store keys in plaintext

### 3. Key Management

✅ **DO:**
- Rotate service account keys every 90 days
- Enable automatic KMS key rotation
- Use HSM protection level for sensitive data
- Monitor key usage patterns

❌ **DON'T:**
- Store keys in environment variables (use Secret Manager)
- Hardcode keys in application code
- Use the same key for multiple purposes
- Disable audit logging

### 4. Network Security

✅ **DO:**
- Use VPC Service Controls
- Restrict API access by IP
- Enable Private Google Access
- Use Cloud Armor for DDoS protection

❌ **DON'T:**
- Expose KMS operations to public internet
- Allow unrestricted egress
- Disable Cloud Logging
- Use unencrypted connections

## Terraform Configuration (Optional)

```hcl
# Service Account
resource "google_service_account" "esta_tracker" {
  account_id   = "esta-tracker-prod"
  display_name = "ESTA Tracker Production"
}

# KMS Key Ring
resource "google_kms_key_ring" "esta" {
  name     = "esta-tracker-keyring"
  location = "us-central1"
}

# KMS Crypto Key
resource "google_kms_crypto_key" "esta_encryption" {
  name     = "esta-encryption-key"
  key_ring = google_kms_key_ring.esta.id

  rotation_period = "7776000s" # 90 days

  version_template {
    algorithm        = "RSA_DECRYPT_OAEP_4096_SHA256"
    protection_level = "SOFTWARE"
  }
}

# IAM Binding
resource "google_kms_crypto_key_iam_member" "encrypter_decrypter" {
  crypto_key_id = google_kms_crypto_key.esta_encryption.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${google_service_account.esta_tracker.email}"
}

resource "google_kms_crypto_key_iam_member" "public_key_viewer" {
  crypto_key_id = google_kms_crypto_key.esta_encryption.id
  role          = "roles/cloudkms.publicKeyViewer"
  member        = "serviceAccount:${google_service_account.esta_tracker.email}"
}
```

## Troubleshooting IAM Issues

### Error: "Permission denied"

```bash
# Check current permissions
gcloud kms keys get-iam-policy esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring

# Verify service account has correct role
gcloud kms keys get-iam-policy esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring \
  --flatten="bindings[].members" \
  --filter="bindings.members:${PROD_SA}"
```

### Error: "Key not found"

```bash
# List available keys
gcloud kms keys list \
  --location=us-central1 \
  --keyring=esta-tracker-keyring

# Check key exists
gcloud kms keys describe esta-encryption-key \
  --location=us-central1 \
  --keyring=esta-tracker-keyring
```

### Error: "Service account does not exist"

```bash
# List service accounts
gcloud iam service-accounts list

# Create if missing
gcloud iam service-accounts create esta-tracker-prod \
  --display-name="ESTA Tracker Production"
```

## Compliance Checklist

- [ ] Separate service accounts for each environment
- [ ] Least privilege IAM roles assigned
- [ ] Service account keys rotated every 90 days
- [ ] KMS key rotation enabled
- [ ] Audit logging enabled and monitored
- [ ] Access alerts configured
- [ ] Keys stored securely (not in Git)
- [ ] VPC Service Controls enabled (if applicable)
- [ ] Regular security audits scheduled
- [ ] Incident response plan documented

## Additional Resources

- [Google Cloud KMS IAM](https://cloud.google.com/kms/docs/iam)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [KMS Key Rotation](https://cloud.google.com/kms/docs/key-rotation)
- [Audit Logging](https://cloud.google.com/kms/docs/logging)
- [VPC Service Controls](https://cloud.google.com/vpc-service-controls)

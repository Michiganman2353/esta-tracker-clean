# Decrypt Endpoint Authentication Documentation

## Overview

The `/api/secure/decrypt` endpoint is now fully secured with authentication and authorization. This document describes the security implementation, usage, and access controls.

## Security Features

### 1. Authentication Required
- All requests must include a valid Firebase ID token in the `Authorization` header
- Token format: `Bearer <firebase-id-token>`
- Unauthenticated requests receive a `401 Unauthorized` response

### 2. Role-Based Authorization
The system supports three user roles:
- **Employee**: Can only decrypt their own data
- **Employer**: Can decrypt their own data and employees' data within their tenant
- **Admin**: Can decrypt any data (superuser access)

### 3. Permission Checks

#### Resource Ownership
- Employees can only decrypt data where `resourceOwnerId` matches their user ID or employee ID
- If resource owner doesn't match, access is denied with `403 Forbidden`

#### Tenant Access
- Users can only decrypt data from tenants they belong to
- Employers can access all data within their tenant
- Admins bypass tenant restrictions

### 4. Security Event Logging
All decrypt operations are logged to Firestore's `securityLogs` collection:
- `decrypt_success`: Successful decryption
- `decrypt_access_denied`: Authorization failure
- `decrypt_validation_error`: Invalid request parameters
- `decrypt_error`: Decryption failure

Log entries include:
- Event type
- Timestamp
- User ID and email
- Role and tenant
- IP address and user agent
- Request path and method
- Event-specific details

## API Endpoint

### POST `/api/secure/decrypt`

Decrypt hybrid-encrypted data (RSA-OAEP + AES-GCM).

#### Headers
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

#### Request Body
```json
{
  "payload": {
    "encryptedData": "base64-encoded-encrypted-data",
    "encryptedAESKey": "base64-encoded-rsa-encrypted-aes-key",
    "iv": "base64-encoded-initialization-vector",
    "authTag": "base64-encoded-authentication-tag"
  },
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "resourceOwnerId": "optional-user-id-who-owns-the-data",
  "tenantId": "optional-tenant-id-for-the-data"
}
```

#### Parameters
- `payload` (required): Hybrid encryption payload object
  - `encryptedData`: Base64-encoded AES-GCM encrypted data
  - `encryptedAESKey`: Base64-encoded RSA-encrypted AES key
  - `iv`: Base64-encoded initialization vector (12 bytes for GCM)
  - `authTag`: Base64-encoded authentication tag
- `privateKey` (required): RSA private key in PEM format
- `resourceOwnerId` (optional): User ID that owns the encrypted data
- `tenantId` (optional): Tenant ID for the encrypted data

#### Response

**Success (200 OK)**
```json
{
  "success": true,
  "decrypted": "decrypted-data-as-string"
}
```

**Validation Error (400 Bad Request)**
```json
{
  "success": false,
  "error": "Invalid payload parameter"
}
```

**Authentication Error (401 Unauthorized)**
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or expired token"
}
```

**Authorization Error (403 Forbidden)**
```json
{
  "success": false,
  "error": "Forbidden: You do not have permission to decrypt this data"
}
```

**Decryption Error (500 Internal Server Error)**
```json
{
  "success": false,
  "error": "Decryption failed",
  "message": "detailed-error-message"
}
```

## Usage Examples

### Frontend Integration

The frontend API client includes a `decryptData` method that automatically includes authentication headers:

```typescript
import { apiClient } from '@/lib/api';

// Example: Employee decrypting their own data
try {
  const result = await apiClient.decryptData(
    {
      encryptedData: '...',
      encryptedAESKey: '...',
      iv: '...',
      authTag: '...'
    },
    privateKey,
    currentUser.uid,  // resourceOwnerId
    currentUser.tenantId  // tenantId
  );
  
  console.log('Decrypted:', result.decrypted);
} catch (error) {
  console.error('Decryption failed:', error);
}
```

### Direct API Call

```typescript
const response = await fetch('/api/secure/decrypt', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    payload: {
      encryptedData: '...',
      encryptedAESKey: '...',
      iv: '...',
      authTag: '...'
    },
    privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
    resourceOwnerId: 'user123',
    tenantId: 'tenant123'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Decrypted:', data.decrypted);
}
```

## Authorization Matrix

| User Role | Can Decrypt Own Data | Can Decrypt Team Data | Can Decrypt Any Data |
|-----------|---------------------|----------------------|---------------------|
| Employee  | ✅ Yes              | ❌ No                 | ❌ No                |
| Employer  | ✅ Yes              | ✅ Yes (same tenant) | ❌ No                |
| Admin     | ✅ Yes              | ✅ Yes               | ✅ Yes               |

## Security Best Practices

### For Developers

1. **Always include authentication tokens**: Never attempt to call the decrypt endpoint without a valid Firebase ID token
2. **Specify resource ownership**: Include `resourceOwnerId` and `tenantId` when known to enable proper authorization checks
3. **Handle errors gracefully**: Implement proper error handling for 401, 403, and 500 responses
4. **Secure private key storage**: Never hardcode private keys in frontend code. Retrieve them securely from KMS or secure storage
5. **Minimize decryption**: Only decrypt data when necessary for display or processing

### For Administrators

1. **Monitor security logs**: Regularly review the `securityLogs` collection for suspicious activity
2. **Audit token usage**: Track failed authentication attempts and investigate patterns
3. **Review access patterns**: Monitor which users are decrypting which resources
4. **Implement rate limiting**: Consider adding rate limiting for the decrypt endpoint (future enhancement)

## Implementation Files

- **Middleware**: `/api/lib/authMiddleware.ts`
  - Token verification
  - Role-based authorization
  - Permission checks
  - Security logging

- **Endpoint**: `/api/secure/decrypt.ts`
  - Main decrypt handler
  - Authorization enforcement
  - Request validation

- **Tests**: 
  - `/api/__tests__/authMiddleware.test.ts` (19 tests)
  - `/api/__tests__/decrypt.test.ts` (20 tests)

- **Frontend Client**: `/packages/frontend/src/lib/api.ts`
  - `decryptData()` method with automatic auth headers

## Testing

Run tests with:
```bash
cd api
npm test
```

All 71 tests pass, including:
- Authentication token verification
- Role-based authorization
- Resource ownership checks
- Tenant access validation
- Input validation
- Decryption success and error handling
- Security event logging

## Future Enhancements

1. **Rate Limiting**: Add rate limiting per user/IP to prevent abuse
2. **Audit Dashboard**: Create UI for viewing security logs
3. **Key Rotation**: Implement automatic key rotation for enhanced security
4. **Multi-Factor Authentication**: Add optional MFA for sensitive decrypt operations
5. **Compliance Reports**: Generate compliance reports from security logs

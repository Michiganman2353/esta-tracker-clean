# Backend Migration to Vercel Serverless Functions

This document describes the migration of ESTA Tracker backend logic from Express.js in `/packages/backend` to Vercel Serverless Functions in `/api/`.

## Overview

The migration converts traditional Express.js routes into individual Vercel serverless functions, providing:

- **Automatic scaling**: Each function scales independently
- **Edge network deployment**: Functions deployed globally for low latency
- **Cost optimization**: Pay only for actual usage
- **Zero server management**: No infrastructure to maintain
- **Built-in HTTPS**: Automatic SSL/TLS certificates

## Architecture

### Before Migration
```
packages/backend/
├── src/
│   ├── index.ts              # Express server
│   ├── routes/               # Express routes
│   │   ├── auth.ts
│   │   ├── accrual.ts
│   │   ├── requests.ts
│   │   ├── audit.ts
│   │   ├── documents.ts
│   │   └── employer.ts
│   ├── services/
│   └── middleware/
```

### After Migration
```
api/
├── register.ts               # POST /api/register
├── verifyUser.ts             # POST /api/verifyUser
├── approveUser.ts            # POST /api/approveUser
├── validateBatch.ts          # POST /api/validateBatch
├── processCsv.ts             # POST /api/processCsv
├── generateAuditPack.ts      # POST /api/generateAuditPack
├── uploadDoctorNote.ts       # POST /api/uploadDoctorNote
├── getEmployeeCalendar.ts    # GET /api/getEmployeeCalendar
├── _utils.ts                 # Shared utilities
└── tsconfig.json             # TypeScript config
```

## Migrated Endpoints

### 1. User Registration - `/api/register`
**Purpose**: Register new users (employees and employers)

**Features**:
- Employee registration with tenant code validation
- Employer registration with company details
- Automatic tenant code generation
- Email verification link generation
- Audit logging

**Replaces**: 
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/register/employee`
- `POST /api/v1/auth/register/manager`

### 2. User Verification - `/api/verifyUser`
**Purpose**: Verify user email and activate account

**Features**:
- Email verification confirmation
- Custom claims setting
- Account status update
- Audit logging

**Replaces**: Firebase Cloud Function `approveUserAfterVerification`

### 3. User Approval - `/api/approveUser`
**Purpose**: Admin approval/denial of pending user registrations

**Features**:
- Admin-only access control
- Employer and tenant approval
- Custom claims management
- Denial reason tracking
- Audit logging

**Replaces**: Firebase Cloud Function `setUserClaims` (partially)

### 4. Batch Validation - `/api/validateBatch`
**Purpose**: Validate employee data before bulk import

**Features**:
- Email format validation
- Duplicate detection (within batch)
- Existing user detection (in Firebase)
- Hours worked validation
- Comprehensive error reporting

**New Feature**: Previously not implemented

### 5. CSV Processing - `/api/processCsv`
**Purpose**: Import employee data from CSV files

**Features**:
- Bulk employee creation
- Automatic password generation
- Balance calculation (Michigan ESTA rules)
- Work history import
- Detailed success/failure reporting

**New Feature**: Previously not implemented

### 6. Audit Pack Generation - `/api/generateAuditPack`
**Purpose**: Generate comprehensive compliance reports

**Features**:
- Employee roster with balances
- Sick time request history
- Audit log collection
- Document references
- Compliance summary statistics
- Date range filtering

**Replaces**: `GET /api/v1/audit/export` (enhanced)

### 7. Doctor Note Upload - `/api/uploadDoctorNote`
**Purpose**: Generate signed upload URLs for medical documentation

**Features**:
- Secure direct-to-storage uploads
- File type validation
- Immutability after approval
- Required documentation detection (3+ days)
- Audit logging

**Replaces**: Firebase Cloud Function `generateDocumentUploadUrl` (specialized)

### 8. Employee Calendar - `/api/getEmployeeCalendar`
**Purpose**: Retrieve employee schedule with sick time and work logs

**Features**:
- Calendar event aggregation
- Balance snapshots
- Employer size-based limits
- Multi-employee access (employer role)
- Flexible date range queries

**New Feature**: Previously not implemented

## Technical Details

### Firebase Integration

All functions use Firebase Admin SDK for:
- **Authentication**: Token verification via `auth.verifyIdToken()`
- **Database**: Firestore for data storage
- **Storage**: Cloud Storage for document uploads
- **Custom Claims**: Role-based access control

### Shared Utilities (`_utils.ts`)

Common functionality extracted to reduce code duplication:

```typescript
// Firebase initialization (singleton pattern)
export function initializeFirebase()

// CORS handling
export function setCorsHeaders(res, origin)
export function handlePreflight(res)

// Authentication
export function verifyAuthToken(authHeader)

// Response helpers
export function sendError(res, status, message, details?)
export function sendSuccess(res, data)
```

### CORS Configuration

All endpoints support:
- Credentials: `true`
- Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Headers: `Content-Type, Authorization`
- Origins: Configurable per environment

### Authentication

Standard authentication flow:
1. Client sends Firebase ID token in `Authorization` header
2. Function verifies token with Firebase Admin SDK
3. Decoded token provides: `uid`, `role`, `tenantId`, `emailVerified`
4. Function enforces role-based access control

### Error Handling

Consistent error responses across all endpoints:
```json
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

Common error codes:
- `400`: Bad request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `405`: Method not allowed
- `500`: Internal server error

## Environment Variables

Required environment variables in Vercel:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NODE_ENV=production
```

## Deployment

### Automatic Deployment

Vercel automatically deploys on Git push:
1. Detects `/api/*.ts` files
2. Compiles TypeScript
3. Bundles dependencies
4. Deploys to Edge Network
5. Updates routes

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Local Testing

```bash
# Start Vercel dev server
vercel dev

# Functions available at:
# http://localhost:3000/api/register
# http://localhost:3000/api/verifyUser
# etc.
```

## Migration Benefits

### Performance
- **Cold Start**: < 100ms (optimized for V8 isolates)
- **Execution Time**: Sub-second response times
- **Global Edge**: Deployed to 75+ edge locations
- **Auto-scaling**: Handles traffic spikes automatically

### Cost
- **Pay-per-use**: No idle server costs
- **Free tier**: 100GB-hours/month included
- **Predictable**: Based on actual execution time

### Reliability
- **High Availability**: 99.99% uptime SLA
- **Automatic Failover**: Built-in redundancy
- **DDoS Protection**: Included at edge
- **Rate Limiting**: Available via Edge Config

### Developer Experience
- **Zero Config**: Works out of the box
- **Hot Reload**: Fast local development
- **TypeScript Support**: Native type checking
- **Monitoring**: Built-in analytics and logs

## Future Enhancements

### Planned Features
1. **Edge Functions**: Ultra-fast authentication checks
2. **Background Functions**: Long-running CSV processing
3. **Cron Jobs**: Scheduled compliance reports
4. **WebSockets**: Real-time employee notifications
5. **Rate Limiting**: Per-user API quotas

### Performance Optimizations
1. **Connection Pooling**: Reuse Firebase connections
2. **Response Caching**: Cache audit reports
3. **Code Splitting**: Reduce bundle sizes
4. **Edge Caching**: CDN for static data

### Security Enhancements
1. **IP Whitelisting**: Restrict admin endpoints
2. **Request Signing**: Verify request integrity
3. **Audit Logging**: Enhanced security events
4. **Encryption**: At-rest data encryption

## Backward Compatibility

### Express Backend (`/packages/backend`)
- **Status**: Deprecated but functional
- **Recommendation**: Remove after full migration validation
- **Migration Path**: 
  1. Update frontend to use `/api/*` endpoints
  2. Test in staging environment
  3. Deploy to production
  4. Monitor for 30 days
  5. Remove Express backend

### Firebase Cloud Functions (`/functions`)
- **Status**: Active and complementary
- **Purpose**: Background jobs, triggers, scheduled tasks
- **Recommendation**: Keep for non-HTTP workloads

## Monitoring & Debugging

### Vercel Dashboard
- Real-time logs
- Execution analytics
- Error tracking
- Performance metrics

### Log Access
```bash
# View function logs
vercel logs

# View specific function
vercel logs --follow api/register
```

### Error Tracking
- Automatic error reporting
- Stack traces in development
- Sanitized errors in production

## Testing

### Unit Tests
```bash
# Run API function tests
npm test

# Coverage report
npm run test:coverage
```

### Integration Tests
```bash
# Start local Vercel server
vercel dev

# Run integration tests against local server
npm run test:integration
```

### Manual Testing
Use tools like:
- Postman
- curl
- Vercel CLI (`vercel dev`)

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs/functions
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup
- **API Reference**: `/api/README.md`
- **Issue Tracker**: GitHub Issues

## Conclusion

The migration to Vercel serverless functions provides a modern, scalable, and cost-effective backend architecture for ESTA Tracker. The new architecture supports rapid development, automatic scaling, and global deployment while maintaining security and compliance requirements.

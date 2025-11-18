# Edge Middleware Implementation

## Overview

This document describes the Edge Middleware implementation for ESTA Tracker, a critical SaaS security and access control system.

## Architecture

The middleware implementation consists of two layers:

### 1. Edge Middleware (`/middleware.ts`)

Runs on **Vercel's Edge Network** for minimal latency:
- **Maintenance Mode**: Checks via Vercel Edge Config
- **Security Headers**: Adds additional security and tracking headers
- **Request Correlation**: Generates unique request IDs for debugging
- **Performance Monitoring**: Timestamps requests at the edge

**Location**: `/middleware.ts` (repository root)

**Runtime**: Vercel Edge Runtime (globally distributed)

**Key Features**:
- Zero cold-start latency
- Globally distributed
- Runs before content delivery
- Supports maintenance mode via Edge Config

### 2. Client-Side Auth Guards (`/packages/frontend/src/lib/authGuards.ts`)

Comprehensive authentication and authorization logic:
- **Authentication**: Verifies user is logged in
- **Email Verification**: Ensures email is verified before access
- **Account Status**: Checks pending/approved/rejected status
- **Tenant Matching**: Enforces multi-tenant data isolation
- **Role-Based Access**: Controls access based on user role (employee, employer, admin)
- **Permission Checks**: Fine-grained permission system

**Location**: `/packages/frontend/src/lib/authGuards.ts`

**Runtime**: Browser (React application)

## Why Two Layers?

ESTA Tracker is a **React + Vite SPA** deployed on Vercel, not a Next.js application. This architecture requires:

1. **Edge Middleware**: For edge-level concerns (maintenance mode, security headers)
2. **Client-Side Guards**: For full authentication/authorization (requires Firebase SDK)

## Route Protection

### Public Routes (No Auth Required)
- `/login`
- `/register`
- `/register/employee`
- `/register/manager`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/maintenance`

### Status Routes (Partial Auth)
- `/verify-email` - Email verification pending
- `/pending-approval` - Account approval pending
- `/account-rejected` - Account rejected

### Protected Routes

#### Employer Routes
- `/employer` - Employer dashboard
- `/audit` - Audit logs
- `/settings` - Company settings
- `/manage-employees` - Employee management
- `/reports` - Compliance reports

**Access**: Employer and Admin roles only

#### Admin Routes
- `/admin` - Admin dashboard
- `/users` - User management
- `/tenants` - Tenant management
- `/system-settings` - System configuration

**Access**: Admin role only

#### Employee Routes
- `/employee` - Employee dashboard
- `/requests` - Sick time requests
- `/balance` - Time balance view
- `/my-profile` - User profile

**Access**: All authenticated users (shows their own data)

## Auth Guard Functions

### `checkAuth(pathname, user, options)`
Comprehensive auth check that validates:
1. Public/status route access
2. Authentication status
3. Email verification
4. Account approval status
5. Tenant matching
6. Role-based access

Returns `AuthGuardResult` with:
- `allowed: boolean` - Whether access is permitted
- `reason?: string` - Why access was denied
- `redirectTo?: string` - Where to redirect if denied

### `checkEmailVerification(user)`
Ensures user has verified their email address.

### `checkAccountStatus(user)`
Validates account is approved and not rejected.

### `checkTenantMatch(user, tenantId)`
Ensures user can only access their own tenant's data (multi-tenant isolation).

### `checkRoleAccess(pathname, user)`
Validates user role has permission to access route.

### `checkPermission(user, action, resource)`
Fine-grained permission checking:
- **Actions**: view, edit, delete, approve, manage
- **Resources**: employee, request, audit, settings, tenant

## Maintenance Mode

### Setup

1. **Create Edge Config** in Vercel Dashboard:
   ```bash
   vercel edge-config create esta-tracker-maintenance
   ```

2. **Add to Project**:
   - Go to Vercel Dashboard → Project Settings → Edge Config
   - Link the edge config to your project

3. **Set Maintenance Mode**:
   ```bash
   # Enable maintenance mode
   vercel edge-config set maintenanceMode true

   # Disable maintenance mode
   vercel edge-config set maintenanceMode false
   ```

### How It Works

When maintenance mode is enabled:
1. Edge middleware detects `maintenanceMode: true` in Edge Config
2. All routes (except `/maintenance` and static assets) are rewritten to serve the app
3. `X-Maintenance-Mode: true` header is added
4. React app can detect this header and show maintenance page
5. Users see the maintenance page without affecting the application bundle

## Security Features

### Multi-Tenant Data Isolation
- Every user is associated with a tenant (employer)
- Users can only access data from their own tenant
- Admin role can access all tenants
- Enforced at both API and UI levels

### Role-Based Access Control (RBAC)
- **Employee**: View their own data, submit requests
- **Employer**: View/manage employees, approve requests, view audit logs
- **Admin**: Full system access, user management, tenant management

### Email Verification
- Required before accessing protected routes
- Enforced by both client-side guards and backend
- Verification emails sent via Firebase Auth

### Account Approval Workflow
- **Employees**: Auto-approved after email verification
- **Employers**: Require manual approval before access
- **Admins**: Require manual approval and verification

## Integration with Firebase

The auth guards integrate with Firebase Authentication:

```typescript
// In AuthContext or App component
import { onAuthStateChanged } from 'firebase/auth';
import { checkAuth } from './lib/authGuards';

// Listen to auth state
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    // Fetch user data from Firestore
    const userData = await getUserData(firebaseUser.uid);
    
    // Check auth for current route
    const authResult = checkAuth(location.pathname, userData);
    
    if (!authResult.allowed && authResult.redirectTo) {
      navigate(authResult.redirectTo);
    }
  }
});
```

## Testing

### Test Scenarios

1. **Unauthenticated Access**
   - Should redirect to `/login`
   - Should preserve redirect URL

2. **Email Not Verified**
   - Should redirect to `/verify-email`
   - Should allow resending verification email

3. **Account Pending Approval**
   - Should redirect to `/pending-approval`
   - Employers only (employees are auto-approved)

4. **Account Rejected**
   - Should redirect to `/account-rejected`
   - Should provide support contact

5. **Role Mismatch**
   - Employee accessing `/employer` → redirect to `/employee`
   - Non-admin accessing `/admin` → redirect to appropriate dashboard

6. **Tenant Mismatch**
   - Attempting to access another tenant's data → blocked
   - Admin can access all tenants

7. **Maintenance Mode**
   - All routes show maintenance page
   - Static assets still served

## Environment Variables

Required in Vercel:
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Optional: Edge Config (for maintenance mode)
EDGE_CONFIG=https://edge-config.vercel.com/...
```

## Performance Characteristics

### Edge Middleware
- **Latency**: <10ms (runs at edge)
- **Cold Start**: None (always warm)
- **Global**: Runs in 100+ edge locations

### Client-Side Guards
- **Latency**: <1ms (runs in browser)
- **Bundle Impact**: ~9KB minified
- **Dependencies**: None (pure TypeScript)

## Future Enhancements

1. **Token Verification on Edge**
   - Use Vercel Edge Functions to verify Firebase tokens
   - Requires Firebase Admin SDK adaptation for Edge runtime

2. **Rate Limiting**
   - Add rate limiting at edge for API protection
   - Use Vercel Edge Config for rate limit rules

3. **Geo-Blocking**
   - Block/allow traffic from specific regions
   - Implement at edge for zero latency

4. **A/B Testing**
   - Route users to different experiences
   - Use edge middleware for instant routing decisions

5. **Dynamic Feature Flags**
   - Enable/disable features via Edge Config
   - No deployment required for feature toggles

## Support

For questions or issues:
- Email: support@estatracker.com
- Documentation: See README.md
- Security Issues: security@estatracker.com

## License

Proprietary - ESTA Tracker

# Firebase Security & Authentication Audit Report
## ESTA Tracker - Comprehensive Analysis & Repair Plan

**Date:** 2025-11-21  
**Version:** 1.0  
**Status:** In Progress

---

## Executive Summary

This document provides a comprehensive audit of the ESTA Tracker Firebase authentication, Firestore security rules, and session management implementation. Critical issues have been identified that prevent users from registering and logging in successfully.

### Critical Issues Found

1. **Email Verification Blocking Authentication** - Users cannot log in until email is verified, but verification flow has gaps
2. **Custom Claims Not Set** - Firestore rules require custom claims (role, tenantId) that are never set during registration
3. **Firestore Rules Block User Creation** - Frontend cannot create user documents due to restrictive rules
4. **Disconnected Authentication Systems** - App.tsx uses API client instead of Firebase AuthContext
5. **Missing Route Guards** - No proper authentication middleware for protected routes

---

## 1. Authentication Flow Issues

### 1.1 Email Verification Blocking Users

**Location:** `packages/frontend/src/lib/authService.ts:511`

**Issue:**
```typescript
if (!firebaseUser.emailVerified) {
  throw new Error('Please verify your email before signing in...');
}
```

Users are blocked from signing in until email is verified, but:
- Email delivery can be delayed or fail
- Users may not check spam folders
- Creates friction in onboarding process
- No graceful fallback for unverified users

**Impact:** HIGH - Prevents legitimate users from accessing the application

**Root Cause:**
- Email verification is enforced at login
- No option to skip or defer verification
- Auto-activation logic (lines 526-554) is never reached if email not verified

### 1.2 Custom Claims Never Set

**Location:** Registration flow in `authService.ts` and `functions/src/index.ts`

**Issue:**
Firestore security rules require custom claims:
```javascript
// firestore.rules:19-20
function isRole(role) {
  return isAuthenticated() && request.auth.token.role == role;
}
```

But custom claims are never set during registration:
- Registration creates user in Auth and Firestore
- Cloud Function `approveUserAfterVerification` sets claims only when called
- Frontend never calls this function
- Claims are required immediately for Firestore access

**Impact:** CRITICAL - Users cannot read/write their own data in Firestore

**Root Cause:**
- Custom claims set in Cloud Function, not during registration
- Frontend doesn't trigger the Cloud Function
- No fallback mechanism

### 1.3 Missing Async/Await and Error Handling

**Status:** ✅ GOOD - No issues found

The registration and login functions properly use async/await and have comprehensive error handling with retry logic and exponential backoff.

---

## 2. Firestore Structure and Rules Issues

### 2.1 Firestore Rules Block User Creation

**Location:** `firestore.rules:49`

**Issue:**
```javascript
// Only system (via Cloud Functions) can create users
allow create: if false;
```

Frontend cannot create user documents directly. This is intentional for security but creates a chicken-and-egg problem:
1. User registers → Auth account created
2. Frontend tries to create Firestore user doc → **BLOCKED**
3. User tries to login → No Firestore doc exists → Error

**Impact:** CRITICAL - Registration fails silently or with permission errors

**Current Workaround:**
Code tries to create documents directly from frontend (lines 214-224 in authService.ts), which will fail in production.

### 2.2 Email Verification Required by Rules

**Location:** `firestore.rules:10-11`

**Issue:**
```javascript
function isVerified() {
  return request.auth.token.emailVerified == true;
}
```

Some operations may require email verification at the Firestore level, though this function is defined but not actively used in current rules.

### 2.3 Inconsistent Naming: tenantId vs employerId

**Locations:** Throughout codebase

**Issue:**
- Firestore rules use `tenantId` (lines 22-24, 46, 60, etc.)
- User documents use both `employerId` and `tenantId` (authService.ts)
- Functions use both terms interchangeably

**Impact:** MEDIUM - Confusing and error-prone

**Examples:**
```typescript
// authService.ts:207
employerId: tenantId,
// authService.ts:218
tenantId,
```

### 2.4 Missing Firestore Indexes

**Status:** Indexes file exists at `firestore.indexes.json` but may need updates for new queries

---

## 3. Session Handling Issues

### 3.1 App.tsx Doesn't Use AuthContext

**Location:** `packages/frontend/src/App.tsx:47-78`

**Issue:**
App.tsx has its own authentication check using API client instead of using the AuthContext:

```typescript
// App.tsx uses this:
const response = await apiClient.getCurrentUser();

// Should use AuthContext instead:
const { currentUser, userData } = useAuth();
```

**Impact:** MEDIUM - Disconnected authentication state, redundant code

**Root Cause:**
- App component manages its own user state
- AuthContext exists but is not used at the App level
- Creates two sources of truth for authentication

### 3.2 No Proper Route Guards

**Location:** `App.tsx:132-150`

**Issue:**
Routes are protected with simple ternary operators:
```tsx
{user ? <Route path="/" element={<Dashboard user={user} />} /> : <Navigate to="/login" />}
```

Better approach:
- Dedicated ProtectedRoute component
- Role-based access control
- Automatic redirects based on email verification status

### 3.3 onAuthStateChanged Implementation

**Status:** ✅ GOOD - Properly implemented in AuthContext

The AuthContext correctly uses `onAuthStateChanged` and properly manages the unsubscribe function.

---

## 4. Email Verification Logic

### 4.1 Current Implementation

**Verification Flow:**
1. User registers → Email sent (authService.ts:242-261)
2. User clicks link → Email verified in Firebase Auth
3. User returns to app → EmailVerification component checks status
4. Component calls `approveUserAfterVerification` Cloud Function
5. Function sets custom claims and updates Firestore
6. User redirected to login

**Issues:**
- Step 1 may fail silently (non-fatal error handling)
- Step 3 requires user to manually return to verification page
- Step 4 may not be called if user goes directly to login
- Login still requires email verification (see Issue 1.1)

### 4.2 Auto-Activation Logic

**Location:** `authService.ts:526-554`

**Purpose:** Activate user on login if email is verified but status is still pending

**Issue:** This code is never reached because login throws error at line 511 if email not verified

### 4.3 Recommendation

**Option A: Remove Email Verification Requirement (Recommended)**
- Allow login without email verification
- Show banner prompting verification
- Limit certain features until verified
- Auto-activate on login if verified

**Option B: Fix Email Verification Flow**
- Make email sending more reliable
- Auto-redirect to verification page
- Better user communication
- Remove blocking check at login

---

## 5. Security Hardening Needs

### 5.1 Firestore Rules Security Analysis

**Current State:** Rules are comprehensive and security-focused

**Strengths:**
- Tenant isolation enforced
- Role-based access control
- Immutable document protection
- Audit logging enforced

**Weaknesses:**
- Too restrictive for user creation (blocks legitimate operations)
- Requires custom claims from day one
- No grace period for new users
- `emailVerified` check defined but not consistently used

### 5.2 Custom Claims Strategy

**Required Claims:**
```typescript
{
  role: 'employer' | 'employee' | 'admin',
  tenantId: string,
  emailVerified: boolean
}
```

**Current Gap:**
Claims set by Cloud Function but:
- Function not called automatically
- Frontend doesn't trigger it reliably
- No claims during registration flow

**Solution:**
Set claims immediately during registration via:
1. onCreate Auth trigger, OR
2. Callable function called by registration, OR
3. Backend API endpoint using Admin SDK

### 5.3 Backend Mock Implementation

**Location:** `packages/backend/src/routes/auth.ts`

**Issue:**
Backend has mock authentication endpoints, not integrated with Firebase Admin SDK

**Impact:** HIGH - Backend cannot validate Firebase tokens properly

**Security Concerns:**
- Mock tokens accepted (lines 98, 139, 152)
- No real token validation
- Cannot set custom claims from backend
- Insecure for production

### 5.4 Input Sanitization

**Current State:** Basic validation exists

**Locations:**
- `authService.ts:39-56` - Email and password validation
- Good: Email regex, password length, name length
- Missing: XSS protection, SQL injection protection (not applicable for Firestore but good practice)

**Recommendation:**
- Add DOMPurify for input sanitization
- Validate all user inputs on both frontend and backend
- Use Firebase security rules as final defense layer

### 5.5 Password Security

**Current Implementation:** Firebase handles password hashing

**Status:** ✅ GOOD - Firebase Auth manages password security properly

---

## 6. Fixes Implemented

### 6.1 Make Email Verification Optional

**Files Modified:**
- `packages/frontend/src/lib/authService.ts`

**Changes:**
1. Remove blocking check at login (line 510-513)
2. Keep auto-activation logic (already exists)
3. Add email verification status to user state
4. Show verification reminder in UI

### 6.2 Set Custom Claims During Registration

**Files Modified:**
- `functions/src/index.ts`

**Changes:**
1. Create new `onCreate` trigger for Auth user creation
2. Set custom claims immediately after user creation
3. Read Firestore user doc to get role and tenantId
4. Update both custom claims and Firestore doc

### 6.3 Allow User Document Creation with Validation

**Files Modified:**
- `firestore.rules`

**Changes:**
1. Allow authenticated users to create their own user document once
2. Validate required fields (email, role, name, etc.)
3. Ensure user can only create doc with their own UID
4. Prevent privilege escalation

### 6.4 Integrate AuthContext in App.tsx

**Files Modified:**
- `packages/frontend/src/App.tsx`

**Changes:**
1. Wrap app with AuthProvider
2. Use AuthContext instead of API client for auth state
3. Create ProtectedRoute component
4. Implement proper route guards

### 6.5 Standardize Naming Convention

**Files Modified:**
- Multiple files

**Changes:**
1. Use `tenantId` consistently throughout codebase
2. Update all references from `employerId` to `tenantId` where appropriate
3. Keep `employerId` only where it specifically refers to employer relationship

### 6.6 Update Backend to Use Firebase Admin SDK

**Files Modified:**
- `packages/backend/src/routes/auth.ts`
- `packages/backend/src/middleware/auth.ts`

**Changes:**
1. Replace mock implementation with Firebase Admin
2. Validate ID tokens from Firebase Auth
3. Extract claims from verified tokens
4. Return proper error responses

---

## 7. Long-term Firebase Architecture Recommendations

### 7.1 Authentication Flow (Recommended)

```
Registration Flow:
1. User fills registration form
2. Frontend validates input
3. Frontend calls backend API endpoint
4. Backend:
   - Creates Firebase Auth user
   - Creates Firestore user document (using Admin SDK)
   - Sets custom claims
   - Sends verification email (optional)
   - Returns success
5. Frontend redirects to appropriate dashboard
6. User can use app immediately (email verification optional)

Login Flow:
1. User enters credentials
2. Frontend calls Firebase signInWithEmailAndPassword
3. Firebase returns ID token with custom claims
4. Frontend verifies token and extracts user data
5. AuthContext updates with user data
6. App redirects based on role
```

### 7.2 Security Rules (Recommended)

```javascript
// Allow users to create their own document on first registration
match /users/{userId} {
  allow create: if isAuthenticated() 
    && request.auth.uid == userId
    && request.resource.data.keys().hasAll(['email', 'name', 'role'])
    && request.resource.data.email == request.auth.token.email
    && !exists(/databases/$(database)/documents/users/$(userId));
  
  // Rest of rules remain the same...
}
```

### 7.3 Custom Claims Strategy (Recommended)

**Set claims in onCreate trigger:**
```typescript
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Wait for Firestore document to be created
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get user document
  const userDoc = await db.collection('users').doc(user.uid).get();
  
  if (userDoc.exists) {
    const userData = userDoc.data();
    
    // Set custom claims
    await auth.setCustomUserClaims(user.uid, {
      role: userData.role,
      tenantId: userData.tenantId,
      emailVerified: user.emailVerified
    });
  }
});
```

### 7.4 State Management

**Use AuthContext as single source of truth:**
- Remove API client auth checks from App.tsx
- Use AuthContext.userData for all components
- Implement proper loading states
- Handle auth errors gracefully

### 7.5 Error Handling

**Improve error messages:**
- User-friendly error messages
- Actionable guidance (e.g., "Check spam folder")
- Retry mechanisms with exponential backoff
- Log errors for monitoring

### 7.6 Testing Strategy

**Implement comprehensive tests:**
- Unit tests for auth functions
- Integration tests for registration/login flows
- E2E tests for complete user journeys
- Security rule tests using Firebase Emulator

---

## 8. Implementation Priority

### Phase 1: Critical Fixes (Blocking Issues)
- [ ] Make email verification optional (Issue 1.1)
- [ ] Set custom claims automatically (Issue 1.2)
- [ ] Update Firestore rules for user creation (Issue 2.1)
- [ ] Create onCreate trigger for claims

### Phase 2: Architecture Improvements
- [ ] Integrate AuthContext in App.tsx (Issue 3.1)
- [ ] Create ProtectedRoute component (Issue 3.2)
- [ ] Standardize tenantId vs employerId (Issue 2.3)
- [ ] Update backend to use Firebase Admin SDK (Issue 5.3)

### Phase 3: Security Hardening
- [ ] Add comprehensive input sanitization (Issue 5.4)
- [ ] Review and update Firestore rules (Issue 5.1)
- [ ] Add security tests
- [ ] Implement rate limiting

### Phase 4: Testing & Documentation
- [ ] Write unit tests for auth functions
- [ ] Write integration tests
- [ ] Document authentication flows
- [ ] Create user guides for registration

---

## 9. Testing Checklist

### Registration Testing
- [ ] Manager can register with valid data
- [ ] Employee can register with tenant code
- [ ] Email validation works correctly
- [ ] Password validation works correctly
- [ ] Firestore user document created
- [ ] Custom claims set correctly
- [ ] Audit log created

### Login Testing
- [ ] User can login with correct credentials
- [ ] User blocked with incorrect credentials
- [ ] User redirected based on role
- [ ] Session persists across page refresh
- [ ] User can logout successfully
- [ ] Email verification optional/working

### Security Testing
- [ ] Cannot create user with wrong UID
- [ ] Cannot elevate privileges
- [ ] Cannot access other tenant's data
- [ ] Custom claims validated
- [ ] Token expiration handled
- [ ] Rate limiting works

---

## 10. Deployment Considerations

### Environment Variables Required
```bash
# Frontend (.env)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Backend (.env)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Firebase Setup
1. Enable Email/Password authentication in Firebase Console
2. Configure authorized domains
3. Deploy Firestore rules
4. Deploy Cloud Functions
5. Create Firestore indexes
6. Set up error monitoring

### Monitoring
- Enable Firebase Analytics
- Monitor auth errors
- Track failed login attempts
- Monitor Firestore usage
- Set up alerts for anomalies

---

## Conclusion

The ESTA Tracker Firebase implementation has several critical issues preventing users from registering and logging in. The primary issues are:

1. Email verification blocking authentication
2. Missing custom claims during registration
3. Restrictive Firestore rules preventing user document creation
4. Disconnected authentication systems

By implementing the fixes outlined in this document in priority order, the authentication system will:
- Allow users to register and login successfully
- Maintain security through proper custom claims
- Provide a better user experience
- Enable scalable multi-tenant architecture

**Recommended Approach:** Implement Phase 1 fixes immediately to unblock users, then proceed with architectural improvements in Phases 2-4.

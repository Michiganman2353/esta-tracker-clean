# ESTA Tracker Registration & Verification System

## Overview

This document describes the complete Firebase-based registration and email verification system implemented for ESTA Tracker. The system provides automated user registration, email verification, tenant management, and role-based access control.

## Architecture

### Frontend (React + Firebase)
- **Firebase SDK**: Authentication, Firestore, and Storage
- **AuthContext**: Global authentication state management
- **Email Verification Component**: Auto-detecting verification status
- **Auth Service**: Centralized authentication operations

### Backend (Firebase Functions + Firestore)
- **Cloud Functions**: Auto-approval, custom claims, and utilities
- **Firestore**: User, tenant, and audit data storage
- **Security Rules**: Role-based data access control
- **Storage Rules**: Document upload permissions

## User Registration Flows

### Manager/Employer Registration

1. **User fills registration form**:
   - Full name
   - Email address
   - Company name
   - Employee count
   - Password (min 8 characters)

2. **System creates account**:
   ```typescript
   // Creates Firebase Auth user
   createUserWithEmailAndPassword(auth, email, password)
   
   // Generates unique tenant code (8 chars)
   tenantCode = generateTenantCode() // e.g., "ABC12XYZ"
   
   // Determines employer size (Michigan ESTA law)
   employerSize = employeeCount >= 10 ? 'large' : 'small'
   
   // Creates tenant document
   tenants/{tenantId}
     - companyName
     - tenantCode
     - size (small/large)
     - employeeCount
     - ownerId
     - status: "pending"
     - createdAt
   
   // Creates user document
   users/{userId}
     - email
     - name
     - role: "employer"
     - employerId (tenantId)
     - employerSize
     - status: "pending"
     - emailVerified: false
   ```

3. **Email verification sent**:
   ```typescript
   sendEmailVerification(firebaseUser)
   ```
   - Firebase sends verification link to user's email
   - Link format: `https://{project}.firebaseapp.com/__/auth/action?...`

4. **User sees verification screen**:
   - Instructions to check email
   - Auto-checks verification status every 5 seconds
   - Manual "I've Verified" button
   - "Resend Email" button

5. **After email verified**:
   - Auto-redirects to login page with success message
   - Account status updated to "active"
   - Custom claims set for authorization

### Employee Registration

1. **User fills registration form**:
   - Full name
   - Email address
   - Company code (provided by employer)
   - Password

2. **System validates tenant code**:
   ```typescript
   // Find tenant by code
   const tenant = await getTenantByCode(tenantCode)
   
   if (!tenant) {
     throw new Error('Invalid company code')
   }
   ```

3. **System creates account**:
   ```typescript
   // Creates Firebase Auth user
   createUserWithEmailAndPassword(auth, email, password)
   
   // Creates user document linked to tenant
   users/{userId}
     - email
     - name
     - role: "employee"
     - employerId (from tenant)
     - employerSize (from tenant)
     - status: "pending"
     - emailVerified: false
     - tenantId
   ```

4. **Email verification process** (same as manager)

5. **After email verified**:
   - Auto-activated (no manual approval needed)
   - Can log in immediately

## Email Verification Flow

### Sending Verification Email

```typescript
// Automatic after registration
await sendEmailVerification(user, {
  url: window.location.origin + '/login?verified=true',
  handleCodeInApp: false
})
```

### Detecting Verification

**Method 1: Auto-Check (Polling)**
```typescript
// Checks every 5 seconds for up to 2 minutes
useEffect(() => {
  const interval = setInterval(async () => {
    await reload(auth.currentUser)
    if (auth.currentUser.emailVerified) {
      // Redirect to login
      navigate('/login?verified=true')
    }
  }, 5000)
}, [])
```

**Method 2: Manual Check**
```typescript
// User clicks "I've Verified" button
async function checkVerification() {
  await reload(auth.currentUser)
  if (auth.currentUser.emailVerified) {
    // Call Cloud Function to activate account
    const result = await approveUserAfterVerification()
    // Redirect to dashboard
  }
}
```

**Method 3: onAuthStateChanged**
```typescript
// Listens for auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user && user.emailVerified) {
    // Update UI and fetch user data
  }
})
```

## Auto-Approval System

### Cloud Function: `approveUserAfterVerification`

```typescript
export const approveUserAfterVerification = functions.https.onCall(
  async (data, context) => {
    const uid = context.auth.uid
    const userRecord = await auth.getUser(uid)
    
    if (!userRecord.emailVerified) {
      throw new Error('Email not verified')
    }
    
    // Update Firestore
    await db.collection('users').doc(uid).update({
      status: 'active',
      emailVerified: true,
      verifiedAt: serverTimestamp()
    })
    
    // Set custom claims
    await auth.setCustomUserClaims(uid, {
      role: userData.role,
      tenantId: userData.tenantId,
      emailVerified: true
    })
    
    // Create audit log
    await db.collection('auditLogs').add({
      userId: uid,
      action: 'email_verified',
      timestamp: serverTimestamp()
    })
    
    return { success: true }
  }
)
```

## Login Flow

### Standard Login

```typescript
async function signIn(email, password) {
  // Sign in with Firebase
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  
  // Check email verification
  if (!userCredential.user.emailVerified) {
    throw new Error('Please verify your email first')
  }
  
  // Get user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
  const userData = userDoc.data()
  
  // Check account status
  if (userData.status === 'pending') {
    throw new Error('Account pending approval')
  }
  
  if (userData.status === 'rejected') {
    throw new Error('Account has been rejected')
  }
  
  return userData
}
```

### After Successful Login

- User redirected to appropriate dashboard:
  - Employers → `/employer`
  - Employees → `/employee`
- AuthContext provides user data to entire app
- Custom claims checked for authorization

## Tenant Management

### Tenant Code Generation

```typescript
function generateTenantCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
```

### Tenant Structure

```
tenants/{tenantId}
  - id: string
  - companyName: string
  - tenantCode: string (unique, 8 chars)
  - size: 'small' | 'large'
  - employeeCount: number
  - ownerId: string (Firebase UID)
  - status: 'pending' | 'active'
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Linking Employees to Tenants

```typescript
// Employee provides tenant code during registration
const tenant = await getTenantByCode(tenantCode)

// User document includes tenant reference
users/{userId}
  - tenantId: tenant.id
  - employerId: tenant.id
  - employerSize: tenant.size
```

## Security Implementation

### Firestore Security Rules

**Key Principles:**
1. Users can only read their own data
2. Employers can read all users in their tenant
3. Employees can only read their own records
4. All writes require custom claims verification

**Example Rules:**
```javascript
// Users can read their own document
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  
  // Employers can read users in their tenant
  allow read: if request.auth.token.role == 'employer' && 
                 request.auth.token.tenantId == resource.data.tenantId;
}

// Sick time requests
match /sickTimeRequests/{requestId} {
  // Employees can create requests
  allow create: if request.auth.token.role == 'employee' &&
                   request.resource.data.userId == request.auth.uid;
  
  // Employers can approve/deny
  allow update: if request.auth.token.role == 'employer' &&
                   request.auth.token.tenantId == resource.data.employerId;
}
```

### Storage Security Rules

```javascript
// Employee documents (medical notes, etc.)
match /employee-documents/{tenantId}/{userId}/{fileName} {
  // Employees can upload their own documents
  allow write: if request.auth.uid == userId &&
                  request.auth.token.tenantId == tenantId;
  
  // Employers can read all documents in their tenant
  allow read: if request.auth.token.role == 'employer' &&
                 request.auth.token.tenantId == tenantId;
}
```

## Custom Claims

### What are Custom Claims?

Custom claims are JWT token properties that provide role-based authorization without additional database queries.

### Setting Custom Claims

```typescript
// Set during email verification approval
await auth.setCustomUserClaims(uid, {
  role: 'employer' | 'employee',
  tenantId: 'tenant_abc123',
  emailVerified: true
})
```

### Accessing Custom Claims

**Frontend:**
```typescript
// Get ID token with custom claims
const idTokenResult = await user.getIdTokenResult()
const role = idTokenResult.claims.role
const tenantId = idTokenResult.claims.tenantId
```

**Security Rules:**
```javascript
// Access in Firestore rules
request.auth.token.role == 'employer'
request.auth.token.tenantId == 'tenant_abc123'
```

## Audit Logging

All authentication events are logged for compliance:

```typescript
auditLogs/{logId}
  - userId: string
  - employerId: string
  - action: 'registration' | 'email_verified' | 'login' | 'logout'
  - details: object
  - timestamp: timestamp
  - performedBy: string (optional)
```

### Logged Events

- User registration (manager/employee)
- Email verification
- Login attempts (success/failure)
- Account status changes
- Custom claims updates
- Password resets

## Error Handling

### Registration Errors

| Error Code | User Message |
|------------|--------------|
| `auth/email-already-in-use` | "This email is already registered" |
| `auth/invalid-email` | "Invalid email address format" |
| `auth/weak-password` | "Password too weak, use at least 8 characters" |
| `auth/network-request-failed` | "Unable to connect to server" |

### Login Errors

| Error Code | User Message |
|------------|--------------|
| `auth/user-not-found` | "Invalid email or password" |
| `auth/wrong-password` | "Invalid email or password" |
| `auth/too-many-requests` | "Too many login attempts, try again later" |
| `auth/user-disabled` | "This account has been disabled" |

### Verification Errors

| Error Code | User Message |
|------------|--------------|
| `auth/expired-action-code` | "Verification link expired, request a new one" |
| `auth/invalid-action-code` | "Invalid verification link" |
| `auth/user-not-found` | "User account not found" |

## Testing Checklist

### Manager Registration
- [ ] Can register with valid data
- [ ] Receives verification email
- [ ] Tenant code generated
- [ ] Company document created
- [ ] User document created with status "pending"
- [ ] Cannot login before email verification
- [ ] Can login after email verification
- [ ] Status changes to "active" after verification
- [ ] Custom claims set correctly

### Employee Registration
- [ ] Can register with valid tenant code
- [ ] Validation fails with invalid tenant code
- [ ] Receives verification email
- [ ] Linked to correct tenant
- [ ] User document created with status "pending"
- [ ] Cannot login before email verification
- [ ] Can login after email verification
- [ ] Status changes to "active" after verification
- [ ] Custom claims set correctly

### Email Verification
- [ ] Verification email sent successfully
- [ ] Auto-check detects verification
- [ ] Manual check button works
- [ ] Resend email button works
- [ ] Rate limiting prevents spam
- [ ] Expired links show appropriate error
- [ ] Invalid links show appropriate error

### Login
- [ ] Cannot login without verification
- [ ] Shows appropriate error for unverified email
- [ ] Success message shown after verification
- [ ] Redirects to correct dashboard
- [ ] Auth state persists across page refreshes
- [ ] Token refresh works correctly

### Security
- [ ] Users can only see their own data
- [ ] Employers can see all tenant data
- [ ] Employees cannot access other tenants
- [ ] Audit logs created for all actions
- [ ] Custom claims required for sensitive operations
- [ ] Storage rules prevent unauthorized uploads

## Deployment Guide

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete deployment instructions.

### Quick Start

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login
   firebase login
   ```

2. **Configure Environment**
   ```bash
   # Frontend (.env.local)
   VITE_FIREBASE_API_KEY=your-key
   VITE_FIREBASE_AUTH_DOMAIN=your-domain
   VITE_FIREBASE_PROJECT_ID=your-project
   ```

3. **Deploy Functions**
   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   firebase deploy --only functions
   ```

4. **Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

## Troubleshooting

### "Firebase not configured" Error

**Cause**: Environment variables not set
**Solution**: 
1. Create `.env.local` in `/packages/frontend`
2. Add all `VITE_FIREBASE_*` variables
3. Restart dev server

### Email Verification Not Working

**Cause**: Firebase email templates not configured
**Solution**:
1. Go to Firebase Console → Authentication → Templates
2. Customize email verification template
3. Ensure action URL is correct

### Users Not Auto-Approved

**Cause**: Cloud Function not deployed or failing
**Solution**:
1. Check function logs: `firebase functions:log`
2. Redeploy functions: `firebase deploy --only functions`
3. Check function permissions in Firebase Console

### Tenant Code Validation Fails

**Cause**: Firestore indexes not created
**Solution**:
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Wait for index creation (can take a few minutes)
3. Check index status in Firebase Console

## Future Enhancements

### Planned Features

1. **Employer Approval Flow**
   - Manual approval option for employee registrations
   - Email notification to employers when employees register
   - Approval/rejection UI in employer dashboard

2. **Two-Factor Authentication**
   - SMS verification
   - Authenticator app support
   - Backup codes

3. **Social Sign-In**
   - Google Sign-In
   - Microsoft Azure AD (for enterprise)
   - Apple Sign-In

4. **Account Recovery**
   - Password reset flow
   - Account reactivation
   - Email change verification

5. **Advanced Security**
   - Session management
   - Device tracking
   - Suspicious activity detection
   - IP whitelisting for employers

## Support

For questions or issues:
- Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- Review Firebase Console logs
- Test with Firebase Emulators
- Contact development team

## License

Copyright © 2024 ESTA Tracker. All rights reserved.

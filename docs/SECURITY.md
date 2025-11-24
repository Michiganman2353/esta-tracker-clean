# Security Best Practices - ESTA Tracker

This document outlines security measures, best practices, and guidelines for the ESTA Tracker application.

## Table of Contents

1. [Environment Variables & Secrets](#environment-variables--secrets)
2. [Backend Security](#backend-security)
3. [Frontend Security](#frontend-security)
4. [Firebase Security](#firebase-security)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Protection](#data-protection)
7. [API Security](#api-security)
8. [CI/CD Security](#cicd-security)
9. [Security Auditing](#security-auditing)

## Environment Variables & Secrets

### Critical Rules

1. **NEVER commit secrets to source code**
   - All `.env` files are gitignored
   - Use `.env.example` as template only
   - Secrets must be stored in:
     - GitHub Secrets (for CI/CD)
     - Vercel Environment Variables (for deployments)
     - Local `.env` files (for development)

2. **Frontend Environment Variables**
   - Must use `VITE_` prefix
   - Are exposed to client-side code
   - Should never contain secrets
   - Example: `VITE_FIREBASE_API_KEY` (public key, not secret)

3. **Backend Environment Variables**
   - No prefix required
   - Never exposed to client
   - Can contain secrets
   - Example: `JWT_SECRET`, `DATABASE_URL`

### Configuration Locations

**GitHub Actions:**
```
Repository Settings → Secrets and variables → Actions
```

**Vercel:**
```
Project Settings → Environment Variables
Configure separately for: Development, Preview, Production
```

**Local Development:**
```bash
# Copy template and fill in values
cp .env.example .env

# Never commit .env file
git status  # Should show .env as ignored
```

## Backend Security

### Helmet Configuration

Helmet is configured to set secure HTTP headers:

```typescript
app.use(helmet());
```

**Headers Set:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- Content Security Policy (CSP)

### CORS Configuration

CORS is strictly configured to allow only trusted origins:

```typescript
const allowedOrigins = [
  'http://localhost:5173',      // Local dev
  'http://localhost:3000',      // Alternative local
  'https://estatracker.com',    // Production
  'https://www.estatracker.com', // Production www
  process.env.CORS_ORIGIN,      // Custom override
];

// Also allows *.vercel.app for preview deployments
```

**Important:** Production domains must be explicitly listed.

### Rate Limiting

Multiple rate limiters protect against abuse:

**General API Limiter:**
- 100 requests per 15 minutes per IP
- Applied to all endpoints except health checks

**Authentication Limiter:**
- 5 requests per 15 minutes per IP/email
- Protects login, signup, password reset
- Prevents brute force attacks

**Sensitive Operations Limiter:**
- 20 requests per 15 minutes
- Profile updates, settings changes

**Upload Limiter:**
- 10 file uploads per hour
- Prevents storage abuse

**Export Limiter:**
- 3 exports per hour
- Prevents resource exhaustion

### Input Validation

All API inputs are validated using Zod schemas:

```typescript
import { z } from 'zod';

const employerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  employeeCount: z.number().int().positive(),
});

// In route handler
const validated = employerSchema.parse(req.body);
```

**Never trust client input:**
- Validate type, format, range
- Sanitize strings
- Check for SQL injection patterns
- Validate file types and sizes

### SQL Injection Prevention

Use parameterized queries with PostgreSQL:

```typescript
// ✅ SAFE - Parameterized query
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ UNSAFE - String interpolation
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### XSS Prevention

- All data is JSON-encoded by Express
- React escapes all content by default
- Never use `dangerouslySetInnerHTML` without sanitization
- Validate and sanitize rich text input

## Frontend Security

### Firebase API Key

The Firebase API key (`VITE_FIREBASE_API_KEY`) is **not a secret**:
- It's meant to be public
- Security is enforced by Firebase Security Rules
- Rate limiting and quotas protect against abuse

### Content Security Policy

Configure CSP headers to prevent XSS:

```typescript
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://firestore.googleapis.com"],
  },
});
```

### Local Storage Security

**Never store sensitive data in localStorage:**
- No passwords
- No unencrypted PII
- No JWT tokens (use httpOnly cookies)

**Use sessionStorage for sensitive UI state:**
```typescript
// Cleared when tab closes
sessionStorage.setItem('temp-data', data);
```

### Encryption

For client-side encryption, use the crypto library:

```typescript
import { encryptHybrid } from '@esta-tracker/encryption';

const encrypted = await encryptHybrid(
  sensitiveData,
  publicKey
);
```

## Firebase Security

### Security Rules

Firestore and Storage rules enforce access control:

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Employers can only read/write their own data
    match /employers/{employerId} {
      allow read, write: if request.auth.uid == employerId;
    }
    
    // Employees can only read their own data
    match /employees/{employeeId} {
      allow read: if request.auth.uid == employeeId;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Only authenticated users can upload
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}
```

### App Check (Recommended for Production)

Firebase App Check protects against abuse:

1. **Setup in Firebase Console:**
   - Enable App Check
   - Register your domain
   - Configure reCAPTCHA v3

2. **Initialize in app:**
```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true,
});
```

### Firebase Admin SDK

Backend uses Admin SDK with service account:

```typescript
// ✅ Secure - Service account from environment
import { initializeApp, cert } from 'firebase-admin/app';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT!
);

initializeApp({
  credential: cert(serviceAccount),
});
```

## Authentication & Authorization

### JWT Best Practices

1. **Short expiration times:**
```typescript
const token = jwt.sign(payload, secret, {
  expiresIn: '1h', // Expire after 1 hour
});
```

2. **Secure token storage:**
```typescript
// Use httpOnly cookies, not localStorage
res.cookie('token', token, {
  httpOnly: true,
  secure: true,      // HTTPS only
  sameSite: 'strict',
  maxAge: 3600000,   // 1 hour
});
```

3. **Token verification:**
```typescript
const decoded = jwt.verify(token, secret);
```

### Password Security

1. **Use bcrypt for hashing:**
```typescript
import bcrypt from 'bcrypt';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

2. **Password requirements:**
- Minimum 8 characters
- Require uppercase, lowercase, number
- Check against common passwords
- Implement password strength meter

### Multi-Factor Authentication

Consider implementing MFA for:
- Employer accounts
- Admin accounts
- Sensitive operations

Firebase Authentication supports:
- SMS verification
- Email verification
- TOTP apps (Google Authenticator)

## Data Protection

### PII Handling

Personal Identifiable Information (PII) must be:
1. **Minimized** - Only collect what's necessary
2. **Encrypted** - At rest and in transit
3. **Access-controlled** - Role-based access
4. **Audited** - Log all access
5. **Deletable** - Support data deletion requests

### Encryption at Rest

Use Google Cloud KMS for encryption:

```typescript
import { encryptWithKMS } from './services/kmsService';

const encrypted = await encryptWithKMS(sensitiveData);
```

### HTTPS Enforcement

**All communication must use HTTPS:**
- Vercel enforces HTTPS automatically
- Firebase enforces HTTPS for all connections
- Backend should redirect HTTP to HTTPS in production

```typescript
// Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## API Security

### API Versioning

Use versioned endpoints:
```
/api/v1/auth/login
/api/v2/auth/login
```

Benefits:
- Breaking changes don't affect existing clients
- Gradual migration path
- Better backwards compatibility

### Request Validation

Validate all request parameters:

```typescript
// Query parameters
const page = parseInt(req.query.page) || 1;
if (page < 1 || page > 1000) {
  return res.status(400).json({ error: 'Invalid page number' });
}

// Headers
const contentType = req.header('Content-Type');
if (contentType !== 'application/json') {
  return res.status(415).json({ error: 'Unsupported media type' });
}
```

### Error Handling

Never expose internal errors to clients:

```typescript
// ❌ BAD - Exposes internal details
res.status(500).json({ error: error.message });

// ✅ GOOD - Generic error message
res.status(500).json({ error: 'Internal server error' });

// Log full error internally
console.error('Database error:', error);
```

### Response Headers

Set secure response headers:

```typescript
res.set({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store',
});
```

## CI/CD Security

### GitHub Actions Security

1. **Use GitHub Secrets** for all credentials
2. **Minimal permissions** for workflows
3. **Pin action versions** to specific commits
4. **Review third-party actions** before using

```yaml
permissions:
  contents: read  # Minimal permissions

steps:
  - uses: actions/checkout@v4  # Pinned version
  
  - name: Use secret
    env:
      API_KEY: ${{ secrets.API_KEY }}  # From GitHub Secrets
```

### Dependency Security

1. **Regular audits:**
```bash
npm audit
npm audit fix
```

2. **Automated scanning in CI:**
```yaml
- name: Security Audit
  run: npm audit --audit-level=moderate
```

3. **Dependabot configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Secret Scanning

GitHub automatically scans for exposed secrets:
- API keys
- Private keys
- Passwords
- Tokens

**If a secret is exposed:**
1. Rotate it immediately
2. Remove it from git history
3. Investigate potential unauthorized access

## Security Auditing

### Logging

Log security-relevant events:

```typescript
// Authentication attempts
console.log('Login attempt:', { 
  userId, 
  ip: req.ip, 
  success: true,
  timestamp: new Date(),
});

// Authorization failures
console.warn('Unauthorized access attempt:', {
  userId,
  resource,
  ip: req.ip,
});

// Data modifications
console.log('Data update:', {
  userId,
  resource,
  action: 'update',
  timestamp: new Date(),
});
```

**Never log:**
- Passwords
- API keys
- Session tokens
- Sensitive PII

### Monitoring

Monitor for suspicious activity:
- Failed login attempts
- Rate limit violations
- Unusual data access patterns
- Large data exports
- API errors

### Incident Response

**If a security incident occurs:**

1. **Contain** - Revoke compromised credentials
2. **Investigate** - Review logs and access patterns
3. **Notify** - Inform affected users if required
4. **Remediate** - Fix vulnerability
5. **Document** - Record incident and response

### Regular Security Reviews

**Weekly:**
- Review npm audit results
- Check for security updates

**Monthly:**
- Review access logs
- Update dependencies
- Test security controls

**Quarterly:**
- Full security audit
- Penetration testing
- Review security policies

## Security Checklist

Use this checklist for new features:

- [ ] Input validation implemented
- [ ] Output encoding applied
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Rate limiting applied
- [ ] Secrets not in code
- [ ] HTTPS enforced
- [ ] Error handling doesn't leak info
- [ ] Logging doesn't include secrets
- [ ] Security headers configured
- [ ] Dependencies audited
- [ ] Tests include security scenarios

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

## Reporting Security Issues

**Do not create public GitHub issues for security vulnerabilities.**

Instead, email security concerns to: [security contact email]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We take security seriously and will respond within 48 hours.

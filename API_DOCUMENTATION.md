# ESTA Tracker API Documentation

## Overview

This document provides comprehensive documentation for the ESTA Tracker authentication API endpoints deployed as Vercel serverless functions.

## Base URL

- **Development:** `http://localhost:3000` (when using `vercel dev`)
- **Production:** `https://your-domain.vercel.app`

## Authentication Endpoints

### 1. Manager Registration

Register a new manager/employer account.

**Endpoint:** `POST /api/v1/auth/register/manager`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "securepassword123",
  "companyName": "Acme Corporation",
  "employeeCount": 25
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration completed successfully.",
  "token": "firebase-custom-token",
  "user": {
    "id": "user-uid",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "employer",
    "employerId": "company-1234567890",
    "employerSize": "large",
    "companyName": "Acme Corporation",
    "employeeCount": 25,
    "status": "approved",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields or invalid data
  ```json
  {
    "message": "Name, email, password, company name, and employee count are required"
  }
  ```

- `409 Conflict` - Email already registered
  ```json
  {
    "message": "Email already registered"
  }
  ```

- `500 Internal Server Error` - Server error
  ```json
  {
    "message": "Registration failed. Please try again later.",
    "error": "Error details"
  }
  ```

**Business Logic:**

- Employer size is automatically determined:
  - `small`: < 10 employees (40 hours max paid sick time, 32 hours unpaid)
  - `large`: >= 10 employees (72 hours max paid sick time)

---

### 2. Employee Registration

Register a new employee account.

**Endpoint:** `POST /api/v1/auth/register/employee`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration completed successfully.",
  "token": "firebase-custom-token",
  "user": {
    "id": "user-uid",
    "email": "jane@example.com",
    "name": "Jane Smith",
    "role": "employee",
    "employerSize": "small",
    "status": "approved",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing required fields
  ```json
  {
    "message": "Name, email, and password are required"
  }
  ```

- `409 Conflict` - Email already registered
  ```json
  {
    "message": "Email already registered"
  }
  ```

---

### 3. Login

Authenticate an existing user.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body (Option 1 - Development):**
```json
{
  "email": "john@company.com",
  "password": "securepassword123"
}
```

**Request Body (Option 2 - Production - Recommended):**
```json
{
  "idToken": "firebase-id-token-from-client-sdk"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "firebase-custom-token",
  "user": {
    "id": "user-uid",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "employer",
    "employerId": "company-1234567890",
    "employerSize": "large",
    "companyName": "Acme Corporation",
    "employeeCount": 25,
    "status": "approved",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Missing credentials
  ```json
  {
    "message": "Email and password or ID token are required"
  }
  ```

- `401 Unauthorized` - Invalid credentials
  ```json
  {
    "message": "Invalid email or password"
  }
  ```

- `404 Not Found` - User not found in Firestore
  ```json
  {
    "message": "User not found"
  }
  ```

---

### 4. Get Current User

Retrieve the currently authenticated user's information.

**Endpoint:** `GET /api/v1/auth/me`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "user-uid",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "employer",
    "employerId": "company-1234567890",
    "employerSize": "large",
    "companyName": "Acme Corporation",
    "employeeCount": 25,
    "status": "approved",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
  ```json
  {
    "message": "Unauthorized"
  }
  ```

- `404 Not Found` - User not found
  ```json
  {
    "message": "User not found"
  }
  ```

---

### 5. Logout

Logout the current user (handled client-side).

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note:** Actual logout is handled on the client side by the Firebase Auth SDK. This endpoint exists for consistency and future extensions.

---

## CORS Configuration

All API endpoints support the following origins:

- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Next.js/Vercel dev)
- `https://estatracker.com`
- `https://www.estatracker.com`
- `*.vercel.app` (Vercel preview deployments)

**Preflight Requests:**

All endpoints support `OPTIONS` requests for CORS preflight checks.

---

## Error Handling

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `405` - Method Not Allowed (wrong HTTP method)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error (server-side error)

### Error Response Format

```json
{
  "message": "Human-readable error message",
  "error": "Optional detailed error information"
}
```

---

## Environment Variables Required

### Backend/API Functions

- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin SDK service account JSON (production)
- `ALLOWED_ORIGIN` - Allowed CORS origin (production domain)

### Local Development

Place a `.serviceAccountKey.json` file in the project root with your Firebase service account credentials. This is automatically detected and used by the API functions.

---

## Testing the API

### Using curl

**Register a Manager:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register/manager \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@company.com",
    "password": "securepass123",
    "companyName": "Acme Corp",
    "employeeCount": 25
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@company.com",
    "password": "securepass123"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Using the Frontend

The frontend API client (`packages/frontend/src/lib/api.ts`) automatically handles all API requests with proper error handling and retries.

---

## Firebase Integration

### Authentication Flow

1. **Registration:** API creates Firebase Auth user and stores profile in Firestore
2. **Token Generation:** API generates a custom token for immediate login
3. **Client Authentication:** Frontend uses the custom token to sign in with Firebase Client SDK
4. **Subsequent Requests:** Client includes Firebase ID token in Authorization header

### Firestore Collections

**users:**
```javascript
{
  id: string,
  email: string,
  name: string,
  role: 'employer' | 'employee',
  employerId?: string,
  employerSize: 'small' | 'large',
  companyName?: string,
  employeeCount?: number,
  status: 'approved' | 'pending' | 'suspended',
  createdAt: string,
  updatedAt: string
}
```

**employers:**
```javascript
{
  id: string,
  name: string,
  size: 'small' | 'large',
  employeeCount: number,
  ownerId: string,
  status: 'active' | 'inactive',
  createdAt: string,
  updatedAt: string
}
```

---

## Security Considerations

1. **Password Requirements:** Minimum 8 characters
2. **HTTPS Only:** All production traffic must use HTTPS
3. **Token Expiration:** Firebase ID tokens expire after 1 hour
4. **CORS:** Strictly configured to prevent unauthorized access
5. **Service Account:** Never commit Firebase service account credentials
6. **Rate Limiting:** Consider implementing rate limiting for production

---

## Troubleshooting

### Common Issues

**"FIREBASE_SERVICE_ACCOUNT not configured"**
- Ensure `.serviceAccountKey.json` exists in project root (local)
- Or set `FIREBASE_SERVICE_ACCOUNT` environment variable (production)

**"CORS error"**
- Check that your origin is in the allowed origins list
- Ensure the API functions include proper CORS headers

**"Token expired"**
- Firebase ID tokens expire after 1 hour
- Implement token refresh in the client

**"User not found in Firestore"**
- Ensure user document was created during registration
- Check Firestore security rules

---

## Development Workflow

1. **Local Testing:**
   ```bash
   # Start Vercel dev server
   vercel dev
   
   # API available at http://localhost:3000/api/v1/auth/*
   ```

2. **Frontend Development:**
   ```bash
   # Start Vite dev server
   npm run dev:frontend
   
   # Frontend connects to http://localhost:3000/api
   ```

3. **Production Deployment:**
   ```bash
   # Deploy to Vercel
   npm run build
   vercel --prod
   ```

---

## API Client Usage (Frontend)

```typescript
import { apiClient } from './lib/api';

// Register Manager
const response = await apiClient.registerManager({
  name: 'John Doe',
  email: 'john@company.com',
  password: 'securepass123',
  companyName: 'Acme Corp',
  employeeCount: 25
});

// Login
const loginResponse = await apiClient.login('john@company.com', 'securepass123');

// Get Current User
const user = await apiClient.getCurrentUser();
```

---

## Future Enhancements

- [ ] Add password reset endpoint
- [ ] Implement email verification flow
- [ ] Add 2FA support
- [ ] Implement role-based access control (RBAC)
- [ ] Add rate limiting
- [ ] Add request logging and monitoring
- [ ] Implement refresh token rotation
- [ ] Add webhook support for registration events

---

## Support

For issues or questions:
- Check GitHub Issues
- Review Firebase Console logs
- Check Vercel deployment logs
- Review error messages in browser console

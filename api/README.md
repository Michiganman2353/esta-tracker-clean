# ESTA Tracker API - Vercel Serverless Functions

This directory contains Vercel serverless functions that provide backend API endpoints for the ESTA Tracker application.

## Endpoints

### POST /api/register

Register a new user (manager or employee).

**Request Body:**
```json
{
  "type": "manager" | "employee",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  
  // For manager registration:
  "companyName": "Company LLC",
  "employeeCount": 10,
  
  // For employee registration (one required):
  "tenantCode": "ABC12XYZ",
  "employerEmail": "employer@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user-uid",
  "tenantCode": "ABC12XYZ", // Only for manager
  "needsVerification": true,
  "message": "Account created successfully. Please verify your email."
}
```

**Error Codes:**
- `400` - Missing required fields
- `404` - Invalid tenant code (employee registration)
- `409` - Email already exists
- `500` - Server error

### POST /api/verifyUser

Verify user's email and activate their account.

**Request Body:**
```json
{
  "uid": "user-uid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account activated successfully",
  "emailVerified": true,
  "status": "active",
  "user": {
    "id": "user-uid",
    "email": "john@example.com",
    "role": "employer" | "employee",
    "tenantId": "tenant-id"
  }
}
```

**Error Codes:**
- `400` - Email not verified yet
- `404` - User not found
- `500` - Server error

### GET /api/checkUserStatus

Check user's verification and approval status.

**Query Parameters:**
- `uid` - User ID (required)

**Response:**
```json
{
  "success": true,
  "emailVerified": true,
  "status": "active" | "pending" | "rejected",
  "approved": true,
  "user": {
    "id": "user-uid",
    "email": "john@example.com",
    "role": "employer" | "employee",
    "tenantId": "tenant-id",
    "emailVerified": true,
    "status": "active"
  }
}
```

**Error Codes:**
- `400` - Missing uid parameter
- `404` - User not found
- `500` - Server error

## Environment Variables

These functions require the following environment variables to be set in Vercel:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Application URL (for email verification links)
APP_URL=https://your-app.vercel.app

# Node environment
NODE_ENV=production
```

## Local Development

To test these functions locally, you can use the Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run development server
vercel dev
```

This will start a local development server at `http://localhost:3000` with the API endpoints available at `/api/*`.

## Deployment

These functions are automatically deployed when you push to the main branch. Vercel will:

1. Build the TypeScript files
2. Deploy them as serverless functions
3. Make them available at your production URL

## Security

- All Firebase Admin operations are server-side only
- Private keys are stored as environment variables
- CORS is handled by Vercel automatically
- Rate limiting should be configured in Vercel dashboard

## Troubleshooting

### Function timeout
If functions are timing out, check:
- Firebase initialization is cached
- Database queries are optimized
- Network requests have reasonable timeouts

### Authentication errors
Ensure:
- Firebase Admin credentials are correct
- Private key has proper line breaks (`\n`)
- Project ID matches your Firebase project

### Email verification not working
Check:
- APP_URL is set correctly
- Firebase email templates are configured
- Email action settings allow the verification URL

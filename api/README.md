# ESTA Tracker Background Functions

This directory contains Vercel Background Functions for handling heavy, long-running operations in the ESTA Tracker application.

## Overview

Background functions allow heavy operations to run asynchronously without blocking the main request/response cycle. Each function:
- Streams progress updates to Firestore
- Sends notifications on completion or failure
- Writes detailed logs to Firestore for audit trail
- Supports status polling via the job status API

## Available Background Functions

### 1. CSV Import (`/api/background/csv-import`)

Handles bulk employee imports from CSV files.

**Endpoint**: `POST /api/background/csv-import`

**Request Body**:
```json
{
  "action": "initiate",
  "tenantId": "tenant_123",
  "userId": "user_456",
  "csvData": "firstName,lastName,email,hireDate\nJohn,Doe,john@example.com,2024-01-01"
}
```

**Response**:
```json
{
  "message": "CSV import job started",
  "jobId": "job_789"
}
```

**Features**:
- Parses CSV with flexible column mapping
- Validates employee data before import
- Handles duplicate detection
- Creates initial accrual balances
- Reports detailed errors per row

### 2. Accrual Recalculation (`/api/background/accrual-recalculation`)

Recalculates sick time accruals for employees based on work logs.

**Endpoint**: `POST /api/background/accrual-recalculation`

**Request Body**:
```json
{
  "action": "initiate",
  "tenantId": "tenant_123",
  "userId": "user_456",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "employeeIds": ["emp1", "emp2"]
}
```

**Features**:
- Calculates based on Michigan ESTA rules (1 hour per 30 worked)
- Handles both small and large employer rules
- Supports date range filtering
- Processes specific employees or all employees
- Updates accrual balances atomically

### 3. Bulk Employee Update (`/api/background/bulk-employee-update`)

Updates multiple employee records simultaneously.

**Endpoint**: `POST /api/background/bulk-employee-update`

**Request Body**:
```json
{
  "action": "initiate",
  "tenantId": "tenant_123",
  "userId": "user_456",
  "employeeIds": ["emp1", "emp2", "emp3"],
  "updates": {
    "department": "Engineering",
    "role": "manager",
    "status": "active"
  }
}
```

**Features**:
- Updates department, role, status, hire date, manager
- Updates Firebase Auth custom claims for role changes
- Validates all updates before processing
- Creates individual audit logs per employee
- Handles errors gracefully

### 4. PTO Validation (`/api/background/pto-validation`)

Validates PTO requests against balances and compliance rules.

**Endpoint**: `POST /api/background/pto-validation`

**Request Body**:
```json
{
  "action": "initiate",
  "tenantId": "tenant_123",
  "userId": "user_456",
  "requestIds": ["req1", "req2"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Features**:
- Validates balance sufficiency
- Checks for overlapping requests
- Validates documentation requirements
- Checks advance notice compliance
- Identifies issues and warnings
- Updates request validation status

### 5. Audit Export (`/api/background/audit-export`)

Generates comprehensive audit reports for compliance.

**Endpoint**: `POST /api/background/audit-export`

**Request Body**:
```json
{
  "action": "initiate",
  "tenantId": "tenant_123",
  "userId": "user_456",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "includeDocuments": true,
  "format": "json",
  "sections": ["employees", "balances", "requests"]
}
```

**Features**:
- Exports employees, balances, requests, work logs, audit logs
- Supports JSON, CSV, and PDF formats
- Generates compliance report summary
- Uploads to Firebase Storage
- Provides 7-day download link

## Job Status API

Check the status of any background job:

**Endpoint**: `GET /api/job-status?jobId={jobId}&userId={userId}&tenantId={tenantId}`

**Response**:
```json
{
  "success": true,
  "job": {
    "id": "job_789",
    "type": "csv_import",
    "status": "processing",
    "progress": 45,
    "startedAt": "2024-11-18T15:00:00.000Z",
    "tenantId": "tenant_123",
    "userId": "user_456",
    "metadata": {},
    "logs": [
      "[2024-11-18T15:00:05.000Z] Starting CSV import",
      "[2024-11-18T15:00:10.000Z] Parsed 50 employees from CSV"
    ]
  }
}
```

## Job Lifecycle

1. **Initiate**: Client calls background function with `action: "initiate"`
2. **Job Created**: Function creates job record in Firestore and returns jobId
3. **Processing**: Function processes asynchronously, updating progress
4. **Logging**: Detailed logs written to Firestore subcollection
5. **Completion**: Job marked as completed/failed, notification sent
6. **Polling**: Client polls `/api/job-status` to check progress

## Firestore Collections

### `backgroundJobs`
Main job tracking collection:
```typescript
{
  id: string;
  type: 'csv_import' | 'accrual_recalculation' | ...;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt: Timestamp;
  completedAt?: Timestamp;
  tenantId: string;
  userId: string;
  metadata: object;
  error?: string;
  logs: string[];
}
```

### `backgroundJobs/{jobId}/detailedLogs`
Subcollection for detailed logs:
```typescript
{
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata: object;
  timestamp: Timestamp;
}
```

### `notifications`
Job completion notifications:
```typescript
{
  userId: string;
  tenantId: string;
  type: 'background_job';
  title: string;
  message: string;
  jobId: string;
  status: 'completed' | 'failed';
  read: boolean;
  createdAt: Timestamp;
}
```

## Permissions

All background functions require appropriate permissions:
- **CSV Import**: Employer role or higher
- **Accrual Recalculation**: Employer role or higher
- **Bulk Employee Update**: Employer role or higher
- **PTO Validation**: Manager role or higher
- **Audit Export**: Employer role or higher

## Configuration

Background functions are configured in `vercel.json`:

```json
{
  "functions": {
    "api/background/*.ts": {
      "maxDuration": 300,
      "memory": 1024
    }
  }
}
```

- **maxDuration**: 300 seconds (5 minutes) - maximum execution time
- **memory**: 1024 MB - allocated memory per function

## Error Handling

All functions implement comprehensive error handling:
- Try-catch blocks around all operations
- Detailed error logging to Firestore
- User-friendly error notifications
- Job status updated to 'failed' with error message
- Partial success tracking (e.g., 45/50 employees imported)

## Development

To test background functions locally:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Firebase Admin credentials in environment variables

3. Run Vercel dev server:
   ```bash
   vercel dev
   ```

4. Test endpoints with curl or Postman:
   ```bash
   curl -X POST http://localhost:3000/api/background/csv-import \
     -H "Content-Type: application/json" \
     -d '{"action":"initiate","tenantId":"test","userId":"user1","csvData":"..."}'
   ```

## Production Deployment

Background functions are automatically deployed with the main application:

```bash
vercel --prod
```

## Monitoring

Monitor background jobs:
1. Check Firestore `backgroundJobs` collection
2. View detailed logs in `backgroundJobs/{jobId}/detailedLogs`
3. Check Vercel function logs in dashboard
4. Monitor notifications collection for user notifications

## Best Practices

1. **Always use progress updates**: Update progress regularly for user feedback
2. **Log important events**: Write logs for debugging and audit trail
3. **Handle partial failures**: Report both successes and failures
4. **Set appropriate timeouts**: Consider Vercel's 5-minute limit
5. **Use pagination**: For large datasets, process in batches
6. **Notify users**: Always send completion/failure notifications
7. **Create audit logs**: Log all significant actions for compliance

## Future Enhancements

Planned improvements:
- [ ] Add retry logic for failed operations
- [ ] Implement job cancellation
- [ ] Add job priority queuing
- [ ] Support resumable operations
- [ ] Add job scheduling (cron-like)
- [ ] Implement job chaining
- [ ] Add webhook notifications
- [ ] Support streaming results

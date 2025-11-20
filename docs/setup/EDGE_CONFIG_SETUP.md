# Edge Config Setup Guide

This guide explains how to set up and use Vercel Edge Config for global application settings in ESTA Tracker.

## Overview

Edge Config is Vercel's ultra-low-latency data store at the edge. It's perfect for storing global settings that need to be:
- Available globally with minimal latency
- Updated infrequently
- Read frequently
- Cached aggressively

## Use Cases in ESTA Tracker

Edge Config is used for:

1. **Feature Flags**
   - Enable/disable doctor note requirements
   - Toggle calendar view
   - Control audit log access
   - Enable/disable document uploads
   - Toggle push notifications

2. **Maintenance Mode**
   - Enable system-wide maintenance mode
   - Display custom maintenance messages

3. **Registration Controls**
   - Open/close employer registration
   - Open/close employee registration
   - Display custom closure messages

4. **Rate Limiting**
   - Configure login attempt limits
   - Set API request rate limits
   - Control document upload rates
   - Limit sick time request frequency

5. **Accrual Ruleset Versioning**
   - Track current ruleset version
   - Manage effective dates
   - Handle rule updates

## Setup Instructions

### 1. Create Edge Config in Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Edge Config**
3. Click **Create Edge Config**
4. Name it: `esta-tracker-settings`
5. Copy the connection string (starts with `https://edge-config.vercel.com/...`)

### 2. Connect to Your Project

1. In Vercel Dashboard, go to your project
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `EDGE_CONFIG`
   - **Value**: Your Edge Config connection string
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**

### 3. Initialize Edge Config Data

In the Edge Config dashboard, add the following initial configuration:

```json
{
  "featureFlags": {
    "doctorNotesEnabled": true,
    "calendarEnabled": true,
    "auditLogEnabled": true,
    "documentUploadEnabled": true,
    "pushNotificationsEnabled": false
  },
  "rateLimits": {
    "loginAttemptsPerHour": 5,
    "apiRequestsPerMinute": 100,
    "sickTimeRequestsPerDay": 10,
    "documentUploadsPerHour": 20
  },
  "accrualRuleset": {
    "version": "1.0.0",
    "effectiveDate": "2025-01-01",
    "description": "Michigan ESTA 2025 - Initial Ruleset",
    "active": true
  },
  "registrationSettings": {
    "employerRegistrationOpen": true,
    "employeeRegistrationOpen": true,
    "closedMessage": null
  },
  "maintenanceMode": false,
  "maintenanceMessage": null,
  "lastUpdated": "2025-01-01T00:00:00Z"
}
```

### 4. Redeploy Your Application

After adding the Edge Config environment variable:
1. Trigger a new deployment (or wait for next push)
2. Verify the deployment completes successfully

## Usage

### Frontend Usage

#### Using Hooks

```typescript
import { useFeatureFlag, useMaintenanceMode, useRegistrationStatus } from '../hooks/useEdgeConfig';

function MyComponent() {
  // Check a feature flag
  const doctorNotesEnabled = useFeatureFlag('doctorNotesEnabled');
  
  // Check maintenance mode
  const { maintenanceMode, message } = useMaintenanceMode();
  
  // Check registration status
  const { isOpen, message } = useRegistrationStatus('employer');
  
  // Use the flags
  return (
    <div>
      {doctorNotesEnabled && <DoctorNoteUpload />}
      {maintenanceMode && <MaintenanceBanner message={message} />}
    </div>
  );
}
```

#### Using the Service Directly

```typescript
import { edgeConfigService } from '../lib/edgeConfigService';

async function checkFeature() {
  const isEnabled = await edgeConfigService.getFeatureFlag('calendarEnabled');
  console.log('Calendar enabled:', isEnabled);
}

async function checkMaintenance() {
  const inMaintenance = await edgeConfigService.isMaintenanceMode();
  if (inMaintenance) {
    const message = await edgeConfigService.getMaintenanceMessage();
    console.log('Maintenance message:', message);
  }
}
```

### Backend/Functions Usage

```javascript
import { createClient } from '@vercel/edge-config';

export default async function handler(req, res) {
  const edgeConfig = createClient(process.env.EDGE_CONFIG);
  
  // Check maintenance mode before processing
  const maintenanceMode = await edgeConfig.get('maintenanceMode');
  if (maintenanceMode) {
    return res.status(503).json({ 
      error: 'Service under maintenance',
      message: await edgeConfig.get('maintenanceMessage')
    });
  }
  
  // Get rate limits
  const rateLimits = await edgeConfig.get('rateLimits');
  const maxAttempts = rateLimits.loginAttemptsPerHour;
  
  // Continue with function logic...
}
```

## Updating Configuration

### Via Vercel Dashboard

1. Go to **Storage** → **Edge Config** → `esta-tracker-settings`
2. Click **Edit**
3. Update the JSON configuration
4. Click **Save**
5. Changes propagate globally in seconds

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Update a specific key
vercel edge-config set maintenanceMode true

# Update multiple keys
vercel edge-config set '{"maintenanceMode": true, "maintenanceMessage": "Scheduled maintenance in progress"}'

# Get current value
vercel edge-config get maintenanceMode
```

### Via API

```bash
# Using Vercel API
curl -X PATCH https://api.vercel.com/v1/edge-config/<ID>/items \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "operation": "update",
        "key": "maintenanceMode",
        "value": true
      }
    ]
  }'
```

## Common Operations

### Enable Maintenance Mode

```json
{
  "maintenanceMode": true,
  "maintenanceMessage": "ESTA Tracker is undergoing scheduled maintenance. We'll be back at 3 PM EST."
}
```

### Close Registration

```json
{
  "registrationSettings": {
    "employerRegistrationOpen": false,
    "employeeRegistrationOpen": false,
    "closedMessage": "Registration is temporarily closed for system upgrades."
  }
}
```

### Disable a Feature

```json
{
  "featureFlags": {
    "doctorNotesEnabled": false
  }
}
```

### Update Accrual Ruleset

```json
{
  "accrualRuleset": {
    "version": "2.0.0",
    "effectiveDate": "2025-06-01",
    "description": "Michigan ESTA 2025 - Updated Q2 Rules",
    "active": true
  }
}
```

### Adjust Rate Limits

```json
{
  "rateLimits": {
    "loginAttemptsPerHour": 10,
    "apiRequestsPerMinute": 150
  }
}
```

## Best Practices

1. **Always Use Defaults**: The application has fallback defaults for all settings. Edge Config failures won't break the app.

2. **Test Changes in Preview**: Use Vercel Preview deployments to test Edge Config changes before applying to production.

3. **Document Changes**: Keep track of Edge Config updates in your deployment notes.

4. **Monitor Usage**: Check Edge Config usage in Vercel Dashboard to ensure you're within limits.

5. **Cache Awareness**: Changes propagate quickly but may take up to 60 seconds due to caching.

6. **Gradual Rollouts**: For major changes, consider:
   - Test in preview environment
   - Deploy during off-peak hours
   - Have a rollback plan

## Troubleshooting

### Edge Config Not Loading

1. Verify `EDGE_CONFIG` environment variable is set
2. Check Edge Config connection string is valid
3. Ensure Edge Config is connected to the project
4. Check Vercel deployment logs for errors

### Changes Not Appearing

1. Wait 60 seconds for cache to expire
2. Check if changes were saved in Edge Config dashboard
3. Force a new deployment to clear all caches
4. Invalidate frontend cache using browser DevTools

### Application Falls Back to Defaults

This is expected behavior when:
- Edge Config is not configured
- Network request fails
- Edge Config item doesn't exist

The application will continue working with sensible defaults.

## Monitoring

### Check Edge Config Status

```bash
# Using Vercel CLI
vercel edge-config list
vercel edge-config get-all
```

### View Access Logs

1. Go to Vercel Dashboard
2. Navigate to **Storage** → **Edge Config**
3. Select your Edge Config
4. View **Insights** tab for usage metrics

## Security Considerations

1. **Read-Only Frontend**: Frontend can only read Edge Config via the API endpoint
2. **Update Access**: Only team members with Vercel access can update Edge Config
3. **No Sensitive Data**: Never store secrets or credentials in Edge Config
4. **Audit Trail**: Vercel maintains logs of all Edge Config changes

## Additional Resources

- [Vercel Edge Config Documentation](https://vercel.com/docs/storage/edge-config)
- [Edge Config SDK Reference](https://vercel.com/docs/storage/edge-config/using-edge-config)
- [Edge Config Best Practices](https://vercel.com/docs/storage/edge-config/best-practices)

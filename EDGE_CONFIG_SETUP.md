# Edge Config Setup Guide

## Setting Up Vercel Edge Config for Maintenance Mode

This guide explains how to set up Vercel Edge Config to enable maintenance mode for ESTA Tracker.

### Prerequisites

- Vercel CLI installed: `npm i -g vercel`
- Logged in to Vercel: `vercel login`
- Project linked to Vercel: `vercel link`

### Step 1: Create Edge Config

```bash
# Create a new Edge Config store
vercel edge-config create esta-tracker-maintenance
```

This will output an Edge Config ID, for example:
```
ecfg_abc123xyz789
```

### Step 2: Link Edge Config to Your Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your ESTA Tracker project
3. Go to **Settings** → **Edge Config**
4. Click **Link Edge Config**
5. Select the `esta-tracker-maintenance` config you just created

Alternatively, use the CLI:
```bash
vercel env add EDGE_CONFIG
# Paste the Edge Config connection string when prompted
```

The connection string looks like:
```
https://edge-config.vercel.com/ecfg_abc123xyz789?token=your-token-here
```

### Step 3: Configure Maintenance Mode

#### Enable Maintenance Mode

```bash
# Enable maintenance mode
vercel edge-config set maintenanceMode true --edge-config=esta-tracker-maintenance
```

When enabled:
- All users will see the maintenance page
- Static assets will still be served
- The application bundle is unchanged
- Changes take effect in <10ms globally

#### Disable Maintenance Mode

```bash
# Disable maintenance mode
vercel edge-config set maintenanceMode false --edge-config=esta-tracker-maintenance
```

#### Check Current Status

```bash
# View all Edge Config values
vercel edge-config get --edge-config=esta-tracker-maintenance
```

### Step 4: Optional - Add Maintenance Message

You can add a custom maintenance message:

```bash
vercel edge-config set maintenanceMessage "We're upgrading to serve you better! Expected completion: 2pm EST" --edge-config=esta-tracker-maintenance
```

Then update `middleware.ts` to read and pass this message:

```typescript
const maintenanceMessage = await getEdgeConfig('maintenanceMessage');
response.headers.set('X-Maintenance-Message', maintenanceMessage || 'System under maintenance');
```

### Step 5: Testing

#### Test Locally

Edge Config is not available in local development. To test locally:

1. **Mock Maintenance Mode**: Set an environment variable
   ```bash
   MAINTENANCE_MODE=true npm run dev
   ```

2. **Update middleware.ts** to check env var in development:
   ```typescript
   if (process.env.NODE_ENV === 'development' && process.env.MAINTENANCE_MODE === 'true') {
     return NextResponse.rewrite(new URL('/index.html', request.url));
   }
   ```

#### Test in Production

1. Enable maintenance mode:
   ```bash
   vercel edge-config set maintenanceMode true --edge-config=esta-tracker-maintenance
   ```

2. Visit your production URL - you should see the maintenance page

3. Disable maintenance mode:
   ```bash
   vercel edge-config set maintenanceMode false --edge-config=esta-tracker-maintenance
   ```

4. Visit your production URL - you should see the normal app

### Edge Config Best Practices

#### 1. Use Multiple Configs for Different Environments

```bash
# Production
vercel edge-config create esta-tracker-prod

# Staging
vercel edge-config create esta-tracker-staging
```

Link each to the appropriate Vercel project.

#### 2. Set Up Scheduled Maintenance

Create a GitHub Action or cron job to enable/disable maintenance mode:

```yaml
# .github/workflows/scheduled-maintenance.yml
name: Scheduled Maintenance

on:
  schedule:
    - cron: '0 2 * * 0' # Every Sunday at 2 AM UTC

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - name: Enable Maintenance Mode
        run: |
          curl -X PUT "https://api.vercel.com/v1/edge-config/${{ secrets.EDGE_CONFIG_ID }}/items" \
            -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"items":[{"operation":"update","key":"maintenanceMode","value":true}]}'
      
      - name: Wait for maintenance window
        run: sleep 3600 # 1 hour
      
      - name: Disable Maintenance Mode
        run: |
          curl -X PUT "https://api.vercel.com/v1/edge-config/${{ secrets.EDGE_CONFIG_ID }}/items" \
            -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"items":[{"operation":"update","key":"maintenanceMode","value":false}]}'
```

#### 3. Monitor Edge Config Changes

Set up alerts in your monitoring system (Datadog, New Relic, etc.) to notify your team when maintenance mode is enabled.

#### 4. Add a Status Page

Consider creating a public status page that checks Edge Config:

```typescript
// pages/api/status.ts
import { get } from '@vercel/edge-config';

export default async function handler(req, res) {
  const isMaintenanceMode = await get('maintenanceMode');
  
  res.json({
    status: isMaintenanceMode ? 'maintenance' : 'operational',
    message: await get('maintenanceMessage') || 'All systems operational',
  });
}
```

### Troubleshooting

#### Edge Config Not Working

1. **Check Connection String**:
   ```bash
   vercel env ls
   ```
   Ensure `EDGE_CONFIG` is set correctly

2. **Verify Edge Config Exists**:
   ```bash
   vercel edge-config ls
   ```

3. **Check Permissions**:
   - Ensure your Vercel account has access to the Edge Config
   - Check that the project is linked to the correct Edge Config

#### Maintenance Page Not Showing

1. **Clear Cache**: Edge Config changes are instant, but browser cache might need clearing
2. **Check Middleware**: Ensure middleware.ts is deployed
3. **Verify Route Matcher**: Check that the route is covered by the middleware config

#### Can't Update Edge Config

1. **Check Rate Limits**: Edge Config has rate limits (100 requests/hour for free tier)
2. **Verify Token**: Ensure your Vercel token has write permissions
3. **Check Quota**: Free tier has 1 Edge Config, paid tiers have more

### Edge Config Limits

| Plan | Edge Configs | Items per Config | Total Size | Reads/month | Writes/month |
|------|--------------|------------------|------------|-------------|--------------|
| Hobby | 1 | 100 | 64 KB | Unlimited | 100 |
| Pro | 10 | 500 | 512 KB | Unlimited | 1,000 |
| Enterprise | Custom | Custom | Custom | Unlimited | Custom |

### Additional Resources

- [Vercel Edge Config Documentation](https://vercel.com/docs/storage/edge-config)
- [Edge Config API Reference](https://vercel.com/docs/rest-api/endpoints#edge-config)
- [Edge Middleware Documentation](https://vercel.com/docs/functions/edge-middleware)

### Support

For issues with Edge Config setup:
- Email: support@estatracker.com
- Vercel Support: https://vercel.com/support

For security issues:
- Email: security@estatracker.com

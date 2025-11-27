/**
 * QuickBooks Integration Stub
 *
 * Provides OAuth 2.0 authentication and API integration with QuickBooks Online
 * for importing employee hours and payroll data.
 *
 * OAUTH CLARIFICATION ROUTINES:
 * ============================
 *
 * QuickBooks uses OAuth 2.0 with the following flow:
 *
 * 1. AUTHORIZATION REQUEST:
 *    - Redirect user to QuickBooks authorization URL
 *    - Include client_id, redirect_uri, scope, and state
 *    - Scope: com.intuit.quickbooks.accounting (for read access)
 *
 * 2. AUTHORIZATION CALLBACK:
 *    - User approves access and is redirected back
 *    - Receive authorization code and realm_id (company ID)
 *    - Exchange code for access_token and refresh_token
 *
 * 3. TOKEN MANAGEMENT:
 *    - Access tokens expire in 1 hour
 *    - Refresh tokens expire in 100 days
 *    - Auto-refresh tokens before API calls
 *
 * 4. API CALLS:
 *    - Include access_token in Authorization header
 *    - Include realm_id in API URL path
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 * - QUICKBOOKS_CLIENT_ID: OAuth client ID from Intuit Developer
 * - QUICKBOOKS_CLIENT_SECRET: OAuth client secret
 * - QUICKBOOKS_REDIRECT_URI: OAuth callback URL
 * - QUICKBOOKS_ENVIRONMENT: 'sandbox' or 'production'
 *
 * SETUP INSTRUCTIONS:
 * 1. Create app at https://developer.intuit.com
 * 2. Configure OAuth redirect URI
 * 3. Enable required scopes
 * 4. Copy credentials to environment variables
 *
 * @module quickbooks
 */

// =====================================================
// TYPES AND INTERFACES
// =====================================================

/** QuickBooks OAuth configuration */
export interface QuickBooksOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

/** OAuth tokens returned by QuickBooks */
export interface QuickBooksTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  refreshTokenExpiresAt: Date;
  realmId: string;
}

/** QuickBooks employee data */
export interface QuickBooksEmployee {
  id: string;
  displayName: string;
  givenName: string;
  familyName: string;
  email?: string;
  phone?: string;
  active: boolean;
  hireDate?: string;
}

/** QuickBooks time activity (hours worked) */
export interface QuickBooksTimeActivity {
  id: string;
  employeeId: string;
  txnDate: string;
  hours: number;
  minutes: number;
  description?: string;
  billableStatus?: string;
}

/** Connection status */
export interface ConnectionStatus {
  connected: boolean;
  companyName?: string;
  lastSyncAt?: Date;
  tokenExpiresAt?: Date;
  needsReauthorization: boolean;
}

// =====================================================
// OAUTH CONFIGURATION
// =====================================================

const QB_OAUTH_BASE_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QB_API_BASE_URL_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com';
const QB_API_BASE_URL_PRODUCTION = 'https://quickbooks.api.intuit.com';

/**
 * Get OAuth configuration from environment
 */
export function getOAuthConfig(): QuickBooksOAuthConfig | null {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  const environment = process.env.QUICKBOOKS_ENVIRONMENT as
    | 'sandbox'
    | 'production';

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    environment: environment || 'sandbox',
  };
}

/**
 * Check if QuickBooks integration is configured
 */
export function isConfigured(): boolean {
  return getOAuthConfig() !== null;
}

// =====================================================
// OAUTH AUTHORIZATION
// =====================================================

/**
 * Generate OAuth authorization URL
 *
 * @param state - CSRF protection state parameter
 * @returns Authorization URL to redirect user to
 */
export function getAuthorizationUrl(state: string): string | null {
  const config = getOAuthConfig();
  if (!config) {
    console.error('[QuickBooks] OAuth not configured');
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state,
  });

  return `${QB_OAUTH_BASE_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 *
 * STUB: In production, this makes an actual HTTP request to QuickBooks
 *
 * @param code - Authorization code from callback
 * @param realmId - Company ID from callback
 * @returns OAuth tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  realmId: string
): Promise<QuickBooksTokens | null> {
  const config = getOAuthConfig();
  if (!config) {
    console.error('[QuickBooks] OAuth not configured');
    return null;
  }

  // STUB: In production, make actual token exchange request
  console.log('[QuickBooks] STUB: Would exchange code for tokens', {
    code,
    realmId,
  });

  // Return mock tokens for development
  const now = new Date();
  return {
    accessToken: 'stub_access_token',
    refreshToken: 'stub_refresh_token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    expiresAt: new Date(now.getTime() + 3600 * 1000),
    refreshTokenExpiresAt: new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000),
    realmId,
  };
}

/**
 * Refresh expired access token
 *
 * STUB: In production, this makes an actual HTTP request to QuickBooks
 *
 * @param refreshToken - Current refresh token
 * @returns New OAuth tokens
 */
export async function refreshAccessToken(
  _refreshToken: string
): Promise<QuickBooksTokens | null> {
  const config = getOAuthConfig();
  if (!config) {
    console.error('[QuickBooks] OAuth not configured');
    return null;
  }

  // STUB: In production, make actual token refresh request
  console.log('[QuickBooks] STUB: Would refresh access token');

  const now = new Date();
  return {
    accessToken: 'stub_refreshed_access_token',
    refreshToken: 'stub_new_refresh_token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    expiresAt: new Date(now.getTime() + 3600 * 1000),
    refreshTokenExpiresAt: new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000),
    realmId: 'stub_realm_id',
  };
}

// =====================================================
// API OPERATIONS
// =====================================================

/**
 * Get API base URL based on environment
 */
function getApiBaseUrl(): string {
  const config = getOAuthConfig();
  return config?.environment === 'production'
    ? QB_API_BASE_URL_PRODUCTION
    : QB_API_BASE_URL_SANDBOX;
}

/**
 * Fetch employees from QuickBooks
 *
 * STUB: In production, this makes an actual API request
 *
 * @param tokens - OAuth tokens
 * @returns List of employees
 */
export async function fetchEmployees(
  _tokens: QuickBooksTokens
): Promise<QuickBooksEmployee[]> {
  // STUB: In production, make actual API request
  console.log('[QuickBooks] STUB: Would fetch employees from', getApiBaseUrl());

  // Return mock employees for development
  return [
    {
      id: 'emp_1',
      displayName: 'John Doe',
      givenName: 'John',
      familyName: 'Doe',
      email: 'john.doe@example.com',
      active: true,
      hireDate: '2024-01-15',
    },
    {
      id: 'emp_2',
      displayName: 'Jane Smith',
      givenName: 'Jane',
      familyName: 'Smith',
      email: 'jane.smith@example.com',
      active: true,
      hireDate: '2024-02-01',
    },
  ];
}

/**
 * Fetch time activities (hours worked) from QuickBooks
 *
 * STUB: In production, this makes an actual API request
 *
 * @param tokens - OAuth tokens
 * @param startDate - Start date for query
 * @param endDate - End date for query
 * @returns List of time activities
 */
export async function fetchTimeActivities(
  _tokens: QuickBooksTokens,
  startDate: string,
  endDate: string
): Promise<QuickBooksTimeActivity[]> {
  // STUB: In production, make actual API request
  console.log('[QuickBooks] STUB: Would fetch time activities', {
    startDate,
    endDate,
  });

  // Return mock time activities for development
  return [
    {
      id: 'ta_1',
      employeeId: 'emp_1',
      txnDate: '2024-01-15',
      hours: 8,
      minutes: 0,
      description: 'Regular work day',
    },
    {
      id: 'ta_2',
      employeeId: 'emp_1',
      txnDate: '2024-01-16',
      hours: 7,
      minutes: 30,
      description: 'Regular work day',
    },
  ];
}

/**
 * Get connection status
 *
 * @param tokens - OAuth tokens (or null if not connected)
 * @returns Connection status
 */
export function getConnectionStatus(
  tokens: QuickBooksTokens | null
): ConnectionStatus {
  if (!tokens) {
    return {
      connected: false,
      needsReauthorization: false,
    };
  }

  const now = new Date();
  const needsReauthorization = now > tokens.refreshTokenExpiresAt;

  return {
    connected: true,
    companyName: 'QuickBooks Company', // STUB: Would fetch from API
    lastSyncAt: new Date(), // STUB: Would track last sync
    tokenExpiresAt: tokens.expiresAt,
    needsReauthorization,
  };
}

// =====================================================
// ESTA-SPECIFIC HELPERS
// =====================================================

/**
 * Convert QuickBooks time activities to ESTA work log format
 *
 * @param activities - QuickBooks time activities
 * @param employerMapping - Map of QB employee IDs to ESTA employee IDs
 * @returns Work log entries for ESTA tracking
 */
export function convertToESTAWorkLogs(
  activities: QuickBooksTimeActivity[],
  employerMapping: Map<string, string>
): Array<{
  employeeId: string;
  date: string;
  hoursWorked: number;
  source: 'quickbooks';
}> {
  return activities
    .map((activity) => {
      const estaEmployeeId = employerMapping.get(activity.employeeId);
      if (!estaEmployeeId) {
        console.warn(
          '[QuickBooks] No mapping for employee:',
          activity.employeeId
        );
        return null;
      }

      return {
        employeeId: estaEmployeeId,
        date: activity.txnDate,
        hoursWorked: activity.hours + activity.minutes / 60,
        source: 'quickbooks' as const,
      };
    })
    .filter((log): log is NonNullable<typeof log> => log !== null);
}

/**
 * Validate QuickBooks connection and tokens
 *
 * @param tokens - OAuth tokens to validate
 * @returns true if tokens are valid and not expired
 */
export function validateConnection(tokens: QuickBooksTokens): boolean {
  const now = new Date();

  // Check if access token is expired (with 5 minute buffer)
  if (now > new Date(tokens.expiresAt.getTime() - 5 * 60 * 1000)) {
    console.log('[QuickBooks] Access token expired or expiring soon');
    return false;
  }

  // Check if refresh token is expired
  if (now > tokens.refreshTokenExpiresAt) {
    console.log('[QuickBooks] Refresh token expired - needs reauthorization');
    return false;
  }

  return true;
}

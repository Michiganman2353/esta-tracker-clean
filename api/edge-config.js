/**
 * Vercel Serverless Function: Edge Config API
 * Serves Edge Config settings to the frontend
 * 
 * This function retrieves settings from Vercel Edge Config and serves them
 * to the frontend application. It provides caching headers for performance
 * and fallback to default settings if Edge Config is unavailable.
 */

import { createClient } from '@vercel/edge-config';

/**
 * Default Edge Config settings (fallback)
 */
const DEFAULT_CONFIG = {
  featureFlags: {
    doctorNotesEnabled: true,
    calendarEnabled: true,
    auditLogEnabled: true,
    documentUploadEnabled: true,
    pushNotificationsEnabled: false,
  },
  rateLimits: {
    loginAttemptsPerHour: 5,
    apiRequestsPerMinute: 100,
    sickTimeRequestsPerDay: 10,
    documentUploadsPerHour: 20,
  },
  accrualRuleset: {
    version: '1.0.0',
    effectiveDate: '2025-01-01',
    description: 'Michigan ESTA 2025 - Initial Ruleset',
    active: true,
  },
  registrationSettings: {
    employerRegistrationOpen: true,
    employeeRegistrationOpen: true,
    closedMessage: undefined,
  },
  maintenanceMode: false,
  maintenanceMessage: undefined,
  lastUpdated: new Date().toISOString(),
};

/**
 * Serverless function handler
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Edge Config is configured
    const edgeConfigId = process.env.EDGE_CONFIG;
    
    if (!edgeConfigId) {
      console.warn('EDGE_CONFIG not configured, using defaults');
      return res.status(200).json(DEFAULT_CONFIG);
    }

    // Create Edge Config client
    const edgeConfig = createClient(edgeConfigId);

    // Get all settings from Edge Config
    const config = await edgeConfig.getAll();

    // Merge with defaults (in case some keys are missing)
    const mergedConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      featureFlags: {
        ...DEFAULT_CONFIG.featureFlags,
        ...(config?.featureFlags || {}),
      },
      rateLimits: {
        ...DEFAULT_CONFIG.rateLimits,
        ...(config?.rateLimits || {}),
      },
      accrualRuleset: {
        ...DEFAULT_CONFIG.accrualRuleset,
        ...(config?.accrualRuleset || {}),
      },
      registrationSettings: {
        ...DEFAULT_CONFIG.registrationSettings,
        ...(config?.registrationSettings || {}),
      },
    };

    // Set cache headers (60 seconds)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json(mergedConfig);
  } catch (error) {
    console.error('Error fetching Edge Config:', error);
    
    // Return defaults on error
    res.setHeader('Cache-Control', 's-maxage=10');
    return res.status(200).json(DEFAULT_CONFIG);
  }
}

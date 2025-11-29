/**
 * Feature Extraction Module
 *
 * Extracts features from employer data for risk model training and prediction.
 * Features are designed to be compatible with XGBoost and other ML models.
 *
 * @module featureExtraction
 */

import type { RiskCalculationInput, RiskFeatures } from '@esta/shared-types';

/**
 * Time periods in milliseconds for feature calculation
 */
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_30 = 30 * MS_PER_DAY;
const DAYS_90 = 90 * MS_PER_DAY;
const DAYS_365 = 365 * MS_PER_DAY;

/**
 * Calculate denial rate for a given time period
 */
function calculateDenialRate(
  requests: RiskCalculationInput['requests'],
  periodMs: number,
  now: Date
): number {
  const cutoff = new Date(now.getTime() - periodMs);
  const periodRequests = requests.filter((r) => r.requestedAt >= cutoff);

  if (periodRequests.length === 0) {
    return 0;
  }

  const deniedCount = periodRequests.filter(
    (r) => r.status === 'denied'
  ).length;
  return deniedCount / periodRequests.length;
}

/**
 * Calculate denial trend (-1 to 1)
 * Positive = denials increasing, Negative = denials decreasing
 */
function calculateDenialTrend(
  requests: RiskCalculationInput['requests'],
  now: Date
): number {
  const cutoff30 = new Date(now.getTime() - DAYS_30);
  const cutoff90 = new Date(now.getTime() - DAYS_90);

  // Recent period (last 30 days)
  const recentRequests = requests.filter(
    (r) => r.requestedAt >= cutoff30 && r.requestedAt < now
  );
  // Previous period (30-90 days ago)
  const previousRequests = requests.filter(
    (r) => r.requestedAt >= cutoff90 && r.requestedAt < cutoff30
  );

  if (recentRequests.length === 0 || previousRequests.length === 0) {
    return 0;
  }

  const recentDenialRate =
    recentRequests.filter((r) => r.status === 'denied').length /
    recentRequests.length;
  const previousDenialRate =
    previousRequests.filter((r) => r.status === 'denied').length /
    previousRequests.length;

  // Normalize to -1 to 1 range
  const diff = recentDenialRate - previousDenialRate;
  return Math.max(-1, Math.min(1, diff * 2));
}

/**
 * Count consecutive denials (most recent streak)
 */
function countConsecutiveDenials(
  requests: RiskCalculationInput['requests']
): number {
  const sortedRequests = [...requests].sort(
    (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()
  );

  let count = 0;
  for (const request of sortedRequests) {
    if (request.status === 'denied') {
      count++;
    } else if (request.status === 'approved') {
      break;
    }
  }

  return count;
}

/**
 * Calculate average accrual utilization
 */
function calculateAccrualUtilization(
  balances: RiskCalculationInput['accrualBalances']
): number {
  if (balances.length === 0) {
    return 0;
  }

  const validBalances = balances.filter((b) => b.yearlyAccrued > 0);
  if (validBalances.length === 0) {
    return 0;
  }

  const totalUtilization = validBalances.reduce((sum, b) => {
    const utilization = b.yearlyUsed / b.yearlyAccrued;
    return sum + Math.min(1, utilization);
  }, 0);

  return totalUtilization / validBalances.length;
}

/**
 * Calculate average request approval latency in hours
 */
function calculateApprovalLatency(
  requests: RiskCalculationInput['requests']
): number {
  const reviewedRequests = requests.filter(
    (r) => r.reviewedAt && (r.status === 'approved' || r.status === 'denied')
  );

  if (reviewedRequests.length === 0) {
    return 0;
  }

  const totalLatency = reviewedRequests.reduce((sum, r) => {
    const latencyMs = r.reviewedAt!.getTime() - r.requestedAt.getTime();
    return sum + latencyMs / (1000 * 60 * 60); // Convert to hours
  }, 0);

  return totalLatency / reviewedRequests.length;
}

/**
 * Count compliance alerts by time period
 */
function countAlerts(
  alerts: RiskCalculationInput['complianceAlerts'],
  periodMs: number,
  now: Date
): number {
  const cutoff = new Date(now.getTime() - periodMs);
  return alerts.filter((a) => a.createdAt >= cutoff).length;
}

/**
 * Count unresolved alerts
 */
function countUnresolvedAlerts(
  alerts: RiskCalculationInput['complianceAlerts']
): number {
  return alerts.filter((a) => !a.resolvedAt).length;
}

/**
 * Extract features from employer data for risk prediction
 *
 * @param input - Raw employer data for feature extraction
 * @returns Extracted features for risk model
 */
export function extractRiskFeatures(input: RiskCalculationInput): RiskFeatures {
  const now = new Date();

  // Calculate denial metrics
  const denialRate30Days = calculateDenialRate(input.requests, DAYS_30, now);
  const denialRate90Days = calculateDenialRate(input.requests, DAYS_90, now);
  const denialRateYear = calculateDenialRate(input.requests, DAYS_365, now);
  const denialTrend = calculateDenialTrend(input.requests, now);
  const consecutiveDenials = countConsecutiveDenials(input.requests);

  // Calculate accrual metrics
  const avgAccrualUtilization = calculateAccrualUtilization(
    input.accrualBalances
  );

  // Calculate usage metrics
  const avgRequestsPerEmployee =
    input.employeeCount > 0 ? input.requests.length / input.employeeCount : 0;
  const requestApprovalLatency = calculateApprovalLatency(input.requests);

  // Calculate compliance metrics
  const policyViolations30Days = countAlerts(
    input.complianceAlerts,
    DAYS_30,
    now
  );
  const policyViolations90Days = countAlerts(
    input.complianceAlerts,
    DAYS_90,
    now
  );
  const complianceAlertCount = input.complianceAlerts.length;
  const unresolvedAlerts = countUnresolvedAlerts(input.complianceAlerts);

  return {
    tenantId: input.tenantId,
    extractedAt: now,

    // Denial metrics
    denialRate30Days,
    denialRate90Days,
    denialRateYear,
    denialTrend,
    consecutiveDenials,

    // Accrual metrics
    avgAccrualUtilization,
    accrualCalculationErrors: 0, // Would need additional data
    lateAccrualUpdates: 0, // Would need additional data

    // Usage metrics
    avgRequestsPerEmployee,
    requestApprovalLatency,
    peakUsageVariance: 0, // Would need time-series analysis

    // Documentation metrics (would need additional data)
    documentationRate: 1.0, // Default to compliant
    missingDocumentationCount: 0,
    documentationLateRate: 0,

    // Compliance metrics
    policyViolations30Days,
    policyViolations90Days,
    complianceAlertCount,
    unresolvedAlerts,

    // Record keeping metrics (would need additional data)
    recordRetentionCompliance: 1.0, // Default to compliant
    auditTrailGaps: 0,
    dataIntegrityIssues: 0,

    // Historical metrics (would need additional data)
    previousAuditFindings: 0,
    previousPenalties: 0,
    yearsInBusiness: 1,

    // Employee metrics
    employeeCount: input.employeeCount,
    employeeTurnoverRate: 0, // Would need historical employee data
    employeeComplaintRate: 0, // Would need complaint data

    // Size category
    isSmallEmployer: input.employerSize === 'small',
  };
}

/**
 * Validate extracted features for model prediction
 */
export function validateFeatures(features: RiskFeatures): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for NaN values
  if (Number.isNaN(features.denialRate30Days)) {
    errors.push('denialRate30Days is NaN');
  }
  if (Number.isNaN(features.denialRate90Days)) {
    errors.push('denialRate90Days is NaN');
  }
  if (Number.isNaN(features.avgAccrualUtilization)) {
    errors.push('avgAccrualUtilization is NaN');
  }

  // Check for valid ranges
  if (features.denialRate30Days < 0 || features.denialRate30Days > 1) {
    errors.push('denialRate30Days out of range [0, 1]');
  }
  if (features.denialRate90Days < 0 || features.denialRate90Days > 1) {
    errors.push('denialRate90Days out of range [0, 1]');
  }
  if (features.denialTrend < -1 || features.denialTrend > 1) {
    errors.push('denialTrend out of range [-1, 1]');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

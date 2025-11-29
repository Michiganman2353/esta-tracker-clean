/**
 * ESTA Score Predictive Risk Engine Service
 *
 * Server-side service that wraps the risk-engine library for backend use.
 * Provides data aggregation, caching, and integration with the data layer.
 *
 * @module riskEngineService
 */

import {
  extractRiskFeatures,
  calculateESTAScore,
  validateFeatures,
} from '@esta-tracker/risk-engine';

import type {
  ESTAScore,
  RiskCalculationInput,
  RiskFeatures,
  RiskAlert,
  RiskScoreHistory,
} from '@esta/shared-types';

import { randomUUID } from 'crypto';

// ============================================================================
// Risk Score Cache (in-memory for demo, would use Redis in production)
// ============================================================================

/**
 * Simple in-memory cache for risk scores with LRU-like eviction
 * In production, this should be replaced with Redis or similar
 */
const riskScoreCache = new Map<string, { score: ESTAScore; expiresAt: Date }>();

const CACHE_TTL_MS = 3600000; // 1 hour
const MAX_CACHE_SIZE = 1000; // Maximum number of cached scores

/**
 * Evict expired entries and oldest entries if cache is full
 */
function evictIfNeeded(): void {
  const now = new Date();

  // First, evict expired entries
  for (const [key, value] of riskScoreCache.entries()) {
    if (now > value.expiresAt) {
      riskScoreCache.delete(key);
    }
  }

  // If still over limit, evict oldest entries
  while (riskScoreCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = riskScoreCache.keys().next().value;
    if (oldestKey) {
      riskScoreCache.delete(oldestKey);
    } else {
      break;
    }
  }
}

/**
 * Get cached score if available and not expired
 */
function getCachedScore(tenantId: string): ESTAScore | null {
  const cached = riskScoreCache.get(tenantId);
  if (!cached) return null;

  if (new Date() > cached.expiresAt) {
    riskScoreCache.delete(tenantId);
    return null;
  }

  return cached.score;
}

/**
 * Cache a risk score with size limit enforcement
 */
function cacheScore(score: ESTAScore): void {
  evictIfNeeded();
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
  riskScoreCache.set(score.tenantId, { score, expiresAt });
}

/**
 * Clear cache for a tenant (e.g., when new data is added)
 */
export function clearScoreCache(tenantId: string): void {
  riskScoreCache.delete(tenantId);
}

// ============================================================================
// Risk Score History (in-memory for demo)
// ============================================================================

const riskScoreHistory = new Map<
  string,
  { score: number; calculatedAt: Date }[]
>();

/**
 * Store score in history
 */
function addToHistory(tenantId: string, score: number): void {
  const history = riskScoreHistory.get(tenantId) || [];
  history.push({ score, calculatedAt: new Date() });

  // Keep only last 365 days of history
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const filteredHistory = history.filter((h) => h.calculatedAt > cutoff);

  riskScoreHistory.set(tenantId, filteredHistory);
}

/**
 * Get score history for a tenant
 */
export function getScoreHistory(tenantId: string): RiskScoreHistory | null {
  const history = riskScoreHistory.get(tenantId);
  if (!history || history.length === 0) return null;

  const now = new Date();
  const cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const cutoff365 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const recent90 = history.filter((h) => h.calculatedAt >= cutoff90);
  const recent365 = history.filter((h) => h.calculatedAt >= cutoff365);

  const avgScore90Days =
    recent90.length > 0
      ? recent90.reduce((sum, h) => sum + h.score, 0) / recent90.length
      : 0;

  const avgScore365Days =
    recent365.length > 0
      ? recent365.reduce((sum, h) => sum + h.score, 0) / recent365.length
      : 0;

  // Determine trend
  let trend: 'improving' | 'stable' | 'worsening' = 'stable';
  if (recent90.length >= 2) {
    const recentAvg =
      recent90.slice(-5).reduce((sum, h) => sum + h.score, 0) /
      Math.min(5, recent90.length);
    const previousAvg =
      recent90.slice(0, -5).reduce((sum, h) => sum + h.score, 0) /
      Math.max(1, recent90.length - 5);

    if (recentAvg > previousAvg + 5) trend = 'worsening';
    else if (recentAvg < previousAvg - 5) trend = 'improving';
  }

  return {
    tenantId,
    scores: history.map((h) => ({
      date: h.calculatedAt,
      score: h.score,
      riskLevel:
        h.score >= 75
          ? 'critical'
          : h.score >= 50
            ? 'high'
            : h.score >= 25
              ? 'medium'
              : 'low',
      primaryDrivers: [],
    })),
    trend,
    avgScore90Days,
    avgScore365Days,
  };
}

// ============================================================================
// Risk Alerts (in-memory for demo)
// ============================================================================

const riskAlerts = new Map<string, RiskAlert[]>();

/**
 * Generate alerts based on score changes
 */
function generateAlerts(score: ESTAScore, previousScore?: number): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const now = new Date();

  // Check for significant score increase
  if (previousScore !== undefined && score.overallScore - previousScore >= 10) {
    alerts.push({
      id: randomUUID(),
      tenantId: score.tenantId,
      alertType: 'score_increase',
      severity: score.overallScore >= 50 ? 'critical' : 'warning',
      title: 'Risk Score Increased Significantly',
      message: `Your ESTA audit risk score increased by ${(score.overallScore - previousScore).toFixed(1)} points. Review the recommendations to reduce your risk.`,
      triggeredAt: now,
      relatedFactors: score.factors
        .filter((f) => f.score > 30)
        .map((f) => f.category),
      scoreImpact: score.overallScore - previousScore,
      isActive: true,
    });
  }

  // Check for high denial rate
  const denialFactor = score.factors.find((f) => f.category === 'denial_rate');
  if (denialFactor && denialFactor.score >= 50) {
    alerts.push({
      id: randomUUID(),
      tenantId: score.tenantId,
      alertType: 'denial_spike',
      severity: denialFactor.score >= 70 ? 'critical' : 'warning',
      title: 'High Denial Rate Detected',
      message: `Your sick time request denial rate is unusually high, which is a primary indicator for ESTA audit triggers.`,
      triggeredAt: now,
      relatedFactors: ['denial_rate'],
      scoreImpact: denialFactor.score * denialFactor.weight,
      isActive: true,
    });
  }

  // Check for threshold breach
  if (score.riskBracket.percentile >= 85) {
    alerts.push({
      id: randomUUID(),
      tenantId: score.tenantId,
      alertType: 'threshold_breach',
      severity: 'critical',
      title: `You're in the ${score.riskBracket.bracket} Risk Bracket`,
      message: score.riskBracket.description,
      triggeredAt: now,
      relatedFactors: score.factors
        .filter((f) => f.score > 40)
        .map((f) => f.category),
      scoreImpact: score.overallScore,
      isActive: true,
    });
  }

  // Store alerts
  const existingAlerts = riskAlerts.get(score.tenantId) || [];
  riskAlerts.set(score.tenantId, [...existingAlerts, ...alerts]);

  return alerts;
}

/**
 * Get active alerts for a tenant
 */
export function getActiveAlerts(tenantId: string): RiskAlert[] {
  const alerts = riskAlerts.get(tenantId) || [];
  return alerts.filter((a) => a.isActive);
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(
  tenantId: string,
  alertId: string
): RiskAlert | null {
  const alerts = riskAlerts.get(tenantId);
  if (!alerts) return null;

  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) return null;

  alert.acknowledgedAt = new Date();
  return alert;
}

/**
 * Resolve an alert
 */
export function resolveAlert(
  tenantId: string,
  alertId: string
): RiskAlert | null {
  const alerts = riskAlerts.get(tenantId);
  if (!alerts) return null;

  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) return null;

  alert.resolvedAt = new Date();
  alert.isActive = false;
  return alert;
}

// ============================================================================
// Main Risk Calculation Functions
// ============================================================================

/**
 * Calculate ESTA Score for an employer
 *
 * @param input - Risk calculation input data
 * @param forceRecalculate - Skip cache and force recalculation
 * @returns ESTA Score with risk assessment
 */
export function calculateEmployerRiskScore(
  input: RiskCalculationInput,
  forceRecalculate = false
): {
  score: ESTAScore;
  features: RiskFeatures;
  alerts: RiskAlert[];
  fromCache: boolean;
} {
  // Check cache first unless force recalculate
  if (!forceRecalculate) {
    const cached = getCachedScore(input.tenantId);
    if (cached) {
      return {
        score: cached,
        features: extractRiskFeatures(input), // Still extract fresh features for reference
        alerts: [],
        fromCache: true,
      };
    }
  }

  // Extract features
  const features = extractRiskFeatures(input);

  // Validate features
  const validation = validateFeatures(features);
  if (!validation.isValid) {
    throw new Error(
      `Invalid features extracted: ${validation.errors.join(', ')}`
    );
  }

  // Get previous score for comparison
  const history = getScoreHistory(input.tenantId);
  const previousScore =
    history && history.scores.length > 0
      ? {
          score: history.scores[history.scores.length - 1]!.score,
          calculatedAt: history.scores[history.scores.length - 1]!.date,
        }
      : undefined;

  // Calculate score
  const score = calculateESTAScore(features, previousScore);

  // Cache the result
  cacheScore(score);

  // Add to history
  addToHistory(input.tenantId, score.overallScore);

  // Generate alerts
  const alerts = generateAlerts(score, previousScore?.score);

  return {
    score,
    features,
    alerts,
    fromCache: false,
  };
}

/**
 * Get risk summary for dashboard display
 */
export function getRiskSummary(tenantId: string): {
  hasScore: boolean;
  score?: number;
  riskLevel?: string;
  riskBracket?: string;
  lastCalculated?: Date;
  activeAlerts: number;
  trend?: string;
} {
  const cached = getCachedScore(tenantId);
  const history = getScoreHistory(tenantId);
  const alerts = getActiveAlerts(tenantId);

  if (!cached) {
    return {
      hasScore: false,
      activeAlerts: alerts.length,
    };
  }

  return {
    hasScore: true,
    score: cached.overallScore,
    riskLevel: cached.riskLevel,
    riskBracket: cached.riskBracket.bracket,
    lastCalculated: cached.calculatedAt,
    activeAlerts: alerts.length,
    trend: history?.trend,
  };
}

/**
 * Format risk message for employer notification
 */
export function formatRiskMessage(score: ESTAScore): string {
  const lines: string[] = [];

  // Main risk bracket message
  lines.push(`📊 ESTA Audit Risk Assessment: ${score.riskBracket.description}`);
  lines.push('');

  // Overall score
  lines.push(`Overall Risk Score: ${score.overallScore.toFixed(1)}/100`);
  lines.push(`Risk Level: ${score.riskLevel.toUpperCase()}`);
  lines.push('');

  // Primary risk drivers
  if (score.primaryRiskDrivers.length > 0) {
    lines.push('⚠️ Primary Risk Drivers:');
    for (const driver of score.primaryRiskDrivers) {
      lines.push(`  • ${driver}`);
    }
    lines.push('');
  }

  // Top recommendations
  if (score.recommendations.length > 0) {
    lines.push('📋 Top Recommendations:');
    const topRecs = score.recommendations.slice(0, 3);
    for (const rec of topRecs) {
      lines.push(`  [${rec.priority.toUpperCase()}] ${rec.title}`);
    }
    lines.push('');
  }

  // Footer
  lines.push(`Analysis period: ${score.analysisPeriod.quarterLabel}`);
  lines.push(`Model version: ${score.modelVersion}`);

  return lines.join('\n');
}

/**
 * ESTA Score Predictive Risk Engine Types
 *
 * This module defines all types required for the ESTA audit risk prediction system.
 * The risk engine analyzes employer accrual patterns, denial rates, and compliance
 * behaviors to predict audit risk and provide preventive recommendations.
 *
 * @module risk
 */

import { z } from 'zod';

// ============================================================================
// Section 1: Risk Score Types
// ============================================================================

/**
 * Risk level categories for employer audit risk
 */
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

/**
 * Risk bracket percentiles for comparative analysis
 */
export const RiskBracketSchema = z.object({
  percentile: z.number().min(0).max(100),
  bracket: z.string(),
  description: z.string(),
});
export type RiskBracket = z.infer<typeof RiskBracketSchema>;

/**
 * Risk factor categories that contribute to overall ESTA score
 */
export const RiskFactorCategorySchema = z.enum([
  'denial_rate',
  'accrual_patterns',
  'usage_patterns',
  'documentation_compliance',
  'timeliness',
  'employee_complaints',
  'record_keeping',
  'policy_adherence',
]);
export type RiskFactorCategory = z.infer<typeof RiskFactorCategorySchema>;

/**
 * Individual risk factor with score and weight
 */
export interface RiskFactor {
  category: RiskFactorCategory;
  score: number; // 0-100 where 100 is highest risk
  weight: number; // Weight for weighted average calculation
  description: string;
  dataPoints: number; // Number of data points used for this factor
  trend: 'improving' | 'stable' | 'worsening';
  details?: Record<string, unknown>;
}

export const RiskFactorSchema = z.object({
  category: RiskFactorCategorySchema,
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  description: z.string(),
  dataPoints: z.number().min(0),
  trend: z.enum(['improving', 'stable', 'worsening']),
  details: z.record(z.unknown()).optional(),
});

// ============================================================================
// Section 2: Recommendation Types (defined before ESTAScore to avoid forward reference)
// ============================================================================

/**
 * Priority level for recommendations
 */
export const RecommendationPrioritySchema = z.enum([
  'critical',
  'high',
  'medium',
  'low',
]);
export type RecommendationPriority = z.infer<
  typeof RecommendationPrioritySchema
>;

/**
 * Risk recommendation for employers
 */
export interface RiskRecommendation {
  id: string;
  priority: RecommendationPriority;
  category: RiskFactorCategory;
  title: string;
  description: string;
  impact: string;
  estimatedScoreReduction: number; // How much this could reduce risk score
  actionItems: string[];
  deadline?: Date;
  resources?: string[];
}

export const RiskRecommendationSchema = z.object({
  id: z.string(),
  priority: RecommendationPrioritySchema,
  category: RiskFactorCategorySchema,
  title: z.string(),
  description: z.string(),
  impact: z.string(),
  estimatedScoreReduction: z.number().min(0).max(100),
  actionItems: z.array(z.string()),
  deadline: z.date().optional(),
  resources: z.array(z.string()).optional(),
});

// ============================================================================
// Section 3: ESTA Score Types
// ============================================================================

/**
 * Main ESTA Score result for an employer
 */
export interface ESTAScore {
  /** Unique identifier for this score calculation */
  id: string;

  /** Employer/tenant ID */
  tenantId: string;

  /** Overall risk score (0-100, higher = more risk) */
  overallScore: number;

  /** Risk level category */
  riskLevel: RiskLevel;

  /** Risk bracket percentile compared to all employers */
  riskBracket: RiskBracket;

  /** Individual risk factors contributing to the score */
  factors: RiskFactor[];

  /** Period analyzed */
  analysisPeriod: {
    startDate: Date;
    endDate: Date;
    quarterLabel: string; // e.g., "Q4 2025"
  };

  /** Primary risk drivers */
  primaryRiskDrivers: string[];

  /** Actionable recommendations */
  recommendations: RiskRecommendation[];

  /** Confidence level of the prediction (0-1) */
  confidence: number;

  /** Model version used for calculation */
  modelVersion: string;

  /** Calculation timestamp */
  calculatedAt: Date;

  /** Previous score for comparison */
  previousScore?: {
    score: number;
    calculatedAt: Date;
    change: number; // Positive = risk increased
  };
}

export const ESTAScoreSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  overallScore: z.number().min(0).max(100),
  riskLevel: RiskLevelSchema,
  riskBracket: RiskBracketSchema,
  factors: z.array(RiskFactorSchema),
  analysisPeriod: z.object({
    startDate: z.date(),
    endDate: z.date(),
    quarterLabel: z.string(),
  }),
  primaryRiskDrivers: z.array(z.string()),
  recommendations: z.array(RiskRecommendationSchema),
  confidence: z.number().min(0).max(1),
  modelVersion: z.string(),
  calculatedAt: z.date(),
  previousScore: z
    .object({
      score: z.number(),
      calculatedAt: z.date(),
      change: z.number(),
    })
    .optional(),
});

// ============================================================================
// Section 4: Feature Extraction Types (for ML Model)
// ============================================================================

/**
 * Features extracted for risk model training/prediction
 * These features are designed to be compatible with XGBoost
 */
export interface RiskFeatures {
  tenantId: string;
  extractedAt: Date;

  // Denial metrics
  denialRate30Days: number;
  denialRate90Days: number;
  denialRateYear: number;
  denialTrend: number; // -1 to 1, positive = increasing denials
  consecutiveDenials: number;

  // Accrual metrics
  avgAccrualUtilization: number; // 0-1, how much of accrued time is used
  accrualCalculationErrors: number;
  lateAccrualUpdates: number;

  // Usage metrics
  avgRequestsPerEmployee: number;
  requestApprovalLatency: number; // Hours to approve
  peakUsageVariance: number;

  // Documentation metrics
  documentationRate: number; // 0-1
  missingDocumentationCount: number;
  documentationLateRate: number;

  // Compliance metrics
  policyViolations30Days: number;
  policyViolations90Days: number;
  complianceAlertCount: number;
  unresolvedAlerts: number;

  // Record keeping metrics
  recordRetentionCompliance: number; // 0-1
  auditTrailGaps: number;
  dataIntegrityIssues: number;

  // Historical metrics
  previousAuditFindings: number;
  previousPenalties: number;
  yearsInBusiness: number;

  // Employee metrics
  employeeCount: number;
  employeeTurnoverRate: number;
  employeeComplaintRate: number;

  // Size category
  isSmallEmployer: boolean;
}

export const RiskFeaturesSchema = z.object({
  tenantId: z.string(),
  extractedAt: z.date(),

  denialRate30Days: z.number().min(0).max(1),
  denialRate90Days: z.number().min(0).max(1),
  denialRateYear: z.number().min(0).max(1),
  denialTrend: z.number().min(-1).max(1),
  consecutiveDenials: z.number().min(0),

  avgAccrualUtilization: z.number().min(0).max(1),
  accrualCalculationErrors: z.number().min(0),
  lateAccrualUpdates: z.number().min(0),

  avgRequestsPerEmployee: z.number().min(0),
  requestApprovalLatency: z.number().min(0),
  peakUsageVariance: z.number().min(0),

  documentationRate: z.number().min(0).max(1),
  missingDocumentationCount: z.number().min(0),
  documentationLateRate: z.number().min(0).max(1),

  policyViolations30Days: z.number().min(0),
  policyViolations90Days: z.number().min(0),
  complianceAlertCount: z.number().min(0),
  unresolvedAlerts: z.number().min(0),

  recordRetentionCompliance: z.number().min(0).max(1),
  auditTrailGaps: z.number().min(0),
  dataIntegrityIssues: z.number().min(0),

  previousAuditFindings: z.number().min(0),
  previousPenalties: z.number().min(0),
  yearsInBusiness: z.number().min(0),

  employeeCount: z.number().min(0),
  employeeTurnoverRate: z.number().min(0).max(1),
  employeeComplaintRate: z.number().min(0).max(1),

  isSmallEmployer: z.boolean(),
});

// ============================================================================
// Section 5: Aggregate Metrics for Analysis
// ============================================================================

/**
 * Aggregated denial statistics for an employer
 */
export interface DenialStatistics {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRequests: number;
  approvedCount: number;
  deniedCount: number;
  pendingCount: number;
  cancelledCount: number;
  denialRate: number;
  avgDenialResponseTime: number;
  topDenialReasons: { reason: string; count: number }[];
}

export const DenialStatisticsSchema = z.object({
  tenantId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  totalRequests: z.number().min(0),
  approvedCount: z.number().min(0),
  deniedCount: z.number().min(0),
  pendingCount: z.number().min(0),
  cancelledCount: z.number().min(0),
  denialRate: z.number().min(0).max(1),
  avgDenialResponseTime: z.number().min(0),
  topDenialReasons: z.array(
    z.object({
      reason: z.string(),
      count: z.number().min(0),
    })
  ),
});

/**
 * Accrual pattern analysis for an employer
 */
export interface AccrualPatternAnalysis {
  tenantId: string;
  periodStart: Date;
  periodEnd: Date;
  avgAccrualRate: number;
  accrualVariance: number;
  cappedEmployeeCount: number;
  zeroBalanceCount: number;
  excessiveAccrualCount: number;
  patternAnomalies: PatternAnomaly[];
}

export interface PatternAnomaly {
  type: 'spike' | 'drop' | 'irregular' | 'missing_data';
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedEmployees?: number;
}

export const PatternAnomalySchema = z.object({
  type: z.enum(['spike', 'drop', 'irregular', 'missing_data']),
  detectedAt: z.date(),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  affectedEmployees: z.number().min(0).optional(),
});

export const AccrualPatternAnalysisSchema = z.object({
  tenantId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  avgAccrualRate: z.number().min(0),
  accrualVariance: z.number().min(0),
  cappedEmployeeCount: z.number().min(0),
  zeroBalanceCount: z.number().min(0),
  excessiveAccrualCount: z.number().min(0),
  patternAnomalies: z.array(PatternAnomalySchema),
});

// ============================================================================
// Section 6: Risk Alert Types
// ============================================================================

/**
 * Real-time risk alert for immediate attention
 */
export interface RiskAlert {
  id: string;
  tenantId: string;
  alertType:
    | 'denial_spike'
    | 'compliance_violation'
    | 'pattern_anomaly'
    | 'score_increase'
    | 'threshold_breach';
  severity: 'warning' | 'critical';
  title: string;
  message: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  relatedFactors: RiskFactorCategory[];
  scoreImpact: number;
  isActive: boolean;
}

export const RiskAlertSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  alertType: z.enum([
    'denial_spike',
    'compliance_violation',
    'pattern_anomaly',
    'score_increase',
    'threshold_breach',
  ]),
  severity: z.enum(['warning', 'critical']),
  title: z.string(),
  message: z.string(),
  triggeredAt: z.date(),
  acknowledgedAt: z.date().optional(),
  resolvedAt: z.date().optional(),
  relatedFactors: z.array(RiskFactorCategorySchema),
  scoreImpact: z.number(),
  isActive: z.boolean(),
});

// ============================================================================
// Section 7: Historical Risk Data Types
// ============================================================================

/**
 * Historical risk score for trend analysis
 */
export interface RiskScoreHistory {
  tenantId: string;
  scores: {
    date: Date;
    score: number;
    riskLevel: RiskLevel;
    primaryDrivers: string[];
  }[];
  trend: 'improving' | 'stable' | 'worsening';
  avgScore90Days: number;
  avgScore365Days: number;
}

export const RiskScoreHistorySchema = z.object({
  tenantId: z.string(),
  scores: z.array(
    z.object({
      date: z.date(),
      score: z.number(),
      riskLevel: RiskLevelSchema,
      primaryDrivers: z.array(z.string()),
    })
  ),
  trend: z.enum(['improving', 'stable', 'worsening']),
  avgScore90Days: z.number(),
  avgScore365Days: z.number(),
});

// ============================================================================
// Section 8: Risk Calculation Input Types
// ============================================================================

/**
 * Input data required for risk score calculation
 */
export interface RiskCalculationInput {
  tenantId: string;
  employerId: string;
  employerSize: 'small' | 'large';
  employeeCount: number;

  // Request data for denial analysis
  requests: {
    id: string;
    status: 'pending' | 'approved' | 'denied' | 'cancelled';
    requestedAt: Date;
    reviewedAt?: Date;
    denialReason?: string;
  }[];

  // Accrual data for pattern analysis
  accrualBalances: {
    employeeId: string;
    currentBalance: number;
    yearlyAccrued: number;
    yearlyUsed: number;
    lastUpdated: Date;
  }[];

  // Compliance data
  complianceAlerts: {
    id: string;
    alertType: string;
    severity: string;
    createdAt: Date;
    resolvedAt?: Date;
  }[];

  // Historical data
  previousScores?: {
    score: number;
    calculatedAt: Date;
  }[];
}

export const RiskCalculationInputSchema = z.object({
  tenantId: z.string(),
  employerId: z.string(),
  employerSize: z.enum(['small', 'large']),
  employeeCount: z.number().min(0),
  requests: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['pending', 'approved', 'denied', 'cancelled']),
      requestedAt: z.date(),
      reviewedAt: z.date().optional(),
      denialReason: z.string().optional(),
    })
  ),
  accrualBalances: z.array(
    z.object({
      employeeId: z.string(),
      currentBalance: z.number(),
      yearlyAccrued: z.number(),
      yearlyUsed: z.number(),
      lastUpdated: z.date(),
    })
  ),
  complianceAlerts: z.array(
    z.object({
      id: z.string(),
      alertType: z.string(),
      severity: z.string(),
      createdAt: z.date(),
      resolvedAt: z.date().optional(),
    })
  ),
  previousScores: z
    .array(
      z.object({
        score: z.number(),
        calculatedAt: z.date(),
      })
    )
    .optional(),
});

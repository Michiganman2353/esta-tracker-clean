/**
 * Risk Calculator Module
 *
 * Calculates ESTA audit risk scores based on extracted features.
 * Uses weighted scoring with configurable thresholds to identify
 * high-risk employers and provide preventive recommendations.
 *
 * @module riskCalculator
 */

import type {
  ESTAScore,
  RiskBracket,
  RiskFactor,
  RiskFactorCategory,
  RiskFeatures,
  RiskLevel,
  RiskRecommendation,
  RecommendationPriority,
} from '@esta/shared-types';
import { randomUUID } from 'crypto';

/**
 * Model version for tracking changes
 */
export const MODEL_VERSION = '1.0.0';

/**
 * Risk factor weights for weighted average calculation
 * Higher weight = more impact on overall score
 */
const FACTOR_WEIGHTS: Record<RiskFactorCategory, number> = {
  denial_rate: 0.25, // High denials are major risk indicator
  accrual_patterns: 0.15,
  usage_patterns: 0.1,
  documentation_compliance: 0.15,
  timeliness: 0.1,
  employee_complaints: 0.1,
  record_keeping: 0.1,
  policy_adherence: 0.05,
};

/**
 * Thresholds for risk level determination
 */
const RISK_THRESHOLDS = {
  critical: 75,
  high: 50,
  medium: 25,
};

/**
 * Accrual utilization thresholds for pattern analysis
 */
const ACCRUAL_UTILIZATION_THRESHOLDS = {
  veryLow: 0.1, // Below this = potential tracking issues
  veryHigh: 0.9, // Above this = high usage (normal)
  veryLowScore: 50, // Risk score for very low utilization
  veryHighScore: 30, // Risk score for very high utilization
};

/**
 * Turnover rate thresholds indicating systemic issues
 */
const TURNOVER_THRESHOLDS = {
  high: 0.3, // Above 30% = high turnover
  medium: 0.2, // Above 20% = medium turnover
  highScore: 30, // Risk score for high turnover
  mediumScore: 15, // Risk score for medium turnover
};

/**
 * Risk bracket percentile descriptions
 */
const RISK_BRACKETS: Record<number, RiskBracket> = {
  92: {
    percentile: 92,
    bracket: 'top 8%',
    description:
      'You are in the top 8% risk bracket for an ESTA audit this quarter',
  },
  85: {
    percentile: 85,
    bracket: 'top 15%',
    description:
      'You are in the top 15% risk bracket for an ESTA audit this quarter',
  },
  75: {
    percentile: 75,
    bracket: 'top 25%',
    description:
      'You are in the top 25% risk bracket for an ESTA audit this quarter',
  },
  50: {
    percentile: 50,
    bracket: 'above average',
    description: 'Your audit risk is above average compared to other employers',
  },
  25: {
    percentile: 25,
    bracket: 'below average',
    description: 'Your audit risk is below average - good compliance practices',
  },
  10: {
    percentile: 10,
    bracket: 'low risk',
    description: 'Excellent compliance - you are in the lowest risk bracket',
  },
};

/**
 * Calculate denial rate factor score
 */
function calculateDenialRateFactor(features: RiskFeatures): RiskFactor {
  // Weight recent denials more heavily
  const weightedDenialRate =
    features.denialRate30Days * 0.5 +
    features.denialRate90Days * 0.3 +
    features.denialRateYear * 0.2;

  // Add penalty for consecutive denials
  const consecutivePenalty = Math.min(features.consecutiveDenials * 5, 20);

  // Add penalty for worsening trend
  const trendPenalty = features.denialTrend > 0 ? features.denialTrend * 15 : 0;

  // Calculate base score (0-100)
  let score = weightedDenialRate * 100 + consecutivePenalty + trendPenalty;
  score = Math.min(100, Math.max(0, score));

  // Determine trend
  let trend: 'improving' | 'stable' | 'worsening' = 'stable';
  if (features.denialTrend > 0.1) trend = 'worsening';
  else if (features.denialTrend < -0.1) trend = 'improving';

  return {
    category: 'denial_rate',
    score,
    weight: FACTOR_WEIGHTS.denial_rate,
    description: `Denial rate: ${(weightedDenialRate * 100).toFixed(1)}% (${features.consecutiveDenials} consecutive denials)`,
    dataPoints: 1, // Would be actual request count
    trend,
    details: {
      denialRate30Days: features.denialRate30Days,
      denialRate90Days: features.denialRate90Days,
      denialRateYear: features.denialRateYear,
      consecutiveDenials: features.consecutiveDenials,
      denialTrend: features.denialTrend,
    },
  };
}

/**
 * Calculate accrual patterns factor score
 */
function calculateAccrualPatternsFactor(features: RiskFeatures): RiskFactor {
  // Low utilization could indicate accrual tracking issues
  const utilizationScore =
    features.avgAccrualUtilization < ACCRUAL_UTILIZATION_THRESHOLDS.veryLow
      ? ACCRUAL_UTILIZATION_THRESHOLDS.veryLowScore // Very low usage might indicate tracking problems
      : features.avgAccrualUtilization > ACCRUAL_UTILIZATION_THRESHOLDS.veryHigh
        ? ACCRUAL_UTILIZATION_THRESHOLDS.veryHighScore // High usage is normal
        : 0; // Normal utilization

  // Calculation errors and late updates
  const errorScore = Math.min(features.accrualCalculationErrors * 10, 30);
  const lateUpdateScore = Math.min(features.lateAccrualUpdates * 5, 20);

  const score = Math.min(
    100,
    Math.max(0, utilizationScore + errorScore + lateUpdateScore)
  );

  return {
    category: 'accrual_patterns',
    score,
    weight: FACTOR_WEIGHTS.accrual_patterns,
    description: `Accrual utilization: ${(features.avgAccrualUtilization * 100).toFixed(1)}%`,
    dataPoints: 1,
    trend: 'stable',
    details: {
      avgAccrualUtilization: features.avgAccrualUtilization,
      accrualCalculationErrors: features.accrualCalculationErrors,
      lateAccrualUpdates: features.lateAccrualUpdates,
    },
  };
}

/**
 * Calculate usage patterns factor score
 */
function calculateUsagePatternsFactor(features: RiskFeatures): RiskFactor {
  // Very high or very low request rates could indicate issues
  let requestScore = 0;
  if (features.avgRequestsPerEmployee > 10) {
    requestScore = 30; // Unusually high
  } else if (features.avgRequestsPerEmployee < 0.5) {
    requestScore = 20; // Unusually low might indicate underutilization
  }

  const varianceScore = Math.min(features.peakUsageVariance * 10, 30);

  const score = Math.min(100, Math.max(0, requestScore + varianceScore));

  return {
    category: 'usage_patterns',
    score,
    weight: FACTOR_WEIGHTS.usage_patterns,
    description: `Avg requests per employee: ${features.avgRequestsPerEmployee.toFixed(2)}`,
    dataPoints: 1,
    trend: 'stable',
    details: {
      avgRequestsPerEmployee: features.avgRequestsPerEmployee,
      peakUsageVariance: features.peakUsageVariance,
    },
  };
}

/**
 * Calculate documentation compliance factor score
 */
function calculateDocumentationFactor(features: RiskFeatures): RiskFactor {
  // Documentation rate score (inverted - lower rate = higher risk)
  const documentationScore = (1 - features.documentationRate) * 50;

  // Missing documentation penalty
  const missingPenalty = Math.min(features.missingDocumentationCount * 5, 30);

  // Late documentation penalty
  const latePenalty = features.documentationLateRate * 20;

  const score = Math.min(
    100,
    Math.max(0, documentationScore + missingPenalty + latePenalty)
  );

  return {
    category: 'documentation_compliance',
    score,
    weight: FACTOR_WEIGHTS.documentation_compliance,
    description: `Documentation rate: ${(features.documentationRate * 100).toFixed(1)}%`,
    dataPoints: 1,
    trend: 'stable',
    details: {
      documentationRate: features.documentationRate,
      missingDocumentationCount: features.missingDocumentationCount,
      documentationLateRate: features.documentationLateRate,
    },
  };
}

/**
 * Calculate timeliness factor score
 */
function calculateTimelinessFactor(features: RiskFeatures): RiskFactor {
  // Approval latency scoring (in hours)
  let latencyScore = 0;
  if (features.requestApprovalLatency > 72) {
    latencyScore = 60; // More than 3 days
  } else if (features.requestApprovalLatency > 48) {
    latencyScore = 40; // More than 2 days
  } else if (features.requestApprovalLatency > 24) {
    latencyScore = 20; // More than 1 day
  }

  const score = Math.min(100, Math.max(0, latencyScore));

  return {
    category: 'timeliness',
    score,
    weight: FACTOR_WEIGHTS.timeliness,
    description: `Avg approval time: ${features.requestApprovalLatency.toFixed(1)} hours`,
    dataPoints: 1,
    trend: 'stable',
    details: {
      requestApprovalLatency: features.requestApprovalLatency,
    },
  };
}

/**
 * Calculate employee complaints factor score
 */
function calculateEmployeeComplaintsFactor(features: RiskFeatures): RiskFactor {
  // Complaint rate directly translates to risk
  const complaintScore = features.employeeComplaintRate * 100;

  // Turnover can indicate systemic issues
  const turnoverScore =
    features.employeeTurnoverRate > TURNOVER_THRESHOLDS.high
      ? TURNOVER_THRESHOLDS.highScore
      : features.employeeTurnoverRate > TURNOVER_THRESHOLDS.medium
        ? TURNOVER_THRESHOLDS.mediumScore
        : 0;

  const score = Math.min(100, Math.max(0, complaintScore + turnoverScore));

  return {
    category: 'employee_complaints',
    score,
    weight: FACTOR_WEIGHTS.employee_complaints,
    description: `Complaint rate: ${(features.employeeComplaintRate * 100).toFixed(1)}%`,
    dataPoints: 1,
    trend: 'stable',
    details: {
      employeeComplaintRate: features.employeeComplaintRate,
      employeeTurnoverRate: features.employeeTurnoverRate,
    },
  };
}

/**
 * Calculate record keeping factor score
 */
function calculateRecordKeepingFactor(features: RiskFeatures): RiskFactor {
  // Retention compliance (inverted)
  const retentionScore = (1 - features.recordRetentionCompliance) * 50;

  // Audit trail gaps
  const gapScore = Math.min(features.auditTrailGaps * 10, 30);

  // Data integrity issues
  const integrityScore = Math.min(features.dataIntegrityIssues * 10, 20);

  const score = Math.min(
    100,
    Math.max(0, retentionScore + gapScore + integrityScore)
  );

  return {
    category: 'record_keeping',
    score,
    weight: FACTOR_WEIGHTS.record_keeping,
    description: `Record retention compliance: ${(features.recordRetentionCompliance * 100).toFixed(1)}%`,
    dataPoints: 1,
    trend: 'stable',
    details: {
      recordRetentionCompliance: features.recordRetentionCompliance,
      auditTrailGaps: features.auditTrailGaps,
      dataIntegrityIssues: features.dataIntegrityIssues,
    },
  };
}

/**
 * Calculate policy adherence factor score
 */
function calculatePolicyAdherenceFactor(features: RiskFeatures): RiskFactor {
  // Policy violations
  const violationScore30 = Math.min(features.policyViolations30Days * 15, 40);
  const violationScore90 = Math.min(features.policyViolations90Days * 5, 20);

  // Unresolved alerts
  const unresolvedScore = Math.min(features.unresolvedAlerts * 10, 40);

  const score = Math.min(
    100,
    Math.max(0, violationScore30 + violationScore90 + unresolvedScore)
  );

  return {
    category: 'policy_adherence',
    score,
    weight: FACTOR_WEIGHTS.policy_adherence,
    description: `Policy violations (30d): ${features.policyViolations30Days}, Unresolved alerts: ${features.unresolvedAlerts}`,
    dataPoints: 1,
    trend:
      features.policyViolations30Days > features.policyViolations90Days / 3
        ? 'worsening'
        : 'stable',
    details: {
      policyViolations30Days: features.policyViolations30Days,
      policyViolations90Days: features.policyViolations90Days,
      unresolvedAlerts: features.unresolvedAlerts,
    },
  };
}

/**
 * Calculate all risk factors from features
 */
export function calculateRiskFactors(features: RiskFeatures): RiskFactor[] {
  return [
    calculateDenialRateFactor(features),
    calculateAccrualPatternsFactor(features),
    calculateUsagePatternsFactor(features),
    calculateDocumentationFactor(features),
    calculateTimelinessFactor(features),
    calculateEmployeeComplaintsFactor(features),
    calculateRecordKeepingFactor(features),
    calculatePolicyAdherenceFactor(features),
  ];
}

/**
 * Calculate overall risk score from factors
 */
export function calculateOverallScore(factors: RiskFactor[]): number {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return weightedSum / totalWeight;
}

/**
 * Determine risk level from overall score
 */
export function determineRiskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.critical) return 'critical';
  if (score >= RISK_THRESHOLDS.high) return 'high';
  if (score >= RISK_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * Determine risk bracket from overall score
 */
export function determineRiskBracket(score: number): RiskBracket {
  // Map score to percentile (higher score = higher percentile)
  if (score >= 80) return RISK_BRACKETS[92]!;
  if (score >= 65) return RISK_BRACKETS[85]!;
  if (score >= 50) return RISK_BRACKETS[75]!;
  if (score >= 35) return RISK_BRACKETS[50]!;
  if (score >= 20) return RISK_BRACKETS[25]!;
  return RISK_BRACKETS[10]!;
}

/**
 * Identify primary risk drivers from factors
 */
export function identifyPrimaryRiskDrivers(factors: RiskFactor[]): string[] {
  // Sort factors by contribution (score * weight)
  const sortedFactors = [...factors].sort(
    (a, b) => b.score * b.weight - a.score * a.weight
  );

  // Return top 3 drivers with significant scores
  return sortedFactors
    .filter((f) => f.score > 20)
    .slice(0, 3)
    .map((f) => {
      const categoryName = f.category.replace(/_/g, ' ');
      return `High ${categoryName}: ${f.description}`;
    });
}

/**
 * Generate recommendations based on risk factors
 */
export function generateRecommendations(
  factors: RiskFactor[],
  _riskLevel: RiskLevel
): RiskRecommendation[] {
  const recommendations: RiskRecommendation[] = [];

  // Sort factors by score to prioritize recommendations
  const sortedFactors = [...factors].sort((a, b) => b.score - a.score);

  for (const factor of sortedFactors) {
    if (factor.score < 20) continue; // Skip low-risk factors

    let priority: RecommendationPriority;
    if (factor.score >= 70) priority = 'critical';
    else if (factor.score >= 50) priority = 'high';
    else if (factor.score >= 35) priority = 'medium';
    else priority = 'low';

    const recommendation = createRecommendation(factor, priority);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  // Limit to top 5 recommendations
  return recommendations.slice(0, 5);
}

/**
 * Create a recommendation based on a risk factor
 */
function createRecommendation(
  factor: RiskFactor,
  priority: RecommendationPriority
): RiskRecommendation | null {
  const recommendations: Record<RiskFactorCategory, () => RiskRecommendation> =
    {
      denial_rate: () => ({
        id: randomUUID(),
        priority,
        category: 'denial_rate',
        title: 'Reduce Sick Time Request Denials',
        description:
          'High denial rates are a primary indicator of potential ESTA violations and audit triggers.',
        impact:
          'Reducing denial rate by 10% could lower your risk score significantly.',
        estimatedScoreReduction: Math.min(factor.score * 0.3, 15),
        actionItems: [
          'Review denial reasons and ensure they comply with ESTA requirements',
          'Train managers on valid grounds for denial under Michigan ESTA',
          'Implement pre-approval documentation requirements',
          'Consider automatic approval for requests meeting documentation criteria',
        ],
        resources: ['ESTA Compliance Guide', 'Manager Training Materials'],
      }),

      accrual_patterns: () => ({
        id: randomUUID(),
        priority,
        category: 'accrual_patterns',
        title: 'Improve Accrual Tracking Accuracy',
        description:
          'Irregular accrual patterns may indicate calculation errors or policy inconsistencies.',
        impact:
          'Accurate accrual tracking ensures compliance and reduces audit risk.',
        estimatedScoreReduction: Math.min(factor.score * 0.25, 10),
        actionItems: [
          'Audit current accrual calculations against ESTA requirements',
          'Verify accrual rates match employer size requirements',
          'Implement automated accrual tracking if not already in place',
          'Review carryover policies for compliance',
        ],
      }),

      documentation_compliance: () => ({
        id: randomUUID(),
        priority,
        category: 'documentation_compliance',
        title: 'Strengthen Documentation Practices',
        description:
          'Missing or late documentation increases audit risk and compliance exposure.',
        impact:
          'Complete documentation is required for ESTA record-keeping compliance.',
        estimatedScoreReduction: Math.min(factor.score * 0.25, 12),
        actionItems: [
          'Require documentation upload at time of request submission',
          'Set up automated reminders for pending documentation',
          'Create standardized documentation templates',
          'Implement document retention policies meeting ESTA requirements',
        ],
      }),

      timeliness: () => ({
        id: randomUUID(),
        priority,
        category: 'timeliness',
        title: 'Reduce Request Processing Time',
        description:
          'Slow response times to sick time requests may indicate process inefficiencies.',
        impact:
          'Faster processing improves employee experience and reduces complaints.',
        estimatedScoreReduction: Math.min(factor.score * 0.2, 8),
        actionItems: [
          'Set up automated notifications for pending requests',
          'Establish maximum response time SLAs',
          'Enable mobile approval for managers',
          'Consider delegated approval authority',
        ],
      }),

      employee_complaints: () => ({
        id: randomUUID(),
        priority,
        category: 'employee_complaints',
        title: 'Address Employee Concerns',
        description:
          'Employee complaints are tracked by regulators and increase audit likelihood.',
        impact:
          'Proactive complaint resolution demonstrates good faith compliance.',
        estimatedScoreReduction: Math.min(factor.score * 0.3, 15),
        actionItems: [
          'Review and respond to all pending complaints within 48 hours',
          'Implement anonymous feedback mechanism',
          'Conduct exit interviews focusing on sick time policies',
          'Train HR on complaint handling procedures',
        ],
      }),

      record_keeping: () => ({
        id: randomUUID(),
        priority,
        category: 'record_keeping',
        title: 'Enhance Record Keeping Practices',
        description:
          'Record keeping gaps expose employers to significant compliance risk.',
        impact: 'ESTA requires 3+ years of record retention with audit trail.',
        estimatedScoreReduction: Math.min(factor.score * 0.25, 12),
        actionItems: [
          'Verify all records meet ESTA retention requirements',
          'Implement immutable audit logging for all changes',
          'Set up automated backup and archival procedures',
          'Conduct quarterly record-keeping audits',
        ],
      }),

      policy_adherence: () => ({
        id: randomUUID(),
        priority,
        category: 'policy_adherence',
        title: 'Resolve Outstanding Policy Violations',
        description:
          'Unresolved policy violations compound audit risk over time.',
        impact:
          'Prompt violation resolution demonstrates compliance commitment.',
        estimatedScoreReduction: Math.min(factor.score * 0.2, 10),
        actionItems: [
          'Review and resolve all unresolved compliance alerts',
          'Update policies to match current ESTA requirements',
          'Communicate policy changes to all employees',
          'Schedule regular policy compliance reviews',
        ],
      }),

      usage_patterns: () => ({
        id: randomUUID(),
        priority,
        category: 'usage_patterns',
        title: 'Monitor Unusual Usage Patterns',
        description:
          'Unusual usage patterns may indicate policy confusion or abuse.',
        impact: 'Understanding usage helps optimize policies and reduce abuse.',
        estimatedScoreReduction: Math.min(factor.score * 0.15, 8),
        actionItems: [
          'Review requests with unusual patterns',
          'Communicate sick time policies clearly to all employees',
          'Analyze peak usage periods for staffing planning',
          'Consider seasonal policy adjustments if appropriate',
        ],
      }),
    };

  const generator = recommendations[factor.category];
  return generator ? generator() : null;
}

/**
 * Calculate ESTA Score from features
 */
export function calculateESTAScore(
  features: RiskFeatures,
  previousScore?: { score: number; calculatedAt: Date }
): ESTAScore {
  const factors = calculateRiskFactors(features);
  const overallScore = calculateOverallScore(factors);
  const riskLevel = determineRiskLevel(overallScore);
  const riskBracket = determineRiskBracket(overallScore);
  const primaryRiskDrivers = identifyPrimaryRiskDrivers(factors);
  const recommendations = generateRecommendations(factors, riskLevel);

  // Calculate quarter label
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  const quarterLabel = `Q${quarter} ${now.getFullYear()}`;

  // Calculate confidence based on data completeness
  const dataPoints = factors.reduce((sum, f) => sum + f.dataPoints, 0);
  const confidence = Math.min(0.95, 0.5 + dataPoints * 0.05);

  // Calculate period (last 90 days)
  const periodEnd = now;
  const periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  return {
    id: randomUUID(),
    tenantId: features.tenantId,
    overallScore,
    riskLevel,
    riskBracket,
    factors,
    analysisPeriod: {
      startDate: periodStart,
      endDate: periodEnd,
      quarterLabel,
    },
    primaryRiskDrivers,
    recommendations,
    confidence,
    modelVersion: MODEL_VERSION,
    calculatedAt: now,
    previousScore: previousScore
      ? {
          score: previousScore.score,
          calculatedAt: previousScore.calculatedAt,
          change: overallScore - previousScore.score,
        }
      : undefined,
  };
}

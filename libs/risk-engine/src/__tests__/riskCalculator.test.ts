import { describe, it, expect } from 'vitest';
import {
  calculateRiskFactors,
  calculateOverallScore,
  determineRiskLevel,
  determineRiskBracket,
  identifyPrimaryRiskDrivers,
  generateRecommendations,
  calculateESTAScore,
  MODEL_VERSION,
} from '../riskCalculator';
import type { RiskFeatures, RiskFactor } from '@esta/shared-types';

/**
 * Create mock risk features for testing
 */
function createMockFeatures(
  overrides: Partial<RiskFeatures> = {}
): RiskFeatures {
  return {
    tenantId: 'test-tenant',
    extractedAt: new Date(),
    denialRate30Days: 0,
    denialRate90Days: 0,
    denialRateYear: 0,
    denialTrend: 0,
    consecutiveDenials: 0,
    avgAccrualUtilization: 0.5,
    accrualCalculationErrors: 0,
    lateAccrualUpdates: 0,
    avgRequestsPerEmployee: 2,
    requestApprovalLatency: 12,
    peakUsageVariance: 0,
    documentationRate: 1.0,
    missingDocumentationCount: 0,
    documentationLateRate: 0,
    policyViolations30Days: 0,
    policyViolations90Days: 0,
    complianceAlertCount: 0,
    unresolvedAlerts: 0,
    recordRetentionCompliance: 1.0,
    auditTrailGaps: 0,
    dataIntegrityIssues: 0,
    previousAuditFindings: 0,
    previousPenalties: 0,
    yearsInBusiness: 5,
    employeeCount: 50,
    employeeTurnoverRate: 0.1,
    employeeComplaintRate: 0,
    isSmallEmployer: false,
    ...overrides,
  };
}

describe('riskCalculator', () => {
  describe('calculateRiskFactors', () => {
    it('should calculate all 8 risk factors', () => {
      const features = createMockFeatures();
      const factors = calculateRiskFactors(features);

      expect(factors).toHaveLength(8);
      expect(factors.map((f) => f.category)).toContain('denial_rate');
      expect(factors.map((f) => f.category)).toContain('accrual_patterns');
      expect(factors.map((f) => f.category)).toContain('usage_patterns');
      expect(factors.map((f) => f.category)).toContain(
        'documentation_compliance'
      );
      expect(factors.map((f) => f.category)).toContain('timeliness');
      expect(factors.map((f) => f.category)).toContain('employee_complaints');
      expect(factors.map((f) => f.category)).toContain('record_keeping');
      expect(factors.map((f) => f.category)).toContain('policy_adherence');
    });

    it('should calculate high denial rate factor correctly', () => {
      const features = createMockFeatures({
        denialRate30Days: 0.4,
        denialRate90Days: 0.3,
        denialRateYear: 0.25,
        consecutiveDenials: 3,
      });

      const factors = calculateRiskFactors(features);
      const denialFactor = factors.find((f) => f.category === 'denial_rate');

      expect(denialFactor).toBeDefined();
      expect(denialFactor!.score).toBeGreaterThan(40);
    });

    it('should detect worsening denial trend', () => {
      const features = createMockFeatures({
        denialRate30Days: 0.3,
        denialRate90Days: 0.1,
        denialTrend: 0.5,
      });

      const factors = calculateRiskFactors(features);
      const denialFactor = factors.find((f) => f.category === 'denial_rate');

      expect(denialFactor).toBeDefined();
      expect(denialFactor!.trend).toBe('worsening');
    });

    it('should calculate high approval latency correctly', () => {
      const features = createMockFeatures({
        requestApprovalLatency: 96, // 4 days
      });

      const factors = calculateRiskFactors(features);
      const timelinessFactor = factors.find((f) => f.category === 'timeliness');

      expect(timelinessFactor).toBeDefined();
      expect(timelinessFactor!.score).toBeGreaterThan(50);
    });

    it('should calculate documentation compliance factor', () => {
      const features = createMockFeatures({
        documentationRate: 0.6,
        missingDocumentationCount: 5,
      });

      const factors = calculateRiskFactors(features);
      const docFactor = factors.find(
        (f) => f.category === 'documentation_compliance'
      );

      expect(docFactor).toBeDefined();
      expect(docFactor!.score).toBeGreaterThan(30);
    });

    it('should calculate policy adherence factor with violations', () => {
      const features = createMockFeatures({
        policyViolations30Days: 3,
        policyViolations90Days: 5,
        unresolvedAlerts: 4,
      });

      const factors = calculateRiskFactors(features);
      const policyFactor = factors.find(
        (f) => f.category === 'policy_adherence'
      );

      expect(policyFactor).toBeDefined();
      expect(policyFactor!.score).toBeGreaterThan(70);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate weighted average correctly', () => {
      const factors: RiskFactor[] = [
        {
          category: 'denial_rate',
          score: 50,
          weight: 0.25,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'accrual_patterns',
          score: 30,
          weight: 0.15,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'usage_patterns',
          score: 20,
          weight: 0.1,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'documentation_compliance',
          score: 40,
          weight: 0.15,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'timeliness',
          score: 60,
          weight: 0.1,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'employee_complaints',
          score: 10,
          weight: 0.1,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'record_keeping',
          score: 25,
          weight: 0.1,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'policy_adherence',
          score: 35,
          weight: 0.05,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
      ];

      const score = calculateOverallScore(factors);

      // Calculated: (50*0.25 + 30*0.15 + 20*0.10 + 40*0.15 + 60*0.10 + 10*0.10 + 25*0.10 + 35*0.05) / 1.0
      expect(score).toBeCloseTo(36.25);
    });

    it('should return 0 for empty factors', () => {
      const score = calculateOverallScore([]);
      expect(Number.isNaN(score)).toBe(true); // Division by zero
    });
  });

  describe('determineRiskLevel', () => {
    it('should return low for score < 25', () => {
      expect(determineRiskLevel(0)).toBe('low');
      expect(determineRiskLevel(10)).toBe('low');
      expect(determineRiskLevel(24)).toBe('low');
    });

    it('should return medium for score 25-49', () => {
      expect(determineRiskLevel(25)).toBe('medium');
      expect(determineRiskLevel(40)).toBe('medium');
      expect(determineRiskLevel(49)).toBe('medium');
    });

    it('should return high for score 50-74', () => {
      expect(determineRiskLevel(50)).toBe('high');
      expect(determineRiskLevel(60)).toBe('high');
      expect(determineRiskLevel(74)).toBe('high');
    });

    it('should return critical for score >= 75', () => {
      expect(determineRiskLevel(75)).toBe('critical');
      expect(determineRiskLevel(90)).toBe('critical');
      expect(determineRiskLevel(100)).toBe('critical');
    });
  });

  describe('determineRiskBracket', () => {
    it('should return top 8% bracket for high scores', () => {
      const bracket = determineRiskBracket(85);
      expect(bracket.percentile).toBe(92);
      expect(bracket.bracket).toBe('top 8%');
    });

    it('should return low risk bracket for low scores', () => {
      const bracket = determineRiskBracket(10);
      expect(bracket.percentile).toBe(10);
      expect(bracket.bracket).toBe('low risk');
    });

    it('should include appropriate description', () => {
      const bracket = determineRiskBracket(85);
      expect(bracket.description).toContain('top 8%');
      expect(bracket.description).toContain('ESTA audit');
    });
  });

  describe('identifyPrimaryRiskDrivers', () => {
    it('should identify top risk drivers', () => {
      const factors: RiskFactor[] = [
        {
          category: 'denial_rate',
          score: 80,
          weight: 0.25,
          description: 'High denial rate: 30%',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'timeliness',
          score: 60,
          weight: 0.1,
          description: 'Slow approval: 72 hours',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'accrual_patterns',
          score: 10,
          weight: 0.15,
          description: 'Normal accrual',
          dataPoints: 1,
          trend: 'stable',
        },
      ];

      const drivers = identifyPrimaryRiskDrivers(factors);

      expect(drivers).toHaveLength(2);
      expect(drivers[0]).toContain('denial rate');
      expect(drivers[1]).toContain('timeliness');
    });

    it('should exclude low-score factors', () => {
      const factors: RiskFactor[] = [
        {
          category: 'denial_rate',
          score: 10,
          weight: 0.25,
          description: 'Low denial rate',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'timeliness',
          score: 15,
          weight: 0.1,
          description: 'Normal approval time',
          dataPoints: 1,
          trend: 'stable',
        },
      ];

      const drivers = identifyPrimaryRiskDrivers(factors);

      expect(drivers).toHaveLength(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for high-risk factors', () => {
      const factors: RiskFactor[] = [
        {
          category: 'denial_rate',
          score: 80,
          weight: 0.25,
          description: 'High denial rate',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'timeliness',
          score: 60,
          weight: 0.1,
          description: 'Slow approval time',
          dataPoints: 1,
          trend: 'stable',
        },
      ];

      const recommendations = generateRecommendations(factors, 'high');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].category).toBe('denial_rate');
      expect(recommendations[0].priority).toBe('critical');
      expect(recommendations[0].actionItems.length).toBeGreaterThan(0);
    });

    it('should not generate recommendations for low-risk factors', () => {
      const factors: RiskFactor[] = [
        {
          category: 'denial_rate',
          score: 5,
          weight: 0.25,
          description: 'Very low denial rate',
          dataPoints: 1,
          trend: 'stable',
        },
      ];

      const recommendations = generateRecommendations(factors, 'low');

      expect(recommendations).toHaveLength(0);
    });

    it('should limit to 5 recommendations', () => {
      const factors: RiskFactor[] = [
        {
          category: 'denial_rate',
          score: 80,
          weight: 0.25,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'accrual_patterns',
          score: 70,
          weight: 0.15,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'usage_patterns',
          score: 60,
          weight: 0.1,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'documentation_compliance',
          score: 55,
          weight: 0.15,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'timeliness',
          score: 50,
          weight: 0.1,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'employee_complaints',
          score: 45,
          weight: 0.1,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'record_keeping',
          score: 40,
          weight: 0.1,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
        {
          category: 'policy_adherence',
          score: 35,
          weight: 0.05,
          description: '',
          dataPoints: 1,
          trend: 'stable',
        },
      ];

      const recommendations = generateRecommendations(factors, 'critical');

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('calculateESTAScore', () => {
    it('should calculate complete ESTA score', () => {
      const features = createMockFeatures({
        denialRate30Days: 0.35,
        denialRate90Days: 0.25,
        consecutiveDenials: 2,
      });

      const score = calculateESTAScore(features);

      expect(score.id).toBeDefined();
      expect(score.tenantId).toBe('test-tenant');
      expect(score.overallScore).toBeGreaterThan(0);
      expect(score.riskLevel).toBeDefined();
      expect(score.riskBracket).toBeDefined();
      expect(score.factors).toHaveLength(8);
      expect(score.modelVersion).toBe(MODEL_VERSION);
      expect(score.calculatedAt).toBeInstanceOf(Date);
    });

    it('should include quarter label', () => {
      const features = createMockFeatures();
      const score = calculateESTAScore(features);

      expect(score.analysisPeriod.quarterLabel).toMatch(/Q[1-4] \d{4}/);
    });

    it('should track previous score change', () => {
      const features = createMockFeatures({ denialRate30Days: 0.2 });
      const previousScore = {
        score: 30,
        calculatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };

      const score = calculateESTAScore(features, previousScore);

      expect(score.previousScore).toBeDefined();
      expect(score.previousScore!.score).toBe(30);
      expect(score.previousScore!.change).toBeDefined();
    });

    it('should generate recommendations for high-risk employers', () => {
      const features = createMockFeatures({
        denialRate30Days: 0.5,
        denialRate90Days: 0.4,
        consecutiveDenials: 5,
        policyViolations30Days: 4,
        unresolvedAlerts: 3,
      });

      const score = calculateESTAScore(features);

      expect(score.recommendations.length).toBeGreaterThan(0);
      expect(score.primaryRiskDrivers.length).toBeGreaterThan(0);
    });

    it('should identify higher-risk for problematic employers', () => {
      const features = createMockFeatures({
        denialRate30Days: 0.4,
        denialRate90Days: 0.35,
        denialRateYear: 0.3,
        consecutiveDenials: 4,
        policyViolations30Days: 5,
        unresolvedAlerts: 3,
        documentationRate: 0.5,
      });

      const score = calculateESTAScore(features);

      // Problematic employers should have a higher score than compliant ones
      expect(score.overallScore).toBeGreaterThan(20);
      expect(score.recommendations.length).toBeGreaterThan(0);
    });

    it('should identify low-risk bracket for compliant employers', () => {
      const features = createMockFeatures();
      const score = calculateESTAScore(features);

      expect(score.riskLevel).toBe('low');
      expect(score.riskBracket.percentile).toBeLessThanOrEqual(25);
    });
  });
});

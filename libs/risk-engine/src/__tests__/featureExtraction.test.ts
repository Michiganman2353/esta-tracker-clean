import { describe, it, expect } from 'vitest';
import { extractRiskFeatures, validateFeatures } from '../featureExtraction';
import type { RiskCalculationInput } from '@esta/shared-types';

/**
 * Create mock risk calculation input for testing
 */
function createMockInput(
  overrides: Partial<RiskCalculationInput> = {}
): RiskCalculationInput {
  return {
    tenantId: 'test-tenant',
    employerId: 'test-employer',
    employerSize: 'large',
    employeeCount: 50,
    requests: [],
    accrualBalances: [],
    complianceAlerts: [],
    ...overrides,
  };
}

describe('featureExtraction', () => {
  describe('extractRiskFeatures', () => {
    it('should extract features from empty input', () => {
      const input = createMockInput();
      const features = extractRiskFeatures(input);

      expect(features.tenantId).toBe('test-tenant');
      expect(features.denialRate30Days).toBe(0);
      expect(features.denialRate90Days).toBe(0);
      expect(features.denialRateYear).toBe(0);
      expect(features.isSmallEmployer).toBe(false);
    });

    it('should calculate denial rate correctly', () => {
      const now = new Date();
      const input = createMockInput({
        requests: [
          {
            id: '1',
            status: 'approved',
            requestedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            id: '2',
            status: 'denied',
            requestedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          },
          {
            id: '3',
            status: 'approved',
            requestedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          },
          {
            id: '4',
            status: 'denied',
            requestedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      const features = extractRiskFeatures(input);

      // 2 denials out of 4 = 50% denial rate
      expect(features.denialRate30Days).toBe(0.5);
    });

    it('should handle small employer correctly', () => {
      const input = createMockInput({
        employerSize: 'small',
        employeeCount: 8,
      });

      const features = extractRiskFeatures(input);

      expect(features.isSmallEmployer).toBe(true);
      expect(features.employeeCount).toBe(8);
    });

    it('should count consecutive denials', () => {
      const now = new Date();
      const input = createMockInput({
        requests: [
          {
            id: '1',
            status: 'denied',
            requestedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            id: '2',
            status: 'denied',
            requestedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: '3',
            status: 'denied',
            requestedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: '4',
            status: 'approved',
            requestedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      const features = extractRiskFeatures(input);

      expect(features.consecutiveDenials).toBe(3);
    });

    it('should calculate accrual utilization', () => {
      const input = createMockInput({
        accrualBalances: [
          {
            employeeId: '1',
            currentBalance: 20,
            yearlyAccrued: 40,
            yearlyUsed: 20,
            lastUpdated: new Date(),
          },
          {
            employeeId: '2',
            currentBalance: 10,
            yearlyAccrued: 40,
            yearlyUsed: 30,
            lastUpdated: new Date(),
          },
        ],
      });

      const features = extractRiskFeatures(input);

      // (20/40 + 30/40) / 2 = (0.5 + 0.75) / 2 = 0.625
      expect(features.avgAccrualUtilization).toBeCloseTo(0.625);
    });

    it('should calculate approval latency in hours', () => {
      const now = new Date();
      const input = createMockInput({
        requests: [
          {
            id: '1',
            status: 'approved',
            requestedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
            reviewedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
          {
            id: '2',
            status: 'approved',
            requestedAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
            reviewedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          },
        ],
      });

      const features = extractRiskFeatures(input);

      // Both requests took 24 hours to approve
      expect(features.requestApprovalLatency).toBe(24);
    });

    it('should count compliance alerts', () => {
      const now = new Date();
      const input = createMockInput({
        complianceAlerts: [
          {
            id: '1',
            alertType: 'violation',
            severity: 'high',
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          },
          {
            id: '2',
            alertType: 'violation',
            severity: 'medium',
            createdAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
          },
          {
            id: '3',
            alertType: 'violation',
            severity: 'low',
            createdAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
            resolvedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      const features = extractRiskFeatures(input);

      expect(features.policyViolations30Days).toBe(1);
      expect(features.policyViolations90Days).toBe(2);
      expect(features.complianceAlertCount).toBe(3);
      expect(features.unresolvedAlerts).toBe(2);
    });

    it('should calculate average requests per employee', () => {
      const input = createMockInput({
        employeeCount: 10,
        requests: [
          { id: '1', status: 'approved', requestedAt: new Date() },
          { id: '2', status: 'approved', requestedAt: new Date() },
          { id: '3', status: 'denied', requestedAt: new Date() },
          { id: '4', status: 'approved', requestedAt: new Date() },
          { id: '5', status: 'approved', requestedAt: new Date() },
        ],
      });

      const features = extractRiskFeatures(input);

      expect(features.avgRequestsPerEmployee).toBe(0.5);
    });
  });

  describe('validateFeatures', () => {
    it('should validate valid features', () => {
      const input = createMockInput();
      const features = extractRiskFeatures(input);
      const result = validateFeatures(features);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect out of range denial rate', () => {
      const input = createMockInput();
      const features = extractRiskFeatures(input);

      // Force invalid value
      (features as Record<string, unknown>).denialRate30Days = 1.5;

      const result = validateFeatures(features);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('denialRate30Days out of range [0, 1]');
    });
  });
});

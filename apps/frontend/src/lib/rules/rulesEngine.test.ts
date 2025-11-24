import { describe, it, expect, beforeEach } from 'vitest';
import {
  RulesEngine,
  DEFAULT_POLICIES,
  type AccrualPolicy,
} from './rulesEngine';

describe('Rules Engine', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine();
  });

  describe('Default Policies', () => {
    it('should load default Michigan ESTA policies', () => {
      expect(engine.getPolicy('mi-esta-large-accrual-v1')).toBeDefined();
      expect(engine.getPolicy('mi-esta-small-accrual-v1')).toBeDefined();
      expect(engine.getPolicy('mi-esta-large-frontload-v1')).toBeDefined();
      expect(engine.getPolicy('mi-esta-small-frontload-v1')).toBeDefined();
    });

    it('should have correct rules for large employer accrual', () => {
      const policy = engine.getPolicy('mi-esta-large-accrual-v1');
      expect(policy).toBeDefined();
      expect(policy?.rules.accrualRate).toBe(1 / 30);
      expect(policy?.rules.maxPaidHoursPerYear).toBe(72);
      expect(policy?.employerSize).toBe('large');
    });

    it('should have correct rules for small employer accrual', () => {
      const policy = engine.getPolicy('mi-esta-small-accrual-v1');
      expect(policy).toBeDefined();
      expect(policy?.rules.accrualRate).toBe(1 / 30);
      expect(policy?.rules.maxPaidHoursPerYear).toBe(40);
      expect(policy?.employerSize).toBe('small');
    });

    it('should have correct rules for frontload policies', () => {
      const largePolicy = engine.getPolicy('mi-esta-large-frontload-v1');
      const smallPolicy = engine.getPolicy('mi-esta-small-frontload-v1');

      expect(largePolicy?.rules.frontloadAmount).toBe(72);
      expect(largePolicy?.rules.maxCarryover).toBe(0);
      expect(smallPolicy?.rules.frontloadAmount).toBe(40);
      expect(smallPolicy?.rules.maxCarryover).toBe(0);
    });
  });

  describe('Policy Retrieval', () => {
    it('should get policies by employer size', () => {
      const largePolicies = engine.getPoliciesByEmployerSize('large');
      const smallPolicies = engine.getPoliciesByEmployerSize('small');

      expect(largePolicies.length).toBeGreaterThan(0);
      expect(smallPolicies.length).toBeGreaterThan(0);
      expect(largePolicies.every((p) => p.employerSize === 'large')).toBe(true);
      expect(smallPolicies.every((p) => p.employerSize === 'small')).toBe(true);
    });

    it('should return undefined for non-existent policy', () => {
      const policy = engine.getPolicy('non-existent-policy');
      expect(policy).toBeUndefined();
    });
  });

  describe('Custom Policies', () => {
    it('should create custom policy from base policy', () => {
      const customPolicy = engine.createCustomPolicy(
        'tenant-123',
        'mi-esta-large-accrual-v1',
        {
          name: 'Custom Large Employer Policy',
          rules: {
            accrualRate: 1 / 25, // More generous
            maxPaidHoursPerYear: 80,
            maxCarryover: 80,
          },
        },
        'admin-user'
      );

      expect(customPolicy).toBeDefined();
      expect(customPolicy.name).toBe('Custom Large Employer Policy');
      expect(customPolicy.rules.accrualRate).toBe(1 / 25);
      expect(customPolicy.metadata.tenantId).toBe('tenant-123');
      expect(customPolicy.metadata.createdBy).toBe('admin-user');
    });

    it('should throw error for non-existent base policy', () => {
      expect(() => {
        engine.createCustomPolicy(
          'tenant-123',
          'non-existent-policy',
          {},
          'admin-user'
        );
      }).toThrow('Base policy non-existent-policy not found');
    });
  });

  describe('Tenant Configuration', () => {
    it('should set active policy for tenant', () => {
      engine.setTenantPolicy('tenant-123', 'mi-esta-large-accrual-v1');

      const policy = engine.getTenantPolicy('tenant-123');
      expect(policy).toBeDefined();
      expect(policy?.id).toBe('mi-esta-large-accrual-v1');
    });

    it('should maintain policy history', () => {
      engine.setTenantPolicy('tenant-123', 'mi-esta-large-accrual-v1');
      engine.setTenantPolicy('tenant-123', 'mi-esta-large-frontload-v1');

      const policy = engine.getTenantPolicy('tenant-123');
      expect(policy?.id).toBe('mi-esta-large-frontload-v1');
    });

    it('should throw error for non-existent policy', () => {
      expect(() => {
        engine.setTenantPolicy('tenant-123', 'non-existent-policy');
      }).toThrow('Policy non-existent-policy not found');
    });

    it('should support custom policy configurations', () => {
      engine.setTenantPolicy('tenant-123', 'mi-esta-large-accrual-v1', {
        allowNegativeBalance: true,
        requireDocumentationAfterDays: 3,
        autoApprovalUnderHours: 8,
        notifications: {
          lowBalanceThreshold: 10,
          upcomingExpirationDays: 30,
        },
      });

      const policy = engine.getTenantPolicy('tenant-123');
      expect(policy).toBeDefined();
    });
  });

  describe('Accrual Calculations', () => {
    it('should calculate accrual for large employer', () => {
      const result = engine.calculateAccrual('mi-esta-large-accrual-v1', 300, 0);

      expect(result.accrued).toBe(10); // 300 / 30 = 10
      expect(result.remaining).toBe(72);
      expect(result.capped).toBe(false);
    });

    it('should respect annual cap', () => {
      const result = engine.calculateAccrual('mi-esta-large-accrual-v1', 300, 70);

      expect(result.accrued).toBe(2); // Only 2 more hours until cap
      expect(result.remaining).toBe(2);
      expect(result.capped).toBe(true);
    });

    it('should handle already capped accrual', () => {
      const result = engine.calculateAccrual('mi-esta-large-accrual-v1', 300, 72);

      expect(result.accrued).toBe(0);
      expect(result.remaining).toBe(0);
      expect(result.capped).toBe(true);
    });

    it('should handle frontload policy', () => {
      const result = engine.calculateAccrual(
        'mi-esta-large-frontload-v1',
        300,
        0
      );

      expect(result.accrued).toBe(72); // Frontloaded amount
      expect(result.remaining).toBe(72);
      expect(result.capped).toBe(false);
    });

    it('should handle small employer accrual', () => {
      const result = engine.calculateAccrual('mi-esta-small-accrual-v1', 300, 0);

      expect(result.accrued).toBe(10);
      expect(result.remaining).toBe(40);
      expect(result.capped).toBe(false);
    });

    it('should respect small employer cap', () => {
      const result = engine.calculateAccrual('mi-esta-small-accrual-v1', 300, 38);

      expect(result.accrued).toBe(2);
      expect(result.remaining).toBe(2);
      expect(result.capped).toBe(true);
    });

    it('should throw error for non-existent policy', () => {
      expect(() => {
        engine.calculateAccrual('non-existent-policy', 300, 0);
      }).toThrow('Policy non-existent-policy not found');
    });
  });

  describe('Policy Validation', () => {
    it('should validate valid policy', () => {
      const policy = DEFAULT_POLICIES['mi-esta-large-accrual-v1'];
      const result = engine.validatePolicy(policy);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing ID', () => {
      const policy: AccrualPolicy = {
        id: '',
        name: 'Test Policy',
        type: 'accrual',
        version: '1.0.0',
        employerSize: 'large',
        rules: {
          accrualRate: 1 / 30,
          maxPaidHoursPerYear: 72,
          maxCarryover: 72,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        },
      };

      const result = engine.validatePolicy(policy);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ID is required'))).toBe(true);
    });

    it('should detect missing accrual rate for accrual policy', () => {
      const policy: AccrualPolicy = {
        id: 'test-policy',
        name: 'Test Policy',
        type: 'accrual',
        version: '1.0.0',
        employerSize: 'large',
        rules: {
          maxPaidHoursPerYear: 72,
          maxCarryover: 72,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        },
      };

      const result = engine.validatePolicy(policy);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Accrual rate'))).toBe(true);
    });

    it('should detect missing frontload amount for frontload policy', () => {
      const policy: AccrualPolicy = {
        id: 'test-policy',
        name: 'Test Policy',
        type: 'frontload',
        version: '1.0.0',
        employerSize: 'large',
        rules: {
          maxPaidHoursPerYear: 72,
          maxCarryover: 0,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        },
      };

      const result = engine.validatePolicy(policy);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Frontload amount'))).toBe(true);
    });

    it('should detect invalid max paid hours', () => {
      const policy: AccrualPolicy = {
        id: 'test-policy',
        name: 'Test Policy',
        type: 'accrual',
        version: '1.0.0',
        employerSize: 'large',
        rules: {
          accrualRate: 1 / 30,
          maxPaidHoursPerYear: 0,
          maxCarryover: 72,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        },
      };

      const result = engine.validatePolicy(policy);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Max paid hours'))).toBe(true);
    });
  });

  describe('Import/Export', () => {
    it('should export all policies', () => {
      const exported = engine.exportPolicies();
      expect(exported.length).toBeGreaterThan(0);
      expect(exported.every((p) => p.id && p.name && p.type)).toBe(true);
    });

    it('should import policies', () => {
      const newPolicy: AccrualPolicy = {
        id: 'imported-policy',
        name: 'Imported Policy',
        type: 'accrual',
        version: '1.0.0',
        employerSize: 'large',
        rules: {
          accrualRate: 1 / 40,
          maxPaidHoursPerYear: 60,
          maxCarryover: 60,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        },
      };

      engine.importPolicies([newPolicy]);
      const retrieved = engine.getPolicy('imported-policy');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Imported Policy');
    });
  });
});

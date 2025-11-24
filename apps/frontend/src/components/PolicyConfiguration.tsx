import { useState, useEffect } from 'react';
import { rulesEngine, type AccrualPolicy } from '@/lib/rules/rulesEngine';
import type { EmployerSize } from '@/lib/rules/types';
import { TooltipIcon } from './Tooltip';

interface PolicyConfigProps {
  tenantId: string;
  employerSize: EmployerSize;
  currentPolicyId?: string;
  onPolicyChange?: (policyId: string) => void;
}

export default function PolicyConfiguration({
  tenantId,
  employerSize,
  currentPolicyId,
  onPolicyChange,
}: PolicyConfigProps) {
  const [availablePolicies, setAvailablePolicies] = useState<AccrualPolicy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    currentPolicyId || ''
  );
  const [selectedPolicy, setSelectedPolicy] = useState<AccrualPolicy | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [customPolicy, setCustomPolicy] = useState<Partial<AccrualPolicy>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load available policies for employer size
    const policies = rulesEngine.getPoliciesByEmployerSize(employerSize);
    setAvailablePolicies(policies);

    // Set initial policy if provided
    if (currentPolicyId) {
      const policy = rulesEngine.getPolicy(currentPolicyId);
      if (policy) {
        setSelectedPolicy(policy);
      }
    } else if (policies.length > 0) {
      // Default to first accrual policy
      const defaultPolicy = policies.find((p) => p.type === 'accrual');
      if (defaultPolicy) {
        setSelectedPolicyId(defaultPolicy.id);
        setSelectedPolicy(defaultPolicy);
      }
    }
  }, [employerSize, currentPolicyId]);

  const handlePolicySelect = (policyId: string) => {
    setSelectedPolicyId(policyId);
    const policy = rulesEngine.getPolicy(policyId);
    setSelectedPolicy(policy || null);
    setCustomizing(false);
    setCustomPolicy({});
  };

  const handleCustomize = () => {
    if (!selectedPolicy) return;
    setCustomizing(true);
    setCustomPolicy({
      name: `${selectedPolicy.name} (Custom)`,
      rules: { ...selectedPolicy.rules },
      conditions: selectedPolicy.conditions
        ? { ...selectedPolicy.conditions }
        : undefined,
    });
  };

  const handleCustomPolicyChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setCustomPolicy((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRuleChange = (field: string, value: string | number) => {
    setCustomPolicy((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [field]: value,
      } as AccrualPolicy['rules'],
    }));
  };

  const handleSavePolicy = async () => {
    if (!selectedPolicy) return;

    setSaving(true);
    try {
      // Create custom policy
      const newPolicy = rulesEngine.createCustomPolicy(
        tenantId,
        selectedPolicy.id,
        customPolicy,
        'current-user' // In real app, get from auth context
      );

      // Set as active policy for tenant
      rulesEngine.setTenantPolicy(tenantId, newPolicy.id);

      // Notify parent
      onPolicyChange?.(newPolicy.id);

      // Reset state
      setCustomizing(false);
      setSelectedPolicyId(newPolicy.id);
      setSelectedPolicy(newPolicy);

      alert('Policy saved successfully!');
    } catch (error) {
      console.error('Error saving policy:', error);
      alert('Failed to save policy. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPolicy = async () => {
    if (!selectedPolicyId) return;

    setSaving(true);
    try {
      // Set as active policy for tenant
      rulesEngine.setTenantPolicy(tenantId, selectedPolicyId);

      // Notify parent
      onPolicyChange?.(selectedPolicyId);

      alert('Policy applied successfully!');
    } catch (error) {
      console.error('Error applying policy:', error);
      alert('Failed to apply policy. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (availablePolicies.length === 0) {
    return (
      <div className="policy-config-empty">
        <p>No policies available for your company size.</p>
      </div>
    );
  }

  return (
    <div className="policy-configuration">
      <div className="policy-header">
        <h2 className="flex items-center">
          Accrual Policy Configuration
          <TooltipIcon content="Configure how sick time is accrued and managed for your employees according to Michigan ESTA law" />
        </h2>
        <p className="text-gray-600">
          Configure how sick time accrues for your employees
        </p>
      </div>

      {!customizing ? (
        <div className="policy-selector">
          <h3>Select a Policy</h3>
          <div className="policy-list">
            {availablePolicies.map((policy) => (
              <div
                key={policy.id}
                className={`policy-card ${
                  selectedPolicyId === policy.id ? 'selected' : ''
                }`}
                onClick={() => handlePolicySelect(policy.id)}
              >
                <div className="policy-card-header">
                  <h4>{policy.name}</h4>
                  <span className={`policy-type-badge ${policy.type}`}>
                    {policy.type}
                  </span>
                </div>

                <div className="policy-details">
                  {policy.type === 'accrual' && (
                    <>
                      <div className="detail-item">
                        <span className="label flex items-center">
                          Accrual Rate:
                          <TooltipIcon content="How quickly employees earn sick time. Michigan ESTA requires 1 hour per 30 hours worked for large employers." />
                        </span>
                        <span className="value">
                          1 hour per {1 / (policy.rules.accrualRate || 1)} hours worked
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label flex items-center">
                          Annual Cap:
                          <TooltipIcon content="Maximum hours an employee can accrue in one year. Michigan ESTA caps at 72 hours for accrual-based policies." />
                        </span>
                        <span className="value">
                          {policy.rules.maxPaidHoursPerYear} hours
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label flex items-center">
                          Carryover:
                          <TooltipIcon content="Maximum hours that can roll over to the next year. Michigan ESTA allows up to 72 hours of carryover." />
                        </span>
                        <span className="value">
                          {policy.rules.maxCarryover} hours
                        </span>
                      </div>
                    </>
                  )}

                  {policy.type === 'frontload' && (
                    <>
                      <div className="detail-item">
                        <span className="label">Frontload Amount:</span>
                        <span className="value">
                          {policy.rules.frontloadAmount} hours
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Annual Cap:</span>
                        <span className="value">
                          {policy.rules.maxPaidHoursPerYear} hours
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Reset:</span>
                        <span className="value">{policy.rules.resetDate}</span>
                      </div>
                    </>
                  )}
                </div>

                {selectedPolicyId === policy.id && (
                  <div className="policy-card-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomize();
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Customize
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyPolicy();
                      }}
                      className="btn btn-primary btn-sm"
                      disabled={saving}
                    >
                      {saving ? 'Applying...' : 'Apply Policy'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="policy-customizer">
          <h3>Customize Policy</h3>
          <p className="text-gray-600 mb-4">
            Create a custom policy based on {selectedPolicy?.name}
          </p>

          <div className="form-group">
            <label className="flex items-center">
              Policy Name
              <TooltipIcon content="Give your custom policy a descriptive name to identify it easily" />
            </label>
            <input
              type="text"
              value={customPolicy.name || ''}
              onChange={(e) => handleCustomPolicyChange('name', e.target.value)}
              className="form-input"
            />
          </div>

          {selectedPolicy?.type === 'accrual' && (
            <>
              <div className="form-group">
                <label className="flex items-center">
                  Hours Worked per Hour Accrued
                  <TooltipIcon content="For Michigan ESTA large employers, this is typically 30 (1 hour accrued per 30 worked). Small employers provide a fixed 40 hours." />
                </label>
                <input
                  type="number"
                  value={
                    customPolicy.rules?.accrualRate
                      ? 1 / customPolicy.rules.accrualRate
                      : 30
                  }
                  onChange={(e) => handleRuleChange('accrualRate', 1 / Number(e.target.value))}
                  className="form-input"
                  min="1"
                  max="100"
                />
                <p className="form-help">
                  e.g., 30 means 1 hour accrued per 30 hours worked
                </p>
              </div>

              <div className="form-group">
                <label className="flex items-center">
                  Maximum Paid Hours Per Year
                  <TooltipIcon content="The cap on how many sick time hours can be used in a year. Michigan ESTA sets this at 72 hours for accrual-based policies." />
                </label>
                <input
                  type="number"
                  value={customPolicy.rules?.maxPaidHoursPerYear || 72}
                  onChange={(e) =>
                    handleRuleChange('maxPaidHoursPerYear', Number(e.target.value))
                  }
                  className="form-input"
                  min="1"
                  max="200"
                />
              </div>

              <div className="form-group">
                <label className="flex items-center">
                  Maximum Carryover Hours
                  <TooltipIcon content="Unused hours that can carry over to the next year. Michigan ESTA requires at least 40 hours of carryover." />
                </label>
                <input
                  type="number"
                  value={customPolicy.rules?.maxCarryover || 72}
                  onChange={(e) => handleRuleChange('maxCarryover', Number(e.target.value))}
                  className="form-input"
                  min="0"
                  max="200"
                />
              </div>
            </>
          )}

          {selectedPolicy?.type === 'frontload' && (
            <>
              <div className="form-group">
                <label className="flex items-center">
                  Frontload Amount (Hours)
                  <TooltipIcon content="Hours granted at the start of the year. For small employers (<10 employees), this is typically 40 hours per Michigan ESTA." />
                </label>
                <input
                  type="number"
                  value={customPolicy.rules?.frontloadAmount || 72}
                  onChange={(e) =>
                    handleRuleChange('frontloadAmount', Number(e.target.value))
                  }
                  className="form-input"
                  min="1"
                  max="200"
                />
              </div>

              <div className="form-group">
                <label className="flex items-center">
                  Maximum Paid Hours Per Year
                  <TooltipIcon content="The maximum hours that can be used in a year. Small employers under Michigan ESTA typically set this to 40 hours." />
                </label>
                <input
                  type="number"
                  value={customPolicy.rules?.maxPaidHoursPerYear || 72}
                  onChange={(e) =>
                    handleRuleChange('maxPaidHoursPerYear', Number(e.target.value))
                  }
                  className="form-input"
                  min="1"
                  max="200"
                />
              </div>
            </>
          )}

          <div className="customizer-actions">
            <button
              onClick={() => {
                setCustomizing(false);
                setCustomPolicy({});
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePolicy}
              className="btn btn-primary"
              disabled={saving || !customPolicy.name}
            >
              {saving ? 'Saving...' : 'Save Custom Policy'}
            </button>
          </div>
        </div>
      )}

      <div className="policy-info">
        <h4>Policy Information</h4>
        <p>
          Your selected policy determines how sick time accrues for your employees.
          You can choose from Michigan ESTA compliant policies or create a custom
          policy that meets your specific needs while staying compliant.
        </p>
        <ul>
          <li>
            <strong>Accrual policies</strong> gradually accumulate hours as employees
            work
          </li>
          <li>
            <strong>Frontload policies</strong> grant all hours at the start of the
            year
          </li>
          <li>All policies maintain compliance with Michigan ESTA law</li>
          <li>Policy changes take effect at the start of the next accrual period</li>
        </ul>
      </div>
    </div>
  );
}

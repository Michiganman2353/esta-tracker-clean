/**
 * Edge Config Demo Component
 * 
 * This component demonstrates all Edge Config features:
 * - Feature flags
 * - Maintenance mode
 * - Registration controls
 * - Rate limits
 * - Accrual ruleset version
 * 
 * This file serves as a reference for developers integrating Edge Config
 * into other parts of the application.
 */

import { 
  useEdgeConfig, 
  useFeatureFlag, 
  useMaintenanceMode, 
  useRegistrationStatus,
  useAccrualRulesetVersion 
} from '../hooks/useEdgeConfig';

export function EdgeConfigDemo() {
  // Get complete config
  const { config, loading: configLoading, error } = useEdgeConfig();

  // Check specific feature flags
  const doctorNotesEnabled = useFeatureFlag('doctorNotesEnabled');
  const calendarEnabled = useFeatureFlag('calendarEnabled');
  const auditLogEnabled = useFeatureFlag('auditLogEnabled');
  const documentUploadEnabled = useFeatureFlag('documentUploadEnabled');

  // Check maintenance mode
  const { maintenanceMode, message: maintenanceMessage } = useMaintenanceMode();

  // Check registration status
  const { 
    isOpen: employerRegOpen, 
    message: employerRegMessage 
  } = useRegistrationStatus('employer');
  
  const { 
    isOpen: employeeRegOpen, 
    message: employeeRegMessage 
  } = useRegistrationStatus('employee');

  // Get accrual ruleset version
  const { version: rulesetVersion } = useAccrualRulesetVersion();

  if (configLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading Edge Config...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-200">
            Error loading Edge Config: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Edge Config Status
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time configuration from Vercel Edge Config
        </p>
      </div>

      {/* Maintenance Mode */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Maintenance Mode
        </h2>
        <div className="flex items-center space-x-4">
          <div className={`w-4 h-4 rounded-full ${maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="text-gray-700 dark:text-gray-300">
            {maintenanceMode ? 'Active' : 'Inactive'}
          </span>
        </div>
        {maintenanceMessage && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Message: {maintenanceMessage}
          </p>
        )}
      </section>

      {/* Feature Flags */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Feature Flags
        </h2>
        <div className="space-y-3">
          <FeatureFlag name="Doctor Notes" enabled={doctorNotesEnabled} />
          <FeatureFlag name="Calendar View" enabled={calendarEnabled} />
          <FeatureFlag name="Audit Log" enabled={auditLogEnabled} />
          <FeatureFlag name="Document Upload" enabled={documentUploadEnabled} />
        </div>
      </section>

      {/* Registration Status */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Registration Status
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center space-x-4 mb-1">
              <div className={`w-4 h-4 rounded-full ${employerRegOpen ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Employer Registration: {employerRegOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            {!employerRegOpen && employerRegMessage && (
              <p className="ml-8 text-sm text-gray-600 dark:text-gray-400">
                {employerRegMessage}
              </p>
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-4 mb-1">
              <div className={`w-4 h-4 rounded-full ${employeeRegOpen ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Employee Registration: {employeeRegOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            {!employeeRegOpen && employeeRegMessage && (
              <p className="ml-8 text-sm text-gray-600 dark:text-gray-400">
                {employeeRegMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Rate Limits
        </h2>
        {config && (
          <div className="grid grid-cols-2 gap-4">
            <RateLimitItem 
              label="Login Attempts/Hour" 
              value={config.rateLimits.loginAttemptsPerHour} 
            />
            <RateLimitItem 
              label="API Requests/Minute" 
              value={config.rateLimits.apiRequestsPerMinute} 
            />
            <RateLimitItem 
              label="Sick Time Requests/Day" 
              value={config.rateLimits.sickTimeRequestsPerDay} 
            />
            <RateLimitItem 
              label="Document Uploads/Hour" 
              value={config.rateLimits.documentUploadsPerHour} 
            />
          </div>
        )}
      </section>

      {/* Accrual Ruleset */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Accrual Ruleset
        </h2>
        {config && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Version:</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-white">
                {rulesetVersion}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Effective Date:</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(config.accrualRuleset.effectiveDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Description:</span>
              <span className="text-gray-900 dark:text-white">
                {config.accrualRuleset.description}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-medium ${config.accrualRuleset.active ? 'text-green-600' : 'text-red-600'}`}>
                {config.accrualRuleset.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Last Updated */}
      {config && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date(config.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// Helper component for feature flags
function FeatureFlag({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <div className="flex items-center space-x-4">
      <div className={`w-4 h-4 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span className="text-gray-700 dark:text-gray-300">{name}</span>
      <span className={`text-sm font-medium ${enabled ? 'text-green-600' : 'text-gray-500'}`}>
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

// Helper component for rate limits
function RateLimitItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

export default EdgeConfigDemo;

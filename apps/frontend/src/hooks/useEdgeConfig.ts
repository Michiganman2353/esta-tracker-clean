/**
 * React Hook for Edge Config
 * Provides easy access to Edge Config settings in React components
 */

import { useState, useEffect } from 'react';
import { edgeConfigService } from '@/lib/edgeConfigService';
import type { EdgeConfigSettings, FeatureFlags } from '@/types/edgeConfig';

/**
 * Hook to access complete Edge Config
 */
export function useEdgeConfig() {
  const [config, setConfig] = useState<EdgeConfigSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchConfig = async () => {
      try {
        setLoading(true);
        const result = await edgeConfigService.getConfig();
        if (mounted) {
          setConfig(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load config'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading, error };
}

/**
 * Hook to check a specific feature flag
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const [enabled, setEnabled] = useState(true); // Default to enabled

  useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        const isEnabled = await edgeConfigService.getFeatureFlag(flag);
        if (mounted) {
          setEnabled(isEnabled);
        }
      } catch (err) {
        console.error(`Error checking feature flag ${flag}:`, err);
        if (mounted) {
          setEnabled(true); // Default to enabled on error
        }
      }
    };

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [flag]);

  return enabled;
}

/**
 * Hook to check if the application is in maintenance mode
 */
export function useMaintenanceMode() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkMaintenanceMode = async () => {
      try {
        setLoading(true);
        const isMaintenanceMode = await edgeConfigService.isMaintenanceMode();
        const maintenanceMessage = await edgeConfigService.getMaintenanceMessage();
        
        if (mounted) {
          setMaintenanceMode(isMaintenanceMode);
          setMessage(maintenanceMessage);
        }
      } catch (err) {
        console.error('Error checking maintenance mode:', err);
        if (mounted) {
          setMaintenanceMode(false); // Default to not in maintenance
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkMaintenanceMode();

    return () => {
      mounted = false;
    };
  }, []);

  return { maintenanceMode, message, loading };
}

/**
 * Hook to check registration status
 */
export function useRegistrationStatus(type: 'employer' | 'employee') {
  const [isOpen, setIsOpen] = useState(true); // Default to open
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkRegistrationStatus = async () => {
      try {
        setLoading(true);
        const registrationOpen = type === 'employer'
          ? await edgeConfigService.isEmployerRegistrationOpen()
          : await edgeConfigService.isEmployeeRegistrationOpen();
        
        const closedMessage = await edgeConfigService.getRegistrationClosedMessage();
        
        if (mounted) {
          setIsOpen(registrationOpen);
          setMessage(closedMessage);
        }
      } catch (err) {
        console.error('Error checking registration status:', err);
        if (mounted) {
          setIsOpen(true); // Default to open on error
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkRegistrationStatus();

    return () => {
      mounted = false;
    };
  }, [type]);

  return { isOpen, message, loading };
}

/**
 * Hook to get current accrual ruleset version
 */
export function useAccrualRulesetVersion() {
  const [version, setVersion] = useState<string>('1.0.0'); // Default version
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchVersion = async () => {
      try {
        setLoading(true);
        const rulesetVersion = await edgeConfigService.getAccrualRulesetVersion();
        if (mounted) {
          setVersion(rulesetVersion);
        }
      } catch (err) {
        console.error('Error fetching accrual ruleset version:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchVersion();

    return () => {
      mounted = false;
    };
  }, []);

  return { version, loading };
}

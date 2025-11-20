/**
 * App Component
 *
 * This is the root component for the ESTA Tracker web application.
 * It manages authentication state, routes, and global error handling.
 *
 * Features:
 * - Checks for authenticated user on mount, handles loading and network errors
 * - Displays skeleton dashboard and retry logic on connection issues
 * - Provides public routes for login, registration, and pricing
 * - Provides protected routes for authenticated users:
 *   - Dashboard, EmployeeDashboard, EmployerDashboard, AuditLog, Settings, etc.
 * - Implements conditional navigation based on user authentication
 * - Integrates maintenance mode notification
 *
 * Uses:
 * - React Router for client-side navigation
 * - API client for user authentication
 * - Design system components for consistent UI feedback
 *
 * All application pages and layout are controlled from here.
 */

import { createContext, useState, ReactNode } from 'react';
import { useWizard, WizardStep } from '../hooks/useWizard';

interface OnboardingData {
  companyName?: string;
  employeeCount?: number;
  industryType?: string;
  contactEmail?: string;
  contactPhone?: string;
  agreedToTerms?: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  wizard: ReturnType<typeof useWizard>;
  isComplete: boolean;
  reset: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const defaultSteps: WizardStep[] = [
  { id: 'company-info', title: 'Company Information', isComplete: false },
  { id: 'policy-setup', title: 'Policy Setup', isComplete: false },
  { id: 'employee-import', title: 'Import Employees', isComplete: false },
  { id: 'review', title: 'Review & Complete', isComplete: false },
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({});
  const wizard = useWizard(defaultSteps);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const isComplete = wizard.steps.every(step => step.isComplete);

  const reset = () => {
    setData({});
    wizard.reset();
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, wizard, isComplete, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

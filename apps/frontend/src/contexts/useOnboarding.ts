/**
 * useOnboarding Hook
 * 
 * Custom hook to access the onboarding context.
 * Must be used within an OnboardingProvider.
 * 
 * @throws Error if used outside OnboardingProvider
 * @returns OnboardingContextValue with state and actions
 */

import { useContext } from 'react';
import { OnboardingContext, OnboardingContextValue } from './OnboardingContext';

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

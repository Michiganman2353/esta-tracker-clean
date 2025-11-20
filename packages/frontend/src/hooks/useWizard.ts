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

/**
 * Custom React hook for managing multi-step wizard flows.
 *
 * @file useWizard.ts
 * @description Provides state and navigation helpers for wizard-style UIs.
 * @usage
 *   const {
 *     steps,
 *     currentStep,
 *     currentStepIndex,
 *     isFirstStep,
 *     isLastStep,
 *     goToNext,
 *     goToPrevious,
 *     goToStep,
 *     markStepComplete,
 *     markStepIncomplete,
 *     reset,
 *   } = useWizard(initialSteps);
 *
 * @param {WizardStep[]} initialSteps - Array of step objects to initialize the wizard.
 * @returns {object} Wizard state and navigation functions.
 */
import { useState, useCallback } from 'react';
  id: string;
  title: string;
  isComplete: boolean;
}

export function useWizard(initialSteps: WizardStep[]) {
  const [steps, setSteps] = useState<WizardStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goToNext = useCallback(() => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [isLastStep]);

  const goToPrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  }, [steps.length]);

  const markStepComplete = useCallback((stepId: string) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, isComplete: true } : step
      )
    );
  }, []);

  const markStepIncomplete = useCallback((stepId: string) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, isComplete: false } : step
      )
    );
  }, []);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setSteps(initialSteps);
  }, [initialSteps]);

  return {
    steps,
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrevious,
    goToStep,
    markStepComplete,
    markStepIncomplete,
    reset,
  };
}

/**
 * Onboarding Context
 * 
 * Provides global state management for the onboarding wizard process.
 * This context maintains the user's progress through the multi-step
 * onboarding flow for new employers and employees.
 * 
 * Features:
 * - Multi-step wizard state management
 * - Form data persistence across steps
 * - Progress tracking
 * - Validation state management
 * - Step navigation (next, previous, jump to step)
 * - Reset functionality
 * 
 * State Structure:
 * - currentStep: Current step index (0-based)
 * - completedSteps: Set of completed step indices
 * - formData: Accumulated form data from all steps
 * - isStepValid: Validation state for current step
 * 
 * Uses:
 * - React Context API for global state
 * - TypeScript for type safety
 * - Local storage for persistence (optional)
 */

import { createContext, useState, useCallback, ReactNode } from 'react';

export interface OnboardingFormData {
  // Employer information
  companyName?: string;
  employeeCount?: number;
  employerSize?: 'small' | 'large';
  industry?: string;
  contactEmail?: string;
  
  // Employee information
  employeeName?: string;
  employeeEmail?: string;
  employeeRole?: string;
  startDate?: string;
  
  // Additional settings
  payrollIntegration?: 'quickbooks' | 'adp' | 'paychex' | 'none';
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
  };
  
  // Extensible for additional fields
  [key: string]: unknown;
}

interface OnboardingContextState {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  formData: OnboardingFormData;
  isStepValid: boolean;
}

interface OnboardingContextActions {
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  setStepValid: (isValid: boolean) => void;
  markStepComplete: (step: number) => void;
  resetOnboarding: () => void;
  canGoToStep: (step: number) => boolean;
}

export type OnboardingContextValue = OnboardingContextState & OnboardingContextActions;

// eslint-disable-next-line react-refresh/only-export-components
export const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
  totalSteps?: number;
  initialData?: OnboardingFormData;
}

export function OnboardingProvider({ 
  children, 
  totalSteps = 5,
  initialData = {},
}: OnboardingProviderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<OnboardingFormData>(initialData);
  const [isStepValid, setIsStepValid] = useState(false);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep(prev => prev + 1);
      setIsStepValid(false); // Reset validation for next step
    }
  }, [currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const updateFormData = useCallback((data: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps(prev => new Set(prev).add(step));
  }, []);

  const resetOnboarding = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setFormData({});
    setIsStepValid(false);
  }, []);

  const canGoToStep = useCallback((step: number) => {
    // Can go to current step or any completed step
    if (step === currentStep) return true;
    if (step < currentStep) return true;
    if (completedSteps.has(step - 1)) return true;
    return false;
  }, [currentStep, completedSteps]);

  const value: OnboardingContextValue = {
    currentStep,
    totalSteps,
    completedSteps,
    formData,
    isStepValid,
    setCurrentStep,
    nextStep,
    previousStep,
    updateFormData,
    setStepValid: setIsStepValid,
    markStepComplete,
    resetOnboarding,
    canGoToStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

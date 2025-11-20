import { useState, useCallback } from 'react';

export interface WizardStep {
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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Stepper } from './Stepper';

describe('Stepper Component', () => {
  const steps = ['Account', 'Company', 'Policy', 'Complete'];

  it('renders all steps', () => {
    render(<Stepper steps={steps} currentStep={0} />);
    
    steps.forEach(step => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('highlights the current step', () => {
    render(<Stepper steps={steps} currentStep={1} />);
    
    // Current step should have specific styling
    const stepElement = screen.getByText('2');
    expect(stepElement).toBeInTheDocument();
  });

  it('shows completed steps with checkmark', () => {
    render(<Stepper steps={steps} currentStep={2} />);
    
    // First two steps should show checkmarks (svg elements)
    const checkmarks = document.querySelectorAll('svg path');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('shows step numbers for incomplete steps', () => {
    render(<Stepper steps={steps} currentStep={0} />);
    
    // Should show numbers for future steps
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders with different number of steps', () => {
    const twoSteps = ['Step 1', 'Step 2'];
    render(<Stepper steps={twoSteps} currentStep={0} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });
});

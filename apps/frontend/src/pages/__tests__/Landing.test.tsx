import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Landing from '../Landing';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLanding = () => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Landing />
    </BrowserRouter>
  );
};

describe('Landing Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should render the hero section with main headline', () => {
      renderLanding();
      // Check for the main headline H1
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render the ESTA Tracker branding', () => {
      renderLanding();
      const brandElements = screen.getAllByText('ESTA Tracker');
      expect(brandElements.length).toBeGreaterThan(0);
    });

    it('should render call-to-action buttons', () => {
      renderLanding();
      const trialButtons = screen.getAllByText(/Start Your Free Trial/i);
      expect(trialButtons.length).toBeGreaterThan(0);
    });

    it('should render navigation links', () => {
      renderLanding();
      const featureLinks = screen.getAllByText('Features');
      expect(featureLinks.length).toBeGreaterThan(0);
      const howItWorksLinks = screen.getAllByText('How It Works');
      expect(howItWorksLinks.length).toBeGreaterThan(0);
    });

    it('should render feature cards', () => {
      renderLanding();
      expect(
        screen.getByText('Automatic Accrual Tracking')
      ).toBeInTheDocument();
      expect(screen.getByText('100% ESTA Compliant')).toBeInTheDocument();
      expect(screen.getByText('Employee Self-Service')).toBeInTheDocument();
    });

    it('should render trust indicators', () => {
      renderLanding();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('24/7')).toBeInTheDocument();
    });

    it('should render how it works section', () => {
      renderLanding();
      expect(screen.getByText('Get Started in Minutes')).toBeInTheDocument();
      expect(screen.getByText('Register Your Business')).toBeInTheDocument();
      expect(screen.getByText('Add Your Employees')).toBeInTheDocument();
      expect(
        screen.getByText('Stay Compliant Automatically')
      ).toBeInTheDocument();
    });

    it('should render footer with support email', () => {
      renderLanding();
      expect(screen.getByText('support@estatracker.com')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have hero get started button with test id', () => {
      renderLanding();
      const heroButton = screen.getByTestId('hero-get-started');
      expect(heroButton).toBeInTheDocument();
      fireEvent.click(heroButton);
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('should have CTA get started button with test id', () => {
      renderLanding();
      const ctaButton = screen.getByTestId('cta-get-started');
      expect(ctaButton).toBeInTheDocument();
      fireEvent.click(ctaButton);
      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('should navigate when clicking pricing buttons', () => {
      renderLanding();
      const pricingButtons = screen.getAllByRole('button', {
        name: /pricing/i,
      });
      if (pricingButtons.length > 0) {
        fireEvent.click(pricingButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/pricing');
      }
    });

    it('should navigate when clicking sign in buttons', () => {
      renderLanding();
      const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
      if (signInButtons.length > 0) {
        fireEvent.click(signInButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      }
    });
  });
});

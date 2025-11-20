/**
 * Pricing Page
 * 
 * Displays subscription pricing tiers and feature comparison for ESTA Tracker.
 * This page helps employers understand the cost structure and select the
 * appropriate plan for their business needs.
 * 
 * Features:
 * - Three pricing tiers (Starter, Professional, Enterprise)
 * - Base pricing: $75/month + $8 per employee
 * - One-time onboarding fee: $400
 * - Detailed feature comparison table
 * - Compliance highlights
 * - Clear call-to-action buttons
 * - Responsive design for all devices
 * - Dark mode support
 * 
 * Uses:
 * - PricingCard and FeatureComparison components
 * - Design system Button component
 * - React Router for navigation
 * 
 * Navigation:
 * - Available to both authenticated and unauthenticated users
 * - CTA buttons navigate to registration page
 */

import { useNavigate } from 'react-router-dom';
import { PricingCard, FeatureComparison, FeatureCategory } from '../components/Pricing';
import { Button } from '../components/DesignSystem/Button';

export default function Pricing() {
  const navigate = useNavigate();

  const handleGetStarted = (tier: string) => {
    navigate('/register', { state: { selectedTier: tier } });
  };

  const pricingTiers = [
    {
      title: 'Starter',
      description: 'Perfect for small businesses just getting started with ESTA compliance',
      price: {
        base: 75,
        perEmployee: 8,
        onboarding: 400,
      },
      features: [
        { text: 'Up to 10 employees', included: true },
        { text: 'Automatic sick time accrual tracking', included: true },
        { text: 'Employee self-service portal', included: true },
        { text: 'Basic compliance reports', included: true },
        { text: 'Email support', included: true },
        { text: 'Payroll integration', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Dedicated account manager', included: false },
      ],
      ctaText: 'Start Free Trial',
    },
    {
      title: 'Professional',
      description: 'Most popular plan for growing businesses with comprehensive needs',
      price: {
        base: 75,
        perEmployee: 8,
        onboarding: 400,
      },
      features: [
        { text: 'Unlimited employees', included: true },
        { text: 'Automatic sick time accrual tracking', included: true },
        { text: 'Employee self-service portal', included: true },
        { text: 'Advanced compliance reports', included: true },
        { text: 'Priority email & phone support', included: true },
        { text: 'Payroll integration (QuickBooks, ADP, Paychex)', included: true },
        { text: 'Advanced analytics & insights', included: true },
        { text: 'Dedicated account manager', included: false },
      ],
      ctaText: 'Start Free Trial',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      title: 'Enterprise',
      description: 'Custom solutions for large organizations with complex requirements',
      price: {
        base: 0, // Custom pricing
        perEmployee: 0,
        onboarding: 0,
      },
      features: [
        { text: 'Unlimited employees', included: true },
        { text: 'All Professional features', included: true },
        { text: 'Custom compliance workflows', included: true },
        { text: 'Multi-location support', included: true },
        { text: '24/7 priority support', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Advanced security & compliance', included: true },
        { text: 'Dedicated account manager', included: true },
      ],
      ctaText: 'Contact Sales',
    },
  ];

  const featureCategories: FeatureCategory[] = [
    {
      name: 'Core Compliance Features',
      features: [
        {
          name: 'Automatic accrual calculation',
          description: '1 hour per 30 hours worked for large employers',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Employee size detection',
          description: 'Automatically applies correct rules based on company size',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Carryover management',
          description: 'Automatically handles year-end carryover per ESTA rules',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Usage tracking',
          description: 'Track paid and unpaid sick time usage',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Audit-ready reports',
          description: 'Generate compliance reports for state audits',
          starter: 'Basic',
          professional: 'Advanced',
          enterprise: 'Custom',
        },
      ],
    },
    {
      name: 'Employee Management',
      features: [
        {
          name: 'Employee portal',
          description: 'Self-service portal for employees to view balances',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'PTO request workflow',
          description: 'Submit and approve sick time requests',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Document management',
          description: 'Upload and store medical documentation',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Multi-location support',
          description: 'Manage employees across multiple locations',
          starter: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
    {
      name: 'Integrations & Automation',
      features: [
        {
          name: 'CSV import',
          description: 'Import hours worked via CSV files',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'QuickBooks integration',
          description: 'Automatic hours sync from QuickBooks',
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'ADP integration',
          description: 'Automatic hours sync from ADP',
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Paychex integration',
          description: 'Automatic hours sync from Paychex',
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Custom API integration',
          description: 'Build custom integrations with our API',
          starter: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
    {
      name: 'Security & Compliance',
      features: [
        {
          name: 'Encryption at rest',
          description: 'AES-256-GCM encryption for all data',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Encryption in transit',
          description: 'TLS 1.3 for all data transmission',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Audit logging',
          description: 'Comprehensive audit trail of all actions',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Google Cloud KMS',
          description: 'Hardware-backed encryption key management',
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'SSO/SAML',
          description: 'Single sign-on with SAML 2.0',
          starter: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
    {
      name: 'Support & Training',
      features: [
        {
          name: 'Email support',
          description: 'Response within 24 hours',
          starter: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Phone support',
          description: 'Direct phone support during business hours',
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Priority support',
          description: 'Faster response times for urgent issues',
          starter: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Onboarding training',
          description: 'Guided setup and training sessions',
          starter: 'Self-service',
          professional: '2 hours',
          enterprise: 'Unlimited',
        },
        {
          name: 'Account manager',
          description: 'Dedicated account manager',
          starter: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ESTA Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="primary" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Choose the plan that fits your business. All plans include Michigan ESTA compliance,
            automatic calculations, and secure data management.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <PricingCard
              key={index}
              title={tier.title}
              description={tier.description}
              price={tier.price}
              features={tier.features}
              ctaText={tier.ctaText}
              onCtaClick={() => handleGetStarted(tier.title.toLowerCase())}
              highlighted={tier.highlighted}
              badge={tier.badge}
            />
          ))}
        </div>

        {/* Enterprise Note */}
        <div className="text-center mb-16">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            * Enterprise pricing is custom based on your organization's needs. Contact us for a quote.
          </p>
        </div>

        {/* Compliance Highlights */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Michigan ESTA Compliance Guaranteed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                100% Compliant
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically follows all Michigan ESTA requirements based on employer size
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Bank-Level Security
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AES-256 encryption and Google Cloud KMS protect your sensitive data
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Audit Ready
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate comprehensive reports for state audits in seconds
              </p>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Compare Features
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <FeatureComparison categories={featureCategories} />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! We offer a 30-day free trial with full access to all features. No credit card required.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                What happens if my employee count changes?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Your billing automatically adjusts based on your active employee count. You only pay
                for what you use, and the system automatically updates compliance rules if you cross
                the 10-employee threshold.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription at any time. You'll retain access until the
                end of your current billing period, and you can export all your data.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                What about the one-time onboarding fee?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                The $400 onboarding fee covers initial setup, data migration, and training for your
                team. This ensures you get up and running quickly with minimal disruption.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-12">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join Michigan businesses who trust ESTA Tracker for their compliance needs.
            Start your free 30-day trial today.
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/contact')}
              className="text-white border-white hover:bg-white/10"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 dark:text-gray-400">
            © 2025 ESTA Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

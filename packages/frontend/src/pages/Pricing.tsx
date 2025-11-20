import { Link } from 'react-router-dom';
import { PricingCard, ComparisonTable } from '../components/Pricing';
import { TrustBadge } from '../components/TrustBadge';

export default function Pricing() {
  const handleContactSales = () => {
    // In a real implementation, this would open a contact form or redirect to a sales page
    window.location.href = 'mailto:sales@estatracker.com?subject=Enterprise Inquiry';
  };

  const handleGetStarted = () => {
    window.location.href = '/register';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600">
                ESTA Tracker
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <TrustBadge variant="compact" />
              <Link to="/login" className="btn btn-secondary text-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Michigan ESTA compliance made affordable for businesses of all sizes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <PricingCard
              title="Starter"
              description="Perfect for small businesses"
              price="$75"
              priceSubtext="per month"
              features={[
                'Up to 5 employees',
                'Automatic ESTA tracking',
                'Employee self-service',
                '3-year audit trail',
                'End-to-end encryption',
                'Email support',
                'Mobile access',
              ]}
              onCtaClick={handleGetStarted}
            />

            <PricingCard
              title="Professional"
              description="For growing businesses"
              price="$75"
              priceSubtext="base + $8 per employee/month"
              features={[
                'Unlimited employees',
                'Everything in Starter',
                'CSV import/export',
                'Advanced reporting',
                'Priority email support',
                'Custom branding',
                'API access (coming soon)',
              ]}
              highlighted={true}
              onCtaClick={handleGetStarted}
            />

            <PricingCard
              title="Enterprise"
              description="For large organizations"
              price="Custom"
              priceSubtext="Contact for pricing"
              features={[
                'Everything in Professional',
                'Payroll integration',
                'Multi-location support',
                'Dedicated account manager',
                'Phone & email support',
                'Custom onboarding training',
                'SLA guarantee',
              ]}
              ctaText="Contact Sales"
              onCtaClick={handleContactSales}
            />
          </div>

          {/* Onboarding Fee Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-12">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  One-Time Onboarding Fee
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  All plans include a one-time <strong>$400 onboarding fee</strong> which covers:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 ml-4 space-y-1">
                  <li>• Complete system setup and configuration</li>
                  <li>• Employee data import and verification</li>
                  <li>• Compliance policy customization</li>
                  <li>• Initial team training session</li>
                  <li>• Dedicated onboarding specialist</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Compliance Highlights */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Michigan ESTA Compliance Included
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Automatic Accrual
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  1 hr per 30 worked for large employers
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  3-Year Audit Trail
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete compliance documentation
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Encrypted Data
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AES-256 end-to-end encryption
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-3">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Real-Time Updates
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Instant balance calculations
                </p>
              </div>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <ComparisonTable />

          {/* FAQ Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Frequently Asked Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Can I change plans later?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
                </p>
              </div>

              <div className="card">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Is there a contract or commitment?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No long-term contracts required. All plans are month-to-month and you can cancel anytime with 30 days notice.
                </p>
              </div>

              <div className="card">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  What happens to my data if I cancel?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can export all your data before canceling. We retain your data for 90 days after cancellation in case you want to reactivate.
                </p>
              </div>

              <div className="card">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Do you offer discounts for nonprofits?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes! We offer a 20% discount for registered 501(c)(3) nonprofit organizations. Contact sales for details.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center bg-primary-600 rounded-lg p-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-xl text-primary-100 mb-8">
              Join Michigan businesses staying compliant with ESTA
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/register" className="btn btn-primary bg-white text-primary-600 hover:bg-gray-100">
                Start Free Trial
              </Link>
              <button onClick={handleContactSales} className="btn btn-secondary">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 ESTA Tracker. All rights reserved.
            </div>
            <TrustBadge variant="compact" />
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Landing Page
 *
 * The public-facing home page for ESTA Tracker that explains the service
 * and provides clear paths to registration for both employers and employees.
 */

import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="to-primary-50 min-h-screen bg-gradient-to-br from-gray-50 via-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="text-primary-600 h-8 w-8"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                ESTA Tracker
              </span>
            </div>
            <nav className="hidden items-center space-x-6 md:flex">
              <a
                href="#features"
                className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 transition-colors dark:text-gray-300"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 transition-colors dark:text-gray-300"
              >
                How It Works
              </a>
              <button
                onClick={() => navigate('/pricing')}
                className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 transition-colors dark:text-gray-300"
              >
                Pricing
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 transition-colors dark:text-gray-300"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </nav>
            <div className="md:hidden">
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary text-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden">
          <div className="bg-primary-400/20 animate-float absolute right-10 top-20 h-72 w-72 rounded-full blur-3xl"></div>
          <div
            className="bg-accent-400/20 animate-float absolute bottom-10 left-10 h-96 w-96 rounded-full blur-3xl"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="animate-fade-in-down mb-6 text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
              Michigan{' '}
              <span className="from-primary-600 to-accent-600 bg-gradient-to-r bg-clip-text text-transparent">
                ESTA Compliance
              </span>{' '}
              Made Simple
            </h1>
            <p
              className="animate-fade-in mb-8 text-xl text-gray-600 dark:text-gray-300"
              style={{ animationDelay: '0.2s' }}
            >
              Automatically track earned sick time, stay compliant with
              Michigan&apos;s Earned Sick Time Act, and give your employees easy
              access to their balances. No more spreadsheets, no more guesswork.
            </p>
            <div
              className="animate-fade-in-up flex flex-col justify-center gap-4 sm:flex-row"
              style={{ animationDelay: '0.4s' }}
            >
              <button
                onClick={() => navigate('/register')}
                className="btn btn-primary btn-lg px-8 py-4 text-lg"
                data-testid="hero-get-started"
              >
                Start Your Free Trial
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="btn btn-secondary btn-lg px-8 py-4 text-lg"
              >
                View Pricing
              </button>
            </div>
            <p
              className="animate-fade-in mt-4 text-sm text-gray-500 dark:text-gray-400"
              style={{ animationDelay: '0.5s' }}
            >
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-y border-gray-200 bg-white/50 py-12 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="text-primary-600 dark:text-primary-400 text-3xl font-bold">
                100%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ESTA Compliant
              </div>
            </div>
            <div>
              <div className="text-primary-600 dark:text-primary-400 text-3xl font-bold">
                24/7
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Employee Access
              </div>
            </div>
            <div>
              <div className="text-primary-600 dark:text-primary-400 text-3xl font-bold">
                Auto
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Accrual Tracking
              </div>
            </div>
            <div>
              <div className="text-primary-600 dark:text-primary-400 text-3xl font-bold">
                Safe
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Secure & Encrypted
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
              Everything You Need for ESTA Compliance
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              ESTA Tracker handles all the complexity of Michigan&apos;s Earned
              Sick Time Act so you can focus on running your business.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="glass-card group p-8 transition-all duration-300 hover:shadow-xl">
              <div className="from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br transition-transform group-hover:scale-110">
                <svg
                  className="text-primary-600 dark:text-primary-400 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Automatic Accrual Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sick time accrues automatically based on hours worked. No manual
                calculations needed.
              </p>
            </div>

            <div className="glass-card group p-8 transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-200 transition-transform group-hover:scale-110 dark:from-green-900 dark:to-green-800">
                <svg
                  className="h-7 w-7 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                100% ESTA Compliant
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built specifically for Michigan&apos;s Earned Sick Time Act.
                Stay compliant with confidence.
              </p>
            </div>

            <div className="glass-card group p-8 transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 transition-transform group-hover:scale-110 dark:from-purple-900 dark:to-purple-800">
                <svg
                  className="h-7 w-7 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Employee Self-Service
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Employees can view their sick time balances and request time off
                anytime.
              </p>
            </div>

            <div className="glass-card group p-8 transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 transition-transform group-hover:scale-110 dark:from-blue-900 dark:to-blue-800">
                <svg
                  className="h-7 w-7 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Audit-Ready Reports
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate comprehensive compliance reports instantly. Be prepared
                for state audits.
              </p>
            </div>

            <div className="glass-card group p-8 transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 transition-transform group-hover:scale-110 dark:from-orange-900 dark:to-orange-800">
                <svg
                  className="h-7 w-7 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Real-Time Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Balances update in real-time as employees work and use sick
                time.
              </p>
            </div>

            <div className="glass-card group p-8 transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200 transition-transform group-hover:scale-110 dark:from-pink-900 dark:to-pink-800">
                <svg
                  className="h-7 w-7 text-pink-600 dark:text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Mobile Friendly
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access ESTA Tracker from any device. Perfect for managers on the
                go.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="bg-white/50 px-4 py-20 sm:px-6 lg:px-8 dark:bg-gray-800/50"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
              Get Started in Minutes
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Setting up ESTA Tracker is quick and easy. Here&apos;s how it
              works:
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary-600 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
                1
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Register Your Business
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your employer account and enter your company information.
                Takes less than 5 minutes.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
                2
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Add Your Employees
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Import employees or add them manually. Share their access codes
                so they can log in.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-600 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white">
                3
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Stay Compliant Automatically
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ESTA Tracker handles accruals, carryovers, and reporting. You
                focus on your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Ready to Simplify Your ESTA Compliance?
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Join Michigan employers who trust ESTA Tracker to handle their sick
            time compliance.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/register')}
              className="btn btn-primary btn-lg px-8 py-4 text-lg"
              data-testid="cta-get-started"
            >
              Start Your Free Trial
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-secondary btn-lg px-8 py-4 text-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-12 text-white sm:px-6 lg:px-8 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <svg
                  className="text-primary-400 h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span className="text-xl font-bold">ESTA Tracker</span>
              </div>
              <p className="text-sm text-gray-400">
                Simplifying Michigan ESTA compliance for employers of all sizes.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="#features"
                    className="transition-colors hover:text-white"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="transition-colors hover:text-white"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="transition-colors hover:text-white"
                  >
                    How It Works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Account</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button
                    onClick={() => navigate('/login')}
                    className="transition-colors hover:text-white"
                  >
                    Sign In
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/register')}
                    className="transition-colors hover:text-white"
                  >
                    Register
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="mailto:support@estatracker.com"
                    className="transition-colors hover:text-white"
                  >
                    support@estatracker.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} ESTA Tracker. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

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

import { Card, Button } from '../DesignSystem';

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  priceSubtext?: string;
  features: string[];
  highlighted?: boolean;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function PricingCard({
  title,
  description,
  price,
  priceSubtext,
  features,
  highlighted = false,
  ctaText = 'Get Started',
  onCtaClick,
}: PricingCardProps) {
  return (
    <Card
      variant={highlighted ? 'elevated' : 'default'}
      className={`relative ${highlighted ? 'ring-2 ring-primary-600' : ''}`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 dark:text-white">
          {price}
        </div>
        {priceSubtext && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {priceSubtext}
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Button
        variant={highlighted ? 'primary' : 'secondary'}
        fullWidth
        onClick={onCtaClick}
      >
        {ctaText}
      </Button>
    </Card>
  );
}

/**
 * PricingCard Component
 * 
 * Displays a pricing tier card with features, price, and call-to-action.
 * Used on the pricing page to showcase different subscription plans.
 * 
 * Features:
 * - Highlighted/featured tier option
 * - Monthly and annual pricing display
 * - Feature list with check marks
 * - Custom CTA button text and action
 * - Responsive design
 * - Dark mode support
 * 
 * Uses:
 * - Design system Button component
 * - Tailwind CSS for styling
 * - clsx for conditional classes
 */

import clsx from 'clsx';
import { Button } from '../DesignSystem/Button';

export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingCardProps {
  title: string;
  description: string;
  price: {
    base: number;
    perEmployee?: number;
    onboarding?: number;
  };
  features: PricingFeature[];
  ctaText?: string;
  onCtaClick?: () => void;
  highlighted?: boolean;
  badge?: string;
}

export function PricingCard({
  title,
  description,
  price,
  features,
  ctaText = 'Get Started',
  onCtaClick,
  highlighted = false,
  badge,
}: PricingCardProps) {
  return (
    <div
      className={clsx(
        'relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col',
        highlighted && 'ring-2 ring-primary-500 shadow-xl scale-105'
      )}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
            ${price.base}
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">/month</span>
        </div>
        {price.perEmployee && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            + ${price.perEmployee} per employee/month
          </p>
        )}
        {price.onboarding && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            ${price.onboarding} one-time onboarding fee
          </p>
        )}
      </div>

      <ul className="mb-8 space-y-3 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            {feature.included ? (
              <svg
                className="flex-shrink-0 w-5 h-5 text-green-500 mr-3 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="flex-shrink-0 w-5 h-5 text-gray-300 dark:text-gray-600 mr-3 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span
              className={clsx(
                'text-sm',
                feature.included
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-gray-400 dark:text-gray-600 line-through'
              )}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        variant={highlighted ? 'primary' : 'secondary'}
        fullWidth
        onClick={onCtaClick}
        size="lg"
      >
        {ctaText}
      </Button>
    </div>
  );
}

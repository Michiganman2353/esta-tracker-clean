/**
 * FeatureComparison Component
 * 
 * Displays a detailed feature comparison table for different pricing tiers.
 * Helps users understand what features are included in each plan.
 * 
 * Features:
 * - Responsive table layout
 * - Feature categories/sections
 * - Check marks for included features
 * - Tooltips for feature explanations
 * - Dark mode support
 * - Mobile-friendly horizontal scroll
 * 
 * Uses:
 * - Tailwind CSS for styling
 * - Semantic HTML table structure
 * - ARIA labels for accessibility
 */

import { TooltipIcon } from '../DesignSystem/Tooltip';

export interface ComparisonFeature {
  name: string;
  description?: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

export interface FeatureCategory {
  name: string;
  features: ComparisonFeature[];
}

interface FeatureComparisonProps {
  categories: FeatureCategory[];
}

export function FeatureComparison({ categories }: FeatureComparisonProps) {
  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <svg
          className="w-5 h-5 text-green-500 mx-auto"
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
          className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 dark:border-gray-700">
            <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">
              Features
            </th>
            <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">
              Starter
            </th>
            <th className="text-center py-4 px-4 font-semibold text-primary-600 dark:text-primary-400">
              Professional
            </th>
            <th className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category, categoryIndex) => (
            <>
              <tr
                key={`category-${categoryIndex}`}
                className="bg-gray-50 dark:bg-gray-900/50"
              >
                <td
                  colSpan={4}
                  className="py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wider"
                >
                  {category.name}
                </td>
              </tr>
              {category.features.map((feature, featureIndex) => (
                <tr
                  key={`feature-${categoryIndex}-${featureIndex}`}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center">
                      {feature.name}
                      {feature.description && (
                        <TooltipIcon content={feature.description} />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderCell(feature.starter)}
                  </td>
                  <td className="py-3 px-4 text-center bg-primary-50/50 dark:bg-primary-900/10">
                    {renderCell(feature.professional)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderCell(feature.enterprise)}
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

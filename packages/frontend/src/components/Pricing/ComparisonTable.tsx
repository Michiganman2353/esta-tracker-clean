import { Card } from '../DesignSystem';

interface Feature {
  name: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const features: Feature[] = [
  {
    name: 'Employee tracking',
    starter: '1-5 employees',
    professional: 'Unlimited',
    enterprise: 'Unlimited',
  },
  {
    name: 'Automatic accrual calculation',
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Michigan ESTA compliance',
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: '3-year audit trail',
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: 'End-to-end encryption',
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Employee self-service portal',
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Mobile access',
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    name: 'CSV import/export',
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    name: 'Advanced reporting',
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    name: 'API access',
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    name: 'Payroll integration',
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    name: 'Priority support',
    starter: false,
    professional: 'Email',
    enterprise: 'Phone & Email',
  },
  {
    name: 'Dedicated account manager',
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    name: 'Custom onboarding',
    starter: false,
    professional: false,
    enterprise: true,
  },
];

export function ComparisonTable() {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <svg className="w-5 h-5 text-green-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>;
  };

  return (
    <Card>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Feature Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                Feature
              </th>
              <th className="text-center py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                Starter
              </th>
              <th className="text-center py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                Professional
              </th>
              <th className="text-center py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                Enterprise
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">
                  {feature.name}
                </td>
                <td className="py-4 px-4 text-center">{renderValue(feature.starter)}</td>
                <td className="py-4 px-4 text-center">{renderValue(feature.professional)}</td>
                <td className="py-4 px-4 text-center">{renderValue(feature.enterprise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

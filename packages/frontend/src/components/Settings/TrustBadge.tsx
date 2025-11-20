/**
 * TrustBadge Component
 * 
 * Displays a trust/security badge that can be placed in header or footer.
 * Provides visual assurance of security and compliance features.
 * 
 * Features:
 * - Compact badge design
 * - Hover tooltip with details
 * - Optional compliance certificate download
 * - Multiple badge variants (security, compliance, verified)
 * - Responsive sizing
 * - Dark mode support
 * 
 * Uses:
 * - Tooltip component for additional information
 * - Design system Button for certificate download
 * - SVG icons for visual appeal
 */

import { Tooltip } from '../DesignSystem/Tooltip';

export interface TrustBadgeProps {
  variant?: 'security' | 'compliance' | 'verified';
  showCertificate?: boolean;
  onDownloadCertificate?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function TrustBadge({
  variant = 'security',
  showCertificate = false,
  onDownloadCertificate,
  size = 'md',
}: TrustBadgeProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  const badges = {
    security: {
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="8" fill="#3B82F6" />
          <path
            d="M50 20L30 30V50C30 62 40 70 50 80C60 70 70 62 70 50V30L50 20Z"
            fill="white"
          />
          <path
            d="M45 55L40 50L38 52L45 59L62 42L60 40L45 55Z"
            fill="#3B82F6"
          />
        </svg>
      ),
      tooltip: 'Bank-level encryption with AES-256-GCM and Google Cloud KMS',
      label: 'Secure',
    },
    compliance: {
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="8" fill="#10B981" />
          <circle cx="50" cy="50" r="25" fill="white" />
          <path
            d="M45 55L40 50L38 52L45 59L62 42L60 40L45 55Z"
            fill="#10B981"
            strokeWidth="2"
          />
        </svg>
      ),
      tooltip: '100% compliant with Michigan ESTA law requirements',
      label: 'ESTA Compliant',
    },
    verified: {
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="8" fill="#8B5CF6" />
          <path
            d="M50 20L58 35L75 38L62 50L66 67L50 59L34 67L38 50L25 38L42 35L50 20Z"
            fill="white"
          />
        </svg>
      ),
      tooltip: 'Verified security practices and audit-ready compliance',
      label: 'Verified',
    },
  };

  const badge = badges[variant];

  const handleCertificateDownload = () => {
    if (onDownloadCertificate) {
      onDownloadCertificate();
    } else {
      // Default certificate download logic
      const certificateUrl = '/api/compliance-certificate';
      window.open(certificateUrl, '_blank');
    }
  };

  const BadgeContent = (
    <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className={sizeClasses[size]}>{badge.icon}</div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {badge.label}
      </span>
      {showCertificate && (
        <button
          onClick={handleCertificateDownload}
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline ml-2"
          aria-label="Download compliance certificate"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <Tooltip content={badge.tooltip} position="top">
      {BadgeContent}
    </Tooltip>
  );
}

/**
 * TrustBadgeGroup Component
 * 
 * Displays multiple trust badges in a group
 */
export function TrustBadgeGroup({
  badges = ['security', 'compliance', 'verified'],
  size = 'md',
  showCertificate = false,
  onDownloadCertificate,
}: {
  badges?: Array<'security' | 'compliance' | 'verified'>;
  size?: 'sm' | 'md' | 'lg';
  showCertificate?: boolean;
  onDownloadCertificate?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((badge) => (
        <TrustBadge
          key={badge}
          variant={badge}
          size={size}
          showCertificate={showCertificate}
          onDownloadCertificate={onDownloadCertificate}
        />
      ))}
    </div>
  );
}

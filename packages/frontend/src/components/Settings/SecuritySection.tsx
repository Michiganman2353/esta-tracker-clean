/**
 * SecuritySection Component
 * 
 * Displays comprehensive security and privacy information for ESTA Tracker.
 * Builds trust with compliance-conscious businesses by highlighting
 * encryption, audit logging, and data protection measures.
 * 
 * Features:
 * - Encryption details (AES-256-GCM, Google Cloud KMS)
 * - Audit logging capabilities
 * - Data protection measures
 * - Compliance certifications
 * - Security best practices
 * - Expandable sections for detailed information
 * 
 * Uses:
 * - Design system Card component
 * - Tooltip component for additional context
 * - Responsive design
 * - Dark mode support
 */

import { useState } from 'react';
import { Card } from '@/components/DesignSystem/Card';
import { TooltipIcon } from '@/components/DesignSystem/Tooltip';

export function SecuritySection() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Security & Privacy
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your data security is our top priority. ESTA Tracker implements enterprise-grade
            security measures to protect your sensitive employee information.
          </p>
        </div>

        {/* Encryption Section */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('encryption')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bank-Level Encryption
              </h3>
              <TooltipIcon content="We use the same encryption standards as major financial institutions" />
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                expandedSection === 'encryption' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {expandedSection === 'encryption' && (
            <div className="mt-4 ml-9 text-gray-600 dark:text-gray-400 space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Encryption at Rest (AES-256-GCM)
                </p>
                <p className="text-sm">
                  All sensitive data is encrypted using AES-256-GCM (Advanced Encryption Standard
                  with 256-bit keys in Galois/Counter Mode). This military-grade encryption
                  ensures your data is unreadable even if physical storage is compromised.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Google Cloud KMS (Key Management Service)
                </p>
                <p className="text-sm">
                  Encryption keys are managed by Google Cloud KMS with hardware security modules
                  (HSMs). This prevents anyone, including our team, from accessing your encrypted
                  data without proper authorization.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Encryption in Transit (TLS 1.3)
                </p>
                <p className="text-sm">
                  All data transmission between your browser and our servers uses TLS 1.3
                  encryption, protecting your information from interception during transfer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Audit Logging Section */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('audit')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comprehensive Audit Logging
              </h3>
              <TooltipIcon content="Every action is logged for compliance and security" />
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                expandedSection === 'audit' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {expandedSection === 'audit' && (
            <div className="mt-4 ml-9 text-gray-600 dark:text-gray-400 space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Complete Activity Trail
                </p>
                <p className="text-sm">
                  Every action in the system is logged with timestamp, user identity, IP address,
                  and action details. This creates an immutable audit trail for compliance purposes.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  3-Year Retention
                </p>
                <p className="text-sm">
                  Audit logs are retained for 3 years as required by Michigan ESTA law, ensuring
                  you have access to historical records for state audits and investigations.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Logged Events Include
                </p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>User login and logout activities</li>
                  <li>Sick time accrual calculations</li>
                  <li>PTO requests and approvals</li>
                  <li>Document uploads and access</li>
                  <li>Balance adjustments</li>
                  <li>Settings changes</li>
                  <li>Report generation</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Data Protection Section */}
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          <button
            onClick={() => toggleSection('protection')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Protection & Privacy
              </h3>
              <TooltipIcon content="Your data is protected by multiple security layers" />
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                expandedSection === 'protection' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {expandedSection === 'protection' && (
            <div className="mt-4 ml-9 text-gray-600 dark:text-gray-400 space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Multi-Tenant Isolation
                </p>
                <p className="text-sm">
                  Each employer's data is completely isolated at the database level. No employer
                  can access another employer's data under any circumstances.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Role-Based Access Control (RBAC)
                </p>
                <p className="text-sm">
                  Users can only access data appropriate to their role (Employee, Manager, Employer,
                  Auditor). Permissions are enforced at both the application and database level.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Regular Security Audits
                </p>
                <p className="text-sm">
                  We conduct regular security audits and penetration testing to identify and
                  address potential vulnerabilities before they can be exploited.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Backup & Disaster Recovery
                </p>
                <p className="text-sm">
                  Daily automated backups with point-in-time recovery ensure your data is never lost.
                  Our disaster recovery plan guarantees 99.9% uptime.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Section */}
        <div>
          <button
            onClick={() => toggleSection('compliance')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-3"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Compliance & Certifications
              </h3>
              <TooltipIcon content="Industry-standard compliance and best practices" />
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform ${
                expandedSection === 'compliance' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {expandedSection === 'compliance' && (
            <div className="mt-4 ml-9 text-gray-600 dark:text-gray-400 space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Michigan ESTA Compliance
                </p>
                <p className="text-sm">
                  Our system is built specifically to comply with the Michigan Earned Sick Time
                  Act of 2025, with automatic updates as regulations evolve.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  GDPR & Privacy Standards
                </p>
                <p className="text-sm">
                  We follow GDPR principles for data privacy, including data minimization,
                  purpose limitation, and user rights to access and deletion.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  SOC 2 Type II (In Progress)
                </p>
                <p className="text-sm">
                  We are working towards SOC 2 Type II certification to demonstrate our commitment
                  to security, availability, and confidentiality controls.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Security Best Practices for Users
        </h3>
        <div className="space-y-3 text-gray-600 dark:text-gray-400">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Use Strong Passwords</p>
              <p className="text-sm">
                Create unique passwords with at least 12 characters, including uppercase, lowercase,
                numbers, and symbols.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Enable Two-Factor Authentication</p>
              <p className="text-sm">
                Add an extra layer of security by enabling 2FA in your account settings.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Log Out on Shared Devices</p>
              <p className="text-sm">
                Always log out after using ESTA Tracker on shared or public computers.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Review Audit Logs</p>
              <p className="text-sm">
                Regularly review your audit logs to ensure all activity is authorized.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

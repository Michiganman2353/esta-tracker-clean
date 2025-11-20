import { Card, CardHeader, CardTitle, CardContent } from '../DesignSystem';

export function SecuritySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Encryption */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              End-to-End Encryption
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              All employee data is encrypted using industry-standard AES-256 encryption both in transit (TLS 1.3) and at rest.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-7">
              <li>• Data encrypted before leaving your browser</li>
              <li>• Zero-knowledge architecture - we cannot access your unencrypted data</li>
              <li>• Encryption keys managed via Google Cloud KMS</li>
            </ul>
          </div>

          {/* Audit Logging */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Complete Audit Trail
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Every action in the system is logged and tracked to maintain Michigan ESTA compliance requirements.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-7">
              <li>• 3-year audit trail as required by law</li>
              <li>• Immutable log records with timestamps</li>
              <li>• Track all accrual, usage, and policy changes</li>
              <li>• Export logs for state audits</li>
            </ul>
          </div>

          {/* Data Privacy */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Data Privacy & Protection
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Your data is protected with enterprise-grade security measures:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-7">
              <li>• GDPR and CCPA compliant data handling</li>
              <li>• Role-based access control (RBAC)</li>
              <li>• Regular security audits and penetration testing</li>
              <li>• SOC 2 Type II compliance in progress</li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              Secure Infrastructure
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Hosted on enterprise-grade cloud infrastructure:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-7">
              <li>• Google Cloud Platform with 99.95% uptime SLA</li>
              <li>• Automatic backups every 24 hours</li>
              <li>• Disaster recovery procedures in place</li>
              <li>• DDoS protection and WAF</li>
            </ul>
          </div>

          {/* Certifications Badge */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  ESTA Compliant
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Encrypted
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                  Audited
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

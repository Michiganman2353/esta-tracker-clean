import { Card, CardHeader, CardTitle, CardContent, Button } from '../DesignSystem';

export function ComplianceCertificate() {
  const handleDownload = () => {
    // In a real implementation, this would generate and download a PDF certificate
    const certificate = {
      companyName: 'Your Company',
      certificationDate: new Date().toLocaleDateString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      features: [
        'Michigan ESTA Compliance',
        'End-to-End Encryption',
        '3-Year Audit Trail',
        'Automated Accrual Tracking',
      ],
    };

    // Create a simple text representation
    const content = `
ESTA TRACKER COMPLIANCE CERTIFICATE

Company: ${certificate.companyName}
Certification Date: ${certificate.certificationDate}
Valid Until: ${certificate.expirationDate}

Certified Features:
${certificate.features.map(f => `- ${f}`).join('\n')}

This certificate confirms that your organization is using ESTA Tracker,
a Michigan Earned Sick Time Act compliant workforce management system.

---
ESTA Tracker
Michigan ESTA Compliance System
    `.trim();

    // Create and download as text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ESTA-Compliance-Certificate-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Certificate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Download an official compliance certificate to demonstrate your commitment to Michigan ESTA compliance.
            This certificate can be shared with auditors, investors, or other stakeholders.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Official Compliance Certificate
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                  <li>✓ Verifies Michigan ESTA compliance</li>
                  <li>✓ Documents encryption and security measures</li>
                  <li>✓ Includes audit trail certification</li>
                  <li>✓ Valid for one year from issue date</li>
                </ul>
                <Button onClick={handleDownload} variant="primary" size="md">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Certificate
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            Note: This certificate is for informational purposes and demonstrates your use of ESTA-compliant software.
            It does not replace legal counsel or guarantee compliance with all applicable laws.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

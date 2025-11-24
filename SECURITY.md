# Security Policy

## Reporting a Vulnerability

We take the security of ESTA Tracker seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

### How to Report

**Please DO NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email your findings to the repository maintainers or use GitHub's private vulnerability reporting feature:

1. Go to the repository's Security tab
2. Click "Report a vulnerability"
3. Provide a detailed description of the vulnerability

### What to Include

Please include the following in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested remediation (if any)
- Your contact information for follow-up questions

### Response Timeline

- **Initial Response**: Within 48 hours
- **Triage & Investigation**: Within 7 days
- **Patch for Critical Issues**: Within 14 days
- **Public Disclosure**: After patch is released and users have time to update

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

We only provide security updates for the latest stable release on the `main` branch.

## Security Measures

### Code Security

- **Static Analysis**: CodeQL scans on every PR and weekly schedules
- **Dependency Scanning**: Dependabot monitors for vulnerable dependencies
- **Secret Scanning**: Gitleaks prevents accidental credential commits
- **Pre-commit Hooks**: Automated linting and security checks before commits

### Data Security

- All sensitive employee data is encrypted using Google Cloud KMS
- Role-based access control enforced at the Firestore rules level
- Audit logging for all data access and modifications
- No PII is logged or exposed in error messages

### Authentication & Authorization

- Firebase Authentication for secure user management
- JWT tokens with short expiration times
- Role-based permissions (Employer, Employee, Admin)
- Secure session management

## Security Best Practices for Contributors

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use Zod schemas for validation
3. **Sanitize outputs** - Prevent XSS and injection attacks
4. **Keep dependencies updated** - Monitor Dependabot alerts
5. **Follow principle of least privilege** - Request minimal permissions

## Acknowledgments

We appreciate the security research community's efforts in helping keep ESTA Tracker safe. Responsible reporters will be acknowledged (with permission) in our release notes.

---

Thank you for helping keep ESTA Tracker and its users safe!

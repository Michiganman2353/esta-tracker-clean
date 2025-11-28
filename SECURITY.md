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
- **AI Threat Simulation**: The Sentinel runs daily to proactively identify theoretical attack vectors

### The Sentinel - AI-Driven Threat Simulation

ESTA Tracker employs an AI-powered red team agent called **The Sentinel** that runs daily at 3:00 AM UTC. This proactive security measure:

- Uses xAI's grok-beta model to generate novel theoretical attack vectors
- Analyzes encryption, KMS, authentication, and key escrow flows
- Scores each attack for likelihood and impact (0-100 risk scale)
- Reports findings to the security team via Slack
- Maintains a 99%+ confidence rating through continuous security validation

The Sentinel is configured via `.github/workflows/sentinel.yml` and can be manually triggered with customizable targets.

### Data Security

- All sensitive employee data is encrypted using Google Cloud KMS
- Role-based access control enforced at the Firestore rules level
- Audit logging for all data access and modifications
- No PII is logged or exposed in error messages

### Advanced Cryptographic Security

#### Argon2id Key Derivation

- Employer master keys are derived using Argon2id (PHC winner)
- Memory-hard function resistant to GPU/ASIC attacks
- Parameters: 64 MiB memory, 3 iterations, parallelism 4
- Produces 256-bit keys for AES-256 encryption

#### Quantum-Resistant Encryption (Dual-Key Mode)

- KMS-Kyber768 hybrid encryption provides post-quantum security
- Data protected by both RSA-4096 (classical) and Kyber768 (quantum-safe)
- NIST-standard key encapsulation mechanism (KEM)
- Future-proof against quantum computer attacks

#### Constant-Time Operations

- All cryptographic comparisons use timing-safe functions
- Side-channel resistant implementations prevent timing attacks
- WebCrypto-hardened random number generation
- Secure memory zeroing for sensitive data

#### Automated Key Rotation

- 90-day automatic key rotation via Cloud Scheduler
- Compliance with SOC2 and HIPAA key management requirements
- Old key versions retained for backward compatibility
- Audit trail of all rotation events

#### Property-Based Fuzzing

- Fast-check property tests for all cryptographic operations
- Malformed input handling verified automatically
- Edge case coverage through random generation
- Continuous validation in CI/CD pipeline

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

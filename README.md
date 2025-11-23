# ESTA Tracker 🚀

> **"The HR Power Small Businesses Deserve – Without the Department."**

ESTA Tracker is a full-stack SaaS platform that automates compliance with the Michigan Earned Sick Time Act (ESTA) of 2025, helping employers track, calculate, and document paid sick time without the complexity.

[![Build Status](https://img.shields.io/github/actions/workflow/status/Michiganman2353/esta-tracker-clean/ci.yml?branch=main)](https://github.com/Michiganman2353/esta-tracker-clean/actions)
[![License](https://img.shields.io/github/license/Michiganman2353/esta-tracker-clean)](./LICENSE)

## Table of Contents
- [Quick Start](#quick-start)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Prerequisites
- **Node.js 22.x** (required - see `.nvmrc`)
- npm ≥10.0.0
- Firebase account
- Vercel account (for deployment)

> ⚠️ **Important**: This project requires Node.js 22.x. Earlier versions are not supported.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Michiganman2353/esta-tracker-clean.git
   cd esta-tracker-clean
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   # Start all packages in dev mode
   npm run dev
   
   # Or start individual packages:
   npm run dev:frontend  # Frontend only
   npm run dev:backend   # Backend only
   ```

5. **Build for production**
   ```bash
   # Build all packages
   npm run build
   
   # Or build individual packages:
   npm run build:frontend
   npm run build:backend
   ```

For detailed setup instructions, see:
- [Firebase Setup Guide](./docs/setup/FIREBASE_SETUP.md)
- [Deployment Guide](./docs/deployment/deployment.md)
- [KMS Security Setup](./docs/setup/KMS_SETUP_GUIDE.md)

### Monorepo Architecture

This project uses a modern monorepo structure powered by:
- **Nx** - Build orchestration and task running
- **Lerna** - Package management
- **npm Workspaces** - Dependency management

#### Available Commands

```bash
# Development
npm run dev              # Run all packages in dev mode
npm run dev:frontend     # Run frontend only
npm run dev:backend      # Run backend only

# Building
npm run build            # Build all packages
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Testing
npm run test             # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests
npm run test:e2e         # Run end-to-end tests

# Code Quality
npm run lint             # Lint all packages
npm run typecheck        # Type check all packages

# Nx Commands (for advanced usage)
npx nx graph             # View project dependency graph
npx nx show projects     # List all projects
npx nx build <package>   # Build specific package
```

#### Package Structure

```
packages/
├── frontend/          # React + Vite frontend application
├── backend/           # Node.js Express backend
├── accrual-engine/    # ESTA accrual logic library
├── csv-processor/     # CSV import handling
├── firebase/          # Firebase Admin SDK service
├── shared-types/      # Shared TypeScript types
└── shared-utils/      # Shared utilities
```

## Features

### Core Capabilities
- ✅ **Automated Sick Time Accrual** - 1 hour per 30 hours worked, Michigan ESTA compliant
- ✅ **PTO Request Workflow** - Employee requests, manager approval, automatic deductions
- ✅ **Secure Document Upload** - Medical notes and documentation with immutability after approval
- ✅ **Role-Based Access Control** - Employer, Manager, Employee, and Auditor roles
- ✅ **Compliance Tracking** - Automatic cap enforcement (40/72 hours based on employer size)
- ✅ **Audit-Ready Reports** - Exportable compliance documentation
- ✅ **Hours Import** - CSV upload or API integration
- ✅ **Multi-Tenant Architecture** - Complete data isolation between employers

### Security
- 🔐 **Google Cloud KMS Encryption** - Hardware-backed security for sensitive data
- 🔐 **AES-256-GCM + RSA-OAEP** - Industry-standard hybrid encryption
- 🔐 **Signed URLs** - Secure direct-to-storage uploads
- 🔐 **Comprehensive Audit Logging** - Track all data access and modifications

See [Security Documentation](./docs/security/) for complete security details.

## Technology Stack

### Core Technologies
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Encryption**: Google Cloud KMS
- **Hosting**: Vercel (Frontend), Firebase (Functions)
- **Testing**: Vitest (Unit), Playwright (E2E)

### Build & Development Tools
- **Monorepo Management**: Nx + Lerna + npm Workspaces
- **Build Orchestration**: Nx (v20+)
- **Package Management**: Lerna (v8+) with Nx integration
- **Node Version**: 22.x (enforced across all environments)
- **CI/CD**: GitHub Actions with Nx caching

For architectural details, see [Architecture Documentation](./docs/architecture/architecture.md).

## Documentation

### 📖 Essential Documentation
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Architecture Overview](./docs/architecture/architecture.md)** - System design and technical decisions
- **[Testing Guide](./docs/architecture/testing.md)** - Testing strategies and procedures
- **[Deployment Guide](./docs/deployment/deployment.md)** - Production deployment instructions
- **[Security Summary](./docs/security/security-summary.md)** - Security architecture and practices

### 🔧 Setup Guides
- [Firebase Setup](./docs/setup/FIREBASE_SETUP.md) - Configure Firebase services
- [KMS Setup](./docs/setup/KMS_SETUP_GUIDE.md) - Google Cloud KMS configuration
- [Vercel Deployment](./docs/deployment/deployment.md) - Vercel deployment and CI/CD setup
- [Edge Config](./docs/setup/EDGE_CONFIG_SETUP.md) - Edge configuration for Vercel

### 🔒 Security Documentation
- [KMS Security](./docs/security/KMS_SECURITY_SUMMARY.md) - Key management security
- [Security Checklist](./docs/security/SECURITY_CHECKLIST.md) - Pre-deployment security review
- [Encryption Design](./docs/design/hybrid-encryption-design.md) - Hybrid encryption architecture

### 📚 Additional Resources
- [Complete Documentation Index](./docs/README.md) - Full documentation map
- [Dependencies Audit](./docs/architecture/dependencies.md) - Dependency management
- [Audit Findings](./docs/archive/audit-findings.md) - Historical audit reports

## Vision & Roadmap

### Current Focus: MVP 1.0
- ✅ Employer onboarding and setup
- ✅ Automated sick time accrual engine
- ✅ PTO request and approval workflow
- ✅ CSV hours import
- ✅ Compliance reporting
- 🚧 Calendar and scheduling
- 🚧 Mobile-responsive design

### Future Phases
- **Phase 2**: Payroll integrations (QuickBooks Time, Homebase), Mobile app, Advanced reporting
- **Phase 3**: Multi-state expansion, White-label offerings, Full HR suite
- **Phase 4**: National HR compliance engine, Enterprise partnerships

See [docs/archive/MASTER_PLAN_V2_IMPLEMENTATION.md](./docs/archive/MASTER_PLAN_V2_IMPLEMENTATION.md) for the complete strategic vision.

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Setting up your development environment
- Code style guidelines
- Testing requirements
- Submitting pull requests

## License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.

## Support

- **Issues**: [GitHub Issues](https://github.com/Michiganman2353/esta-tracker-clean/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Michiganman2353/esta-tracker-clean/discussions)
- **Security**: For security concerns, please see [SECURITY.md](./SECURITY.md)

---

**Built with ❤️ for Michigan small businesses**

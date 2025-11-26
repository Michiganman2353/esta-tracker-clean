# ESTA Tracker 🚀

> **"The HR Power Small Businesses Deserve – Without the Department."**

ESTA Tracker is a full-stack SaaS platform that automates compliance with the Michigan Earned Sick Time Act (ESTA) of 2025, helping employers track, calculate, and document paid sick time without the complexity.

[![Build Status](https://img.shields.io/github/actions/workflow/status/Michiganman2353/ESTA-Logic/ci.yml?branch=master)](https://github.com/Michiganman2353/ESTA-Logic/actions)
[![CI Status](https://github.com/Michiganman2353/ESTA-Logic/actions/workflows/ci.yml/badge.svg)](https://github.com/Michiganman2353/ESTA-Logic/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Michiganman2353/ESTA-Logic/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/Michiganman2353/ESTA-Logic/actions/workflows/codeql-analysis.yml)
[![License](https://img.shields.io/github/license/Michiganman2353/ESTA-Logic)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)](https://nodejs.org/)

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Documentation](#documentation)
- [Vision & Roadmap](#vision--roadmap)
- [Enterprise Subscription System](#enterprise-subscription-system)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Prerequisites

- **Node.js 22.11+ LTS** (required - see `.nvmrc`)
- npm ≥10.0.0
- Firebase account
- Vercel account (for deployment)

> ⚠️ **Important**: This project requires Node.js 22.11+ LTS. Earlier versions are not supported.

## ⚠️ Environment Configuration (MANDATORY)

**This section is critical for all environments. The application will not build or run without proper environment configuration.**

### Required Environment Variables

The following **6 Firebase configuration variables** are **MANDATORY** and must be configured in **ALL environments**:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Where to Configure

#### 🔹 Local Development

1. Copy `.env.example` to `.env`
2. Fill in all 6 `VITE_FIREBASE_*` variables with your Firebase project credentials
3. Get credentials from [Firebase Console](https://console.firebase.google.com/) → Project Settings → Web App

#### 🔹 Vercel Deployment

Configure all 6 variables in Vercel Dashboard for **ALL** environments:

- Production environment
- Preview environment
- Development environment

**Path:** Vercel Dashboard → Project Settings → Environment Variables

#### 🔹 GitHub Actions (CI/CD)

Add all 6 variables as **repository secrets**:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Path:** GitHub Repository → Settings → Secrets and variables → Actions

### Important Notes

- ✅ **VITE\_** prefix is **required** for all frontend environment variables
- ❌ **REACT*APP*** variables are **NOT supported**
- ❌ **Unprefixed FIREBASE\_** variables are **NOT supported** for frontend
- ⚠️ All workflows, builds, and tests require these variables to succeed
- 🔒 **Security Note**: Firebase API keys with `VITE_` prefix are designed for client-side use and are safe to expose in the browser. Security is enforced by Firebase Security Rules, not by hiding these keys. See [Firebase Security Documentation](./docs/SECURITY.md) for details.

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Michiganman2353/ESTA-Logic.git
   cd ESTA-Logic
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

- **Nx (v22+)** - Build orchestration, task running, and intelligent caching
- **npm Workspaces** - Dependency management and package linking

> **Note**: While `lerna.json` exists for version management and publishing, day-to-day development uses Nx commands exclusively. Lerna's legacy `bootstrap`, `add`, and `link` commands are deprecated and not used.

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

#### Project Structure

```
apps/                    # Application projects
├── frontend/           # React + Vite frontend application
├── backend/            # Node.js Express backend API
└── marketing/          # Next.js marketing site

libs/                    # Shared libraries
├── accrual-engine/     # ESTA accrual calculation logic
├── csv-processor/      # CSV import/export handling
├── esta-firebase/      # Firebase client SDK wrapper
├── shared-types/       # Shared TypeScript type definitions
└── shared-utils/       # Shared utility functions

packages/                # Additional packages
├── esta-core/          # Core ESTA business logic
└── esta-firebase-adapter/  # Firebase adapter layer
```

## Features

### Core Capabilities

- ✅ **Automated Sick Time Accrual** - 1 hour per 30 hours worked, Michigan ESTA compliant
- ✅ **Employer Profile System** - Unique 4-digit codes for easy employee onboarding
- ✅ **White-Label Branding** - Employers can customize with logo, company name, and colors
- ✅ **Secure Employee Linking** - Employees link to employers via 4-digit code during registration
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

- **Monorepo Management**: Nx (v22+) + npm Workspaces
- **Build Orchestration**: Nx with intelligent caching and task dependencies
- **Version Management**: Lerna (for publishing only, not package management)
- **Node Version**: 22.11+ LTS (enforced via `.nvmrc`)
- **CI/CD**: GitHub Actions with Nx caching

For architectural details, see [Architecture Documentation](./docs/architecture/architecture.md).

## Employer Profile System

ESTA Tracker uses a centralized employer profile system with unique 4-digit codes for easy employee onboarding:

### For Employers

- **Unique 4-Digit Code**: Upon registration, employers receive a unique code (e.g., "1234")
- **White-Label Branding**: Customize with company logo, name, and brand colors
- **Employee Management**: View and manage all employees linked to your account
- **Code Regeneration**: Request a new code if needed (old code becomes invalid)

### For Employees

- **Simple Onboarding**: Register using your employer's 4-digit code
- **Automatic Linking**: Instantly connected to your employer's account
- **Branded Experience**: See your employer's logo and company name
- **Secure Access**: View only your own data and your employer's profile

### Security Features

- **Data Isolation**: Employers can only access their own employees' data
- **Role-Based Access**: Strict Firestore rules enforce access controls
- **Audit Trail**: All registration and linking events are logged

For detailed information, see [Employer Profile Documentation](./docs/employer-profile.md).

## Documentation

### 📖 Essential Documentation

**Core Guides:**

- **[Workspace Architecture](./docs/WORKSPACE_ARCHITECTURE.md)** - Monorepo structure, Nx commands, development workflow
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Architecture Overview](./docs/architecture/architecture.md)** - System design and technical decisions
- **[Testing Guide](./docs/architecture/testing.md)** - Testing strategies and procedures
- **[Security Best Practices](./docs/SECURITY.md)** - Comprehensive security documentation
- **[Performance Guide](./docs/PERFORMANCE.md)** - Performance optimization strategies

**Application Documentation:**

- **[Apps Directory](./apps/README.md)** - Frontend and backend application documentation
- **[Libs Directory](./libs/README.md)** - Shared libraries documentation
- **[Deployment Guide](./docs/deployment/deployment.md)** - Production deployment instructions

### 🔧 Setup Guides

- [Firebase Setup](./docs/setup/FIREBASE_SETUP.md) - Configure Firebase services
- [KMS Setup](./docs/setup/KMS_SETUP_GUIDE.md) - Google Cloud KMS configuration
- [Vercel Deployment](./docs/deployment/deployment.md) - Vercel deployment and CI/CD setup
- [Edge Config](./docs/setup/EDGE_CONFIG_SETUP.md) - Edge configuration for Vercel

### 🔒 Security Documentation

- [Security Best Practices](./docs/SECURITY.md) - Environment variables, backend/frontend security
- [KMS Security](./docs/security/KMS_SECURITY_SUMMARY.md) - Key management security
- [Security Checklist](./docs/security/SECURITY_CHECKLIST.md) - Pre-deployment security review
- [Encryption Design](./docs/design/hybrid-encryption-design.md) - Hybrid encryption architecture

### ⚡ Performance & Optimization

- [Performance Guide](./docs/PERFORMANCE.md) - Code splitting, caching, monitoring
- [Dependencies Audit](./docs/architecture/dependencies.md) - Dependency management

### 📚 Additional Resources

- [Complete Documentation Index](./docs/README.md) - Full documentation map
- [Security Summary](./docs/security/security-summary.md) - Security architecture overview
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

---

## Enterprise Subscription System 💳

> **"Build it once. Build it right. This system will process millions."**

The Enterprise Subscription System is the financial backbone of ESTA Tracker, engineered with financial-grade reliability, absolute data consistency, and zero-tolerance for revenue leakage.

### 🏗️ Core Architecture

#### Design Principles

| Principle                        | Description                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Failure Is Not An Option**     | Every component engineered with financial-grade reliability and zero-tolerance for revenue leakage |
| **Scale Is Assumed**             | Architected for 10,000 concurrent subscriptions from day one, designed for 100x growth             |
| **Compliance Is Non-Negotiable** | PCI DSS, SOC 2, GDPR, and global tax compliance are foundational requirements                      |

#### System-Wide Non-Negotiables

- **Event Sourcing Architecture**: Every financial state change emits immutable events with complete audit trails
- **CQRS Pattern**: Strict separation between command (write) and query (read) models
- **Circuit Breakers Everywhere**: All external dependencies have aggressive circuit breakers with graceful degradation
- **Idempotency By Design**: Every payment operation is safely retryable with zero financial impact from duplicates

#### Data Consistency Requirements

- **ACID Transactions** for all monetary operations—eventual consistency is unacceptable for financial data
- **Distributed Transactions** across subscription and billing domains with absolute consistency
- **Real-time Revenue Recognition** with GAAP-compliant revenue scheduling across subscription periods

### 💎 Subscription Tier Architecture

#### Four-Tier Enterprise Model

| Tier           | Description                                              | Target Audience               |
| -------------- | -------------------------------------------------------- | ----------------------------- |
| **FREE**       | Acquisition funnel with hard limits, designed to convert | Individual users, trial       |
| **PRO**        | Premium individual offering with 10x value over free     | Power users, small teams      |
| **AGENCY**     | Multi-seat B2B with white-labeling and bulk operations   | Agencies, mid-size businesses |
| **ENTERPRISE** | Custom contracts with SLA guarantees                     | Large organizations           |

#### Pricing Engine Capabilities

- **Multi-dimensional Pricing**: Seat-based, usage-based, feature-based, and commitment-based pricing
- **Global Currency Handling**: 50+ currencies with real-time exchange rates and bank-grade rounding
- **Automated Tax Engine**: VAT, GST, sales tax with region-specific rules and monthly compliance updates
- **Contract Enforcement**: Custom enterprise agreements with unique terms, discounts, and special provisions

### 💳 Payment Processing Orchestration

#### Multi-Processor Strategy

- **Primary Processor**: Full integration with modern payment platform for global payment methods
- **Secondary Processor**: Different payment network for redundancy and regional optimization
- **Backup Processor**: Third processor for emergency failover scenarios

#### Intelligent Routing Logic

- **Geographic Optimization**: Route payments based on processor performance by region
- **Cost Minimization**: Dynamic selection of lowest-cost processor per transaction type
- **Success Rate Maximization**: Real-time routing based on historical success rates
- **Cascading Failover**: Automated failover with zero customer impact during outages

### 📊 Advanced Billing Capabilities

#### Usage-Based Billing Engine

- **Real-time Metering**: Granular tracking of API calls, submissions, storage, and custom metrics
- **Predictive Analytics**: Usage forecasting to prevent surprise overage charges
- **Tiered Overage Pricing**: Progressive pricing bands for usage exceeding included limits
- **Custom Billing Cycles**: Monthly, quarterly, annual, and custom enterprise billing periods

#### Complex Billing Scenarios

- **Proration Engine**: Day-precise calculations for mid-cycle upgrades, downgrades, and cancellations
- **Trial Management**: Flexible trial periods with automated conversion tracking and win-back campaigns
- **Dunning Management**: Multi-stage failed payment recovery with intelligent retry timing
- **Invoice Customization**: White-labeled invoices with agency branding and multi-language support

### 🔐 Enterprise Security & Compliance

#### Security Implementation

| Standard                  | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| **PCI DSS Level 1**       | Certified card data handling with zero plaintext card data          |
| **SOC 2 Type II**         | Comprehensive financial controls with third-party audits            |
| **GDPR/CCPA**             | Full data subject rights including right to erasure and portability |
| **Financial Audit Trail** | Immutable log of every financial event with tamper-evident sealing  |

#### Fraud Prevention

- **Multi-layer Fraud Detection**: Rule-based, behavioral, and machine learning prevention
- **Velocity Checking**: Real-time analysis of payment patterns across customer base
- **Geolocation Validation**: IP-based location verification with high-risk region blocking
- **Manual Review Workflow**: Escalation path for suspicious transactions with case management

### 📈 Observability & Business Intelligence

#### Real-time Monitoring

- **Financial Health Dashboard**: Live MRR, ARR, churn, LTV, and ARPA calculations
- **Payment Success Analytics**: Granular analysis of decline reasons and recovery rates
- **Revenue Leakage Detection**: Automated identification of unpaid usage and system errors

#### Business Metrics

- **Cohort Analysis**: Customer lifetime value by acquisition channel and plan type
- **Churn Analytics**: Voluntary vs involuntary churn with root cause analysis
- **Conversion Funnels**: Free to paid conversion rates with bottleneck identification
- **Expansion Revenue Tracking**: Upsell, cross-sell, and usage-based revenue growth

### 🔌 Integration Ecosystem

#### Public API Design

- **RESTful Principles**: Consistent, predictable API design with comprehensive documentation
- **Webhook Framework**: Real-time event system for 15+ subscription and billing events
- **SDK Availability**: Client libraries for major programming languages and frameworks
- **API Versioning**: Strict backward compatibility with deprecation policies

#### Third-party Integrations

| Category       | Integrations                 |
| -------------- | ---------------------------- |
| **Accounting** | QuickBooks, Xero, NetSuite   |
| **CRM**        | Salesforce, HubSpot, Zoho    |
| **Analytics**  | Business intelligence tools  |
| **Support**    | Zendesk, Intercom, Freshdesk |

### 🚀 Scalability & Reliability

#### Infrastructure Requirements

- **Database Architecture**: Read replicas for analytics, write-optimized primary with connection pooling
- **Caching Strategy**: Multi-layer caching with Redis clusters for subscription state and pricing
- **Queue Processing**: Background job system for non-critical operations with retry logic
- **CDN Integration**: Global content delivery for billing portals and documentation

#### Disaster Recovery

- **Multi-region Deployment**: Active-active across at least two geographic regions
- **Data Resilience**: Real-time replication with point-in-time recovery
- **Business Continuity**: Manual processing workflows for complete system outages
- **Incident Response**: Documented playbooks for payment processor outages and security incidents

### 📅 Implementation Phases

| Phase                     | Timeline    | Scope                                                                                |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| **Phase 1: Foundation**   | Weeks 1-4   | Core subscription engine, single payment processor, basic tier structure             |
| **Phase 2: Scale**        | Weeks 5-8   | Multi-processor architecture, usage-based billing, advanced dunning, basic analytics |
| **Phase 3: Enterprise**   | Weeks 9-12  | Complex pricing models, contract management, security compliance                     |
| **Phase 4: Optimization** | Weeks 13-16 | Performance tuning, advanced analytics, security audit preparation                   |

### 🎯 Success Criteria

#### Technical Excellence

| Metric            | Target                                        |
| ----------------- | --------------------------------------------- |
| **Uptime**        | 99.95% for payment processing operations      |
| **Response Time** | Sub-2-second for 95th percentile API requests |
| **Data Loss**     | Zero in financial transactions                |
| **Error Rate**    | Less than 0.1% in payment processing          |

#### Business Impact

| Metric                           | Target                               |
| -------------------------------- | ------------------------------------ |
| **Payment Failure Rate**         | Less than 1% after recovery attempts |
| **Free to Paid Conversion**      | Greater than 20%                     |
| **Monthly Voluntary Churn**      | Less than 5%                         |
| **Automated Revenue Collection** | Over 90% of total revenue            |

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Setting up your development environment
- Code style guidelines
- Testing requirements
- Submitting pull requests

## License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.

## Support

- **Issues**: [GitHub Issues](https://github.com/Michiganman2353/ESTA-Logic/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Michiganman2353/ESTA-Logic/discussions)
- **Security**: For security concerns, please see [SECURITY.md](./SECURITY.md)

---

**Built with ❤️ for Michigan small businesses**

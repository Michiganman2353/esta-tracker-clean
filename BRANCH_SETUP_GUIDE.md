# Git Branch Tree Setup Guide

## Overview

This guide explains how to use the `setup-git-branches.sh` script to create the complete Git branch structure for the ESTA Tracker project.

## Quick Start

```bash
# Make the script executable (if not already)
chmod +x setup-git-branches.sh

# Run the script
./setup-git-branches.sh
```

## What the Script Does

The script creates a comprehensive, hierarchical Git branch structure that includes:

### 1. Main Branches
- **main**: Production-ready code; merges from develop after QA
- **develop**: Integration branch for active development; features merge here for testing

### 2. Feature Branches (from develop)

#### Section 1: Vision & Purpose
- `feature/section-1-vision-purpose`: Vision docs, purpose, long-term goals

#### Section 2: User Roles & Permissions
- `feature/section-2-user-roles-permissions`: Roles and permissions management

#### Section 3: Core Features (Parent + 12 Sub-branches)
- `feature/section-3-core-features` (Parent branch)
  - `feature/section-3.1-sick-time-accrual-engine`: Accrual calculations and caps
  - `feature/section-3.2-pto-request-system`: PTO submissions and approvals
  - `feature/section-3.3-multi-day-absence-documentation`: Document uploads and storage
  - `feature/section-3.4-compliance-ai-assistant`: AI-powered compliance checking
  - `feature/section-3.5-notice-submission-final-review`: Validation and approval workflows
  - `feature/section-3.6-hours-import-options`: Manual entry, CSV, API integrations
  - `feature/section-3.7-offboarding-wizard`: Employee offboarding process
  - `feature/section-3.8-document-library`: Templates and compliance documents
  - `feature/section-3.9-company-wide-calendar`: Scheduling and availability views
  - `feature/section-3.10-advanced-reporting-suite`: Analytics and exports
  - `feature/section-3.11-hr-notes-incident-logs`: Private notes and logs
  - `feature/section-3.12-automated-compliance-certificate`: Year-end certifications

#### Section 4: System Architecture (Parent + 4 Sub-branches)
- `feature/section-4-system-architecture` (Parent branch)
  - `feature/section-4.1-frontend`: React + Next.js implementation
  - `feature/section-4.2-backend`: Firebase services
  - `feature/section-4.3-data-model`: Database schema and models
  - `feature/section-4.4-security-privacy`: Security rules and encryption

#### Section 5: Workflows (Parent + 4 Sub-branches)
- `feature/section-5-workflows` (Parent branch)
  - `feature/section-5.1-employer-setup-wizard`: Initial setup flow
  - `feature/section-5.2-employee-flow`: Employee user journey
  - `feature/section-5.3-manager-flow`: Manager workflows
  - `feature/section-5.4-weekly-automation`: Automated tasks

#### Section 6: UI/UX Design
- `feature/section-6-ui-ux-design`: Interface design and user experience

#### Section 7: Legal Compliance
- `feature/section-7-legal-compliance`: MI ESTA 2025 compliance

#### Section 8: Long-term Roadmap
- `feature/section-8-long-term-roadmap`: Future planning and phases

#### Section 9: Brand & Business Strategy
- `feature/section-9-brand-business-strategy`: Business model and branding

### 3. Release Branches (from develop)
- `release/phase-1-mvp`: MVP release
- `release/phase-2`: Payroll integrations and mobile
- `release/phase-3`: Multi-state and white-label
- `release/phase-4`: National expansion

### 4. Hotfix Branches (from main)
- `hotfix/example-placeholder`: Example placeholder (delete and create as needed)

### 5. Documentation Branches (from develop)
- `docs/example-placeholder`: Example placeholder (delete and create as needed)

## Branch Hierarchy

```
main (production-ready)
├── develop (integration)
│   ├── feature/section-1-vision-purpose
│   ├── feature/section-2-user-roles-permissions
│   ├── feature/section-3-core-features
│   │   ├── feature/section-3.1-sick-time-accrual-engine
│   │   ├── feature/section-3.2-pto-request-system
│   │   ├── feature/section-3.3-multi-day-absence-documentation
│   │   ├── feature/section-3.4-compliance-ai-assistant
│   │   ├── feature/section-3.5-notice-submission-final-review
│   │   ├── feature/section-3.6-hours-import-options
│   │   ├── feature/section-3.7-offboarding-wizard
│   │   ├── feature/section-3.8-document-library
│   │   ├── feature/section-3.9-company-wide-calendar
│   │   ├── feature/section-3.10-advanced-reporting-suite
│   │   ├── feature/section-3.11-hr-notes-incident-logs
│   │   └── feature/section-3.12-automated-compliance-certificate
│   ├── feature/section-4-system-architecture
│   │   ├── feature/section-4.1-frontend
│   │   ├── feature/section-4.2-backend
│   │   ├── feature/section-4.3-data-model
│   │   └── feature/section-4.4-security-privacy
│   ├── feature/section-5-workflows
│   │   ├── feature/section-5.1-employer-setup-wizard
│   │   ├── feature/section-5.2-employee-flow
│   │   ├── feature/section-5.3-manager-flow
│   │   └── feature/section-5.4-weekly-automation
│   ├── feature/section-6-ui-ux-design
│   ├── feature/section-7-legal-compliance
│   ├── feature/section-8-long-term-roadmap
│   ├── feature/section-9-brand-business-strategy
│   ├── release/phase-1-mvp
│   ├── release/phase-2
│   ├── release/phase-3
│   ├── release/phase-4
│   └── docs/example-placeholder
└── hotfix/example-placeholder
```

## Script Features

### ✅ Idempotent
- Safe to run multiple times
- Checks if branches exist before creating
- Skips existing branches automatically

### ✅ Error Handling
- Exits on errors with descriptive messages
- Validates Git repository state
- Handles missing commits gracefully

### ✅ Progress Reporting
- Colored output for easy reading
- Success/error/warning messages
- Step-by-step progress updates

### ✅ Best Practices
- No force pushes
- Creates initial commit if needed
- Maintains proper branch hierarchy
- Sequential creation to prevent conflicts

### ✅ File Cleanup
- Deletes all files that don't conform to the branch structure
- Preserves the `.git` directory
- Creates a clean slate for branch structure

## Verification Commands

After running the script, verify the setup:

### View all branches
```bash
git branch -a
```

### Visualize branch tree
```bash
git log --graph --oneline --all --decorate
```

### Check current branch
```bash
git branch
```

### Switch to a specific branch
```bash
git checkout feature/section-3.1-sick-time-accrual-engine
```

## Working with the Branch Structure

### Creating a Hotfix
```bash
# Delete the placeholder
git branch -d hotfix/example-placeholder

# Create your hotfix branch from main
git checkout main
git checkout -b hotfix/security-vuln
```

### Creating Documentation Updates
```bash
# Delete the placeholder
git branch -d docs/example-placeholder

# Create your docs branch from develop
git checkout develop
git checkout -b docs/readme-enhance
```

### Feature Development Workflow

1. **Start a new feature**
   ```bash
   git checkout feature/section-3.1-sick-time-accrual-engine
   # Make your changes
   git add .
   git commit -m "Implement accrual calculation"
   ```

2. **Merge to parent branch** (if working on sub-branch)
   ```bash
   git checkout feature/section-3-core-features
   git merge feature/section-3.1-sick-time-accrual-engine
   ```

3. **Merge to develop** (when feature is complete)
   ```bash
   git checkout develop
   git merge feature/section-3-core-features
   ```

4. **Release to main** (after QA)
   ```bash
   git checkout main
   git merge develop
   ```

## Troubleshooting

### Script fails with "not a git repository"
The script will automatically initialize a Git repository if needed.

### Branch already exists error
The script checks for existing branches and skips them. This error should not occur.

### Need to start fresh
```bash
# Delete all branches except main
git checkout main
git branch | grep -v "main" | xargs git branch -D

# Re-run the script
./setup-git-branches.sh
```

### Cannot delete a branch
```bash
# Force delete if needed
git branch -D branch-name
```

## Notes

- The script does NOT add any files or content to branches
- All branches are created empty, ready for development
- The placeholder branches for `hotfix/` and `docs/` namespaces should be deleted and recreated as needed
- The script preserves the current working directory state

## Support

For issues or questions about the branch structure, refer to the repository documentation or contact the project maintainer.

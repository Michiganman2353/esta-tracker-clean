# Contributing to ESTA Tracker

Thank you for your interest in contributing to ESTA Tracker! This document provides guidelines and information to help you contribute effectively.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Architecture Overview](#architecture-overview)
- [Testing Requirements](#testing-requirements)
- [Submission Guidelines](#submission-guidelines)
- [Communication](#communication)

## Getting Started

ESTA Tracker is a Michigan-specific compliance and workforce-management application built to help employers track, calculate, and document paid sick time required by the Michigan Employee Earned Sick Time Act (ESTA) of 2025.

### Prerequisites

- Node.js 20.x (see `.nvmrc`)
- npm ≥10.0.0
- Git
- A GitHub account

### First Time Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ESTA-Logic.git
   cd ESTA-Logic
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Development Setup

### Project Structure

```
ESTA-Logic/
├── packages/
│   ├── frontend/          # React + Vite application
│   └── backend/           # Express API
├── functions/             # Firebase Cloud Functions
├── docs/                  # Documentation
│   ├── architecture/      # Architecture and technical docs
│   ├── deployment/        # Deployment guides
│   ├── design/            # Archived design documents
│   ├── security/          # Security documentation
│   ├── setup/             # Setup guides
│   └── archive/           # Historical documentation
├── scripts/               # Utility scripts
└── e2e/                   # End-to-end tests
```

### Available Commands

```bash
# Development
npm run dev                 # Start development server
npm run dev:frontend        # Frontend only
npm run dev:backend         # Backend only

# Building
npm run build               # Build all packages
npm run build:frontend      # Build frontend only
npm run build:backend       # Build backend only

# Testing
npm test                    # Run all tests
npm run test:frontend       # Frontend tests
npm run test:backend        # Backend tests
npm run test:e2e            # End-to-end tests

# Linting
npm run lint                # Lint all packages
npm run lint:fix            # Auto-fix linting issues

# Type Checking
npm run typecheck           # Check TypeScript types
```

## Code Style Guidelines

### General Principles

- **Write clean, readable code**: Code is read more often than it is written
- **Keep it simple**: Avoid over-engineering; prefer simple, maintainable solutions
- **Be consistent**: Follow existing patterns in the codebase
- **Document complex logic**: Add comments for non-obvious code

### TypeScript Guidelines

- Use TypeScript for all new code
- Define explicit types; avoid `any` unless absolutely necessary
- Use interfaces for object shapes
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names

### React Guidelines

- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Extract reusable logic into custom hooks
- Use TypeScript for props definitions
- Follow the existing component structure in `packages/frontend/src/components/`

### File Naming

- Components: `PascalCase.tsx` (e.g., `EmployeeList.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Tests: `*.test.ts` or `*.test.tsx`
- Types: `types.ts` or inline with the module

### Code Formatting

- We use Prettier for code formatting
- Run `npm run lint:fix` before committing
- Prettier configuration is in `.prettierrc`
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required

### Comments

- Use JSDoc comments for functions and classes
- Add inline comments for complex logic
- Keep comments up-to-date with code changes
- Don't comment obvious code

Example:
```typescript
/**
 * Calculate sick time accrual based on hours worked
 * @param hoursWorked - Total hours worked in the period
 * @param employerSize - Number of employees (determines cap)
 * @returns Accrued sick time in hours
 */
function calculateAccrual(hoursWorked: number, employerSize: number): number {
  // Michigan ESTA: 1 hour per 30 hours worked
  const baseAccrual = hoursWorked / 30;
  
  // Apply cap based on employer size
  const cap = employerSize > 50 ? 72 : 40;
  return Math.min(baseAccrual, cap);
}
```

## Architecture Overview

### Technology Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Hosting**: Vercel (Frontend), Firebase (Functions)

### Key Architectural Decisions

1. **Monorepo Structure**: Using npm workspaces for shared code and dependencies
2. **Type Safety**: TypeScript throughout for reliability
3. **Security First**: Encryption for sensitive data, role-based access control
4. **Compliance Focus**: Built-in Michigan ESTA law compliance logic

For detailed architecture information, see [docs/architecture/architecture.md](./docs/architecture/architecture.md).

### Data Security

- All sensitive employee data (SSN, tax IDs) is encrypted using Google Cloud KMS
- Role-based access control enforced at Firestore rules level
- Audit logging for all data access and modifications
- See [docs/security/](./docs/security/) for security details

## Testing Requirements

### Test Coverage Expectations

- All new features must include tests
- Aim for >80% code coverage for critical business logic
- Bug fixes should include regression tests

### Types of Tests

1. **Unit Tests** (Vitest)
   - Test individual functions and components
   - Fast, isolated tests
   - Place tests next to the code: `file.test.ts`

2. **Integration Tests** (Vitest)
   - Test interactions between modules
   - Test API endpoints
   - Mock external services

3. **End-to-End Tests** (Playwright)
   - Test complete user workflows
   - Located in `e2e/` directory
   - Run against deployed preview environments

### Writing Tests

Example unit test:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateAccrual } from './accrual';

describe('calculateAccrual', () => {
  it('calculates accrual at 1 hour per 30 hours worked', () => {
    const result = calculateAccrual(30, 10);
    expect(result).toBe(1);
  });

  it('applies 40-hour cap for small employers', () => {
    const result = calculateAccrual(1200, 10);
    expect(result).toBe(40);
  });

  it('applies 72-hour cap for large employers', () => {
    const result = calculateAccrual(2160, 100);
    expect(result).toBe(72);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for active development)
npm run test:frontend -- --watch

# Run with coverage
npm run test:frontend -- --coverage

# Run specific test file
npm run test:frontend -- src/lib/accrual.test.ts
```

## Submission Guidelines

### Before Submitting a Pull Request

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow the code style guidelines
   - Write or update tests
   - Update documentation if needed

3. **Test your changes**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Use conventional commit messages:
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting)
   - `refactor:` - Code refactoring
   - `test:` - Test changes
   - `chore:` - Build process or auxiliary tool changes

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**:
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template with:
     - Description of changes
     - Related issue number (if applicable)
     - Testing performed
     - Screenshots (for UI changes)

### Pull Request Review Process

1. **Automated Checks**: All PRs must pass:
   - Linting (ESLint + Prettier)
   - Type checking (TypeScript)
   - Unit tests (Vitest)
   - Build verification

2. **Code Review**: A maintainer will review your code for:
   - Code quality and style
   - Test coverage
   - Documentation
   - Security considerations

3. **Feedback**: Address any feedback from reviewers
   - Make requested changes
   - Push updates to your branch
   - Reply to comments

4. **Merge**: Once approved, a maintainer will merge your PR

### What Makes a Good Pull Request

- **Focused scope**: One feature or fix per PR
- **Clear description**: Explain what and why, not just how
- **Well-tested**: Include relevant tests
- **Documented**: Update docs for user-facing changes
- **Small size**: Easier to review and merge
- **Clean commits**: Logical, well-described commits

## Communication

### Reporting Issues

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (browser, OS, etc.)

### Suggesting Features

Feature requests should include:
- Clear use case and problem statement
- Proposed solution
- Alternative approaches considered
- Impact on existing functionality

### Getting Help

- **Questions**: Open a discussion on GitHub Discussions
- **Bugs**: Open an issue with the bug template
- **Features**: Open an issue with the feature template
- **Security**: Email security@esta-tracker.com (do not open public issues)

## License

By contributing to ESTA Tracker, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## Recognition

Contributors will be recognized in our README and release notes. Thank you for helping make ESTA Tracker better!

---

**Questions?** Open an issue or discussion on GitHub. We're here to help!

# ESTA Tracker Applications

This directory contains the application-level projects in the ESTA Tracker monorepo.

## Structure

```
apps/
├── frontend/     # React web application
└── backend/      # Express.js API server
```

## Applications

### Frontend (`apps/frontend`)

The React-based web application providing the user interface for ESTA Tracker.

**Key Features:**
- React 18 with TypeScript
- Vite for blazing-fast development and builds
- React Router for navigation
- Zustand for state management
- Tailwind CSS for styling
- Firebase integration for authentication and data

**Commands:**
```bash
# Development
npx nx dev frontend

# Build
npx nx build frontend

# Test
npx nx test frontend

# Lint
npx nx lint frontend

# Type check
npx nx typecheck frontend
```

**Module Scope:** `scope:frontend`
- Can only depend on libraries tagged with `scope:frontend` or `scope:shared`
- Cannot directly depend on backend code

### Backend (`apps/backend`)

The Express.js API server handling business logic and data operations.

**Key Features:**
- Express.js with TypeScript
- Helmet for security
- CORS configuration
- Input validation with Zod
- PostgreSQL database integration
- JWT authentication
- Google Cloud KMS integration

**Commands:**
```bash
# Development (watch mode)
npx nx dev backend

# Build
npx nx build backend

# Start (production)
npx nx start backend

# Test
npx nx test backend

# Lint
npx nx lint backend

# Type check
npx nx typecheck backend
```

**Module Scope:** `scope:backend`
- Can only depend on libraries tagged with `scope:backend` or `scope:shared`
- Cannot directly depend on frontend code

## Development Guidelines

### Module Boundaries

Both applications must respect module boundaries enforced by Nx and ESLint:

1. **Frontend** can only import from:
   - `libs/shared-types`
   - `libs/shared-utils`
   - `libs/esta-firebase`
   - `libs/accrual-engine` (if needed)

2. **Backend** can only import from:
   - `libs/shared-types`
   - `libs/shared-utils`
   - `libs/accrual-engine`
   - `libs/csv-processor`

3. **Never** import directly between frontend and backend

### Environment Variables

All environment variables must be properly configured:

**Frontend:**
- All Firebase config must use `VITE_` prefix
- See `.env.example` for required variables

**Backend:**
- Database connection strings
- JWT secrets
- External API keys
- See backend README for specifics

### Testing

Both applications should maintain high test coverage:
- Unit tests for business logic
- Integration tests for critical paths
- E2E tests for user workflows

### Security

Applications must follow security best practices:
- No secrets in code
- Input validation on all endpoints
- Proper authentication/authorization
- CORS properly configured
- Security headers via Helmet (backend)

## CI/CD

Applications are built and tested using Nx affected commands:
```bash
# Build only affected apps
npx nx affected --target=build

# Test only affected apps
npx nx affected --target=test

# Lint only affected apps
npx nx affected --target=lint
```

## Deployment

### Frontend
- Built to `apps/frontend/dist`
- Deployed to Vercel
- Environment variables configured in Vercel dashboard

### Backend
- Built to `apps/backend/dist`
- Deployable to any Node.js hosting platform
- Requires environment variable configuration

## Adding New Applications

To add a new application:

1. Create directory in `apps/`
2. Add `project.json` with appropriate Nx configuration
3. Add appropriate scope tag (`scope:frontend`, `scope:backend`, or custom)
4. Update this README
5. Configure module boundary constraints in root `.eslintrc.json`

## Resources

- [Nx Documentation](https://nx.dev)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [TypeScript Documentation](https://www.typescriptlang.org)

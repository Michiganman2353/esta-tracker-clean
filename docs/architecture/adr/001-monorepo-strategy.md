# ADR 001: Monorepo Strategy - Nx vs Turborepo

**Status**: Proposed  
**Date**: 2025-11-20  
**Decision Makers**: Engineering Team  
**Consulted**: DevOps, Security Team  

## Context

ESTA Tracker is currently using npm workspaces for a basic monorepo structure with two packages (frontend and backend). As we scale to Phase Two, we need a more sophisticated monorepo tool that provides:

1. **Efficient task orchestration** - Build only what changed
2. **Remote/distributed caching** - Share build artifacts across CI/CD and developer machines
3. **Dependency graph management** - Understand and optimize package relationships
4. **Build pipeline optimization** - Parallel execution, intelligent scheduling
5. **Developer experience** - Fast feedback loops, easy onboarding
6. **Serverless + Firebase compatibility** - Works with our deployment targets
7. **Long-term scalability** - Support for future shared packages and multi-state expansion

## Current State Analysis

### Repository Structure
```
esta-tracker-clean/
├── packages/
│   ├── frontend/          # React + Vite + TypeScript
│   └── backend/           # Node + Express + TypeScript
├── api/                   # Vercel serverless functions
├── functions/             # Firebase Cloud Functions
├── docs/                  # Documentation
├── e2e/                   # Playwright E2E tests
└── scripts/               # Build & deployment scripts
```

### Current Challenges
1. **Code Duplication**: Accrual calculation logic exists in both frontend (`accrualCalculations.ts`, `accrualRules.ts`) and backend (`accrual.ts`)
2. **No Build Caching**: Every CI run rebuilds everything from scratch
3. **Manual Dependency Management**: No automatic task ordering
4. **Limited Scalability**: Adding shared packages requires manual configuration
5. **Slow CI/CD**: Rebuilds all packages even when only one changes
6. **No Remote Caching**: Developers can't leverage CI build artifacts

## Decision Criteria

| Criterion | Weight | Nx | Turborepo |
|-----------|--------|----|-----------| 
| Task Orchestration | Critical | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Remote Caching | Critical | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| TypeScript Support | Critical | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Learning Curve | High | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Build Speed | Critical | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Firebase/Vercel Support | Critical | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Community & Plugins | High | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Configuration Complexity | Medium | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Maintenance Overhead | Medium | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| CI/CD Integration | Critical | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Option 1: Nx

### Overview
Nx is a powerful, extensible monorepo tool developed by Nrwl. It's feature-rich with a plugin ecosystem and sophisticated build orchestration.

### Pros
✅ **Powerful Task Orchestration**
- Advanced dependency graph visualization with `nx graph`
- Automatic task ordering based on dependencies
- Parallel execution with intelligent scheduling
- Affected command: `nx affected:build` runs only changed packages

✅ **Excellent TypeScript Support**
- First-class TypeScript integration
- Built-in code generation for TypeScript projects
- Strong type checking across packages

✅ **Rich Plugin Ecosystem**
- Official plugins for React, Node, Vite, Express
- Community plugins for Firebase, Vercel
- Extensible with custom plugins

✅ **Advanced Caching**
- Local computation caching
- Remote caching via Nx Cloud (paid) or custom solutions
- Cache inputs/outputs configuration per task

✅ **Built-in Generators**
- Scaffolding for new packages, components, services
- Consistent project structure
- Reduces boilerplate

✅ **Workspace Analysis**
- Dependency graph visualization
- Circular dependency detection
- Impact analysis for changes

### Cons
❌ **Steeper Learning Curve**
- More concepts to understand (executors, generators, plugins)
- Nx Cloud setup requires additional configuration
- Can feel overwhelming for simple monorepos

❌ **Configuration Complexity**
- Requires `nx.json`, `workspace.json`, and project-level configs
- More moving parts to maintain
- Opinionated structure can conflict with existing setups

❌ **Nx Cloud Cost**
- Remote caching via Nx Cloud has usage limits on free tier
- Self-hosted remote cache requires infrastructure setup
- May incur costs as team scales

❌ **Heavier Footprint**
- Larger dependency tree
- More abstractions between you and your build tools
- Can slow down in very large monorepos (100+ packages)

### Cost Analysis
- **Nx Cloud Free Tier**: 500 hours/month remote cache usage (sufficient for small teams)
- **Nx Cloud Pro**: $49/month for unlimited caching (scales with team size)
- **Self-Hosted**: Free but requires infrastructure (S3, Redis, etc.)

### Nx Configuration Example
```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"],
        "parallel": 3
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

## Option 2: Turborepo

### Overview
Turborepo is a high-performance build system for JavaScript/TypeScript monorepos, developed by Vercel. It's simpler, faster, and more focused than Nx.

### Pros
✅ **Simplicity & Minimal Configuration**
- Single `turbo.json` configuration file
- Easy to understand and maintain
- Works with existing npm/yarn/pnpm workspaces
- Minimal changes to existing project structure

✅ **Exceptional Build Speed**
- Extremely fast task scheduling and execution
- Minimal overhead compared to Nx
- Written in Rust for performance (upcoming Turbo 2.0)
- Efficient parallel execution

✅ **Vercel Integration**
- Built by Vercel for Vercel
- First-class support for Vercel deployments
- Remote caching via Vercel automatically enabled
- Optimized for serverless environments

✅ **Zero-Config Remote Caching**
- Free remote caching via Vercel
- No additional infrastructure needed
- Automatic cache key generation
- Works out-of-the-box with GitHub Actions

✅ **Low Learning Curve**
- Minimal concepts to learn
- Works with existing build scripts
- No new abstractions
- Easy team onboarding

✅ **Flexible**
- Doesn't force specific project structure
- Works with any build tools (Vite, tsc, webpack, etc.)
- Compatible with Firebase Functions and Vercel serverless

✅ **Active Development**
- Backed by Vercel with strong commitment
- Rapid feature development
- Large community adoption

### Cons
❌ **Limited Plugin Ecosystem**
- No official plugin system
- Can't extend with custom generators
- Less tooling for scaffolding new packages

❌ **No Built-in Generators**
- Must manually create new packages
- No code generation tools
- Requires more manual setup for new components

❌ **Simpler Dependency Graph**
- No visual dependency graph tool (yet)
- Less sophisticated analysis tools
- Fewer workspace introspection features

❌ **Fewer Advanced Features**
- No built-in code generation
- No workspace migration tools
- Less sophisticated affected command

### Cost Analysis
- **Free**: Remote caching via Vercel is completely free for all projects
- **No Hidden Costs**: No premium tiers, no usage limits
- **Zero Infrastructure**: No need for self-hosted cache servers

### Turborepo Configuration Example
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Comparison Matrix

| Feature | Nx | Turborepo | Winner |
|---------|----|-----------| -------|
| **Setup Time** | 2-4 hours | 30-60 minutes | 🏆 Turborepo |
| **Build Speed** | Very Fast | Extremely Fast | 🏆 Turborepo |
| **Remote Cache Cost** | $49/month or self-host | Free (Vercel) | 🏆 Turborepo |
| **Learning Curve** | Moderate-Steep | Minimal | 🏆 Turborepo |
| **TypeScript Support** | Excellent | Very Good | 🏆 Nx |
| **Dependency Graph** | Advanced visualization | Basic | 🏆 Nx |
| **Code Generation** | Built-in generators | None | 🏆 Nx |
| **Vercel Integration** | Good | Excellent | 🏆 Turborepo |
| **Firebase Support** | Via plugins | Native | Tie |
| **Maintenance** | Higher | Lower | 🏆 Turborepo |
| **Flexibility** | Opinionated | Flexible | 🏆 Turborepo |
| **Plugin Ecosystem** | Rich | Limited | 🏆 Nx |
| **CI/CD Optimization** | Excellent | Excellent | Tie |
| **Team Onboarding** | 1-2 weeks | 1-2 days | 🏆 Turborepo |

## Decision

**We recommend Turborepo** for the following reasons:

### Primary Reasons
1. **Zero-Cost Remote Caching**: Free remote caching via Vercel eliminates infrastructure costs and complexity
2. **Vercel-First Architecture**: Since our frontend is deployed on Vercel, Turborepo's native integration is a major advantage
3. **Simplicity**: Minimal configuration and learning curve accelerates implementation and team onboarding
4. **Build Performance**: Extremely fast execution with minimal overhead
5. **Low Maintenance**: Single config file, no complex abstractions to maintain
6. **Current Architecture Fit**: Works seamlessly with our existing npm workspaces, Vite, and Express setup

### Why Not Nx?
While Nx is a powerful tool with advanced features, those features come at a cost:
- **Overkill for Current Scale**: We have 2 packages now, expanding to ~5-7 in Phase Two. Nx's complexity is better suited for 20+ packages
- **Infrastructure Costs**: Nx Cloud remote caching would require paid plans or self-hosting infrastructure
- **Complexity**: The learning curve and configuration overhead would slow down Phase Two implementation
- **Vercel Mismatch**: Nx doesn't have the same level of Vercel integration that Turborepo offers

### Future Considerations
If we scale to 20+ packages or need advanced code generation and workspace analysis, we can migrate to Nx. Turborepo's minimal configuration makes this migration path straightforward.

## Implementation Plan

### Phase 1: Turborepo Setup (1 day)
1. Install Turborepo: `npm install turbo --save-dev`
2. Create `turbo.json` with pipeline configuration
3. Update root `package.json` scripts to use `turbo`
4. Test local builds with caching

### Phase 2: Shared Packages (2-3 days)
1. Create `packages/shared-utils` - Common utilities, date/time logic
2. Create `packages/shared-types` - Shared TypeScript types and Zod schemas
3. Create `packages/accrual-engine` - Core accrual calculation logic
4. Create `packages/csv-processor` - CSV parsing and validation
5. Create `packages/api-client` - Type-safe API client
6. Update frontend and backend to consume shared packages

### Phase 3: CI/CD Integration (1 day)
1. Update GitHub Actions workflow to use Turborepo
2. Configure remote caching via Vercel
3. Add `turbo prune` for optimized deployments
4. Update deployment scripts

### Phase 4: Documentation (1 day)
1. Document Turborepo commands and workflows
2. Create developer onboarding guide
3. Document shared package architecture
4. Update contribution guidelines

### Total Timeline: 5-7 days

## Shared Packages Architecture

```
packages/
├── frontend/                    # React app (existing)
├── backend/                     # Express API (existing)
├── shared-types/                # NEW: TypeScript types, Zod schemas
│   ├── src/
│   │   ├── api.ts              # API request/response types
│   │   ├── employee.ts         # Employee types
│   │   ├── accrual.ts          # Accrual types
│   │   └── schemas/            # Zod validation schemas
│   └── package.json
├── shared-utils/                # NEW: Common utilities
│   ├── src/
│   │   ├── date.ts             # Date/time utilities
│   │   ├── validation.ts       # Validation helpers
│   │   ├── formatting.ts       # Formatting utilities
│   │   └── constants.ts        # Shared constants
│   └── package.json
├── accrual-engine/              # NEW: Core accrual logic
│   ├── src/
│   │   ├── calculator.ts       # Accrual calculations
│   │   ├── rules.ts            # Michigan ESTA rules
│   │   ├── carryover.ts        # Carryover logic
│   │   └── index.ts            # Public API
│   └── package.json
├── csv-processor/               # NEW: CSV processing (will migrate to Wasm)
│   ├── src/
│   │   ├── parser.ts           # CSV parsing
│   │   ├── validator.ts        # Data validation
│   │   ├── transformer.ts      # Data transformation
│   │   └── index.ts            # Public API
│   └── package.json
└── api-client/                  # NEW: Type-safe API client
    ├── src/
    │   ├── client.ts           # Base client
    │   ├── endpoints/          # Endpoint methods
    │   └── index.ts            # Public API
    └── package.json
```

## Migration Strategy

### Incremental Migration
1. **Week 1**: Set up Turborepo, create shared-types and shared-utils
2. **Week 2**: Extract accrual logic into accrual-engine package
3. **Week 3**: Extract CSV processing into csv-processor package
4. **Week 4**: Create api-client and integrate across frontend/backend

### Import Path Changes
```typescript
// Before
import { calculateAccrualForHours } from '../utils/accrualCalculations';

// After
import { calculateAccrualForHours } from '@esta-tracker/accrual-engine';
```

### Backward Compatibility
During migration, we'll maintain both old and new imports until all references are updated, ensuring zero downtime.

## Risks & Mitigation

### Risk 1: Build Pipeline Disruption
**Mitigation**: Implement Turborepo alongside existing npm workspaces initially, run both in parallel during validation

### Risk 2: Cache Invalidation Issues
**Mitigation**: Use conservative cache keys initially, add verbose logging to debug cache behavior

### Risk 3: Team Adoption Challenges
**Mitigation**: Comprehensive documentation, team training session, pair programming for first few integrations

### Risk 4: Vercel Deployment Changes
**Mitigation**: Test Turborepo with Vercel in staging environment first, use `turbo prune` for optimized deployments

## Success Metrics

1. **Build Time Reduction**: Target 50%+ reduction in CI/CD build times
2. **Developer Experience**: Reduce local build time by 60%+
3. **Cache Hit Rate**: Achieve 70%+ remote cache hit rate within 2 weeks
4. **Code Reuse**: Eliminate duplicate accrual logic, share 80%+ of validation code
5. **Team Velocity**: Reduce time to create new shared packages by 75%

## Monitoring

- Track build times in CI/CD over 4 weeks
- Monitor Turborepo cache hit rates via Vercel dashboard
- Survey team on developer experience monthly
- Review shared package adoption quarterly

## References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Nx Documentation](https://nx.dev/getting-started/intro)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos/turborepo)
- [Turborepo GitHub](https://github.com/vercel/turbo)
- [Monorepo Handbook](https://monorepo.tools/)

## Conclusion

**Turborepo is the optimal choice** for ESTA Tracker's Phase Two monorepo strategy. Its simplicity, zero-cost remote caching, Vercel integration, and minimal learning curve align perfectly with our immediate needs. As we scale, we have a clear migration path to Nx if needed, but Turborepo will serve us well for the next 12-18 months of growth.

**Next Steps**:
1. Get team approval on this ADR
2. Begin Turborepo implementation (Week 1 of Phase Two)
3. Create shared packages structure
4. Migrate accrual logic to shared package
5. Update CI/CD pipeline

---

**Approved by**: _[Pending]_  
**Implementation Start**: _[Pending]_

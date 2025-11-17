# ESTA Tracker - Scripts Directory

This directory contains automation scripts for managing the ESTA Tracker repository.

## Available Scripts

### `create-branch-hierarchy.sh`

Creates a comprehensive branch structure for the ESTA Tracker project, following Git Flow best practices with feature, release, hotfix, and documentation branches.

#### Purpose

Transform the Git repository into a well-organized branch tree that supports:
- Feature development organized by project sections
- Release management for different project phases
- Hotfix workflows for production emergencies
- Documentation management

#### Usage

```bash
# Make the script executable (if not already)
chmod +x scripts/create-branch-hierarchy.sh

# Run the script
./scripts/create-branch-hierarchy.sh
```

#### Features

✅ **Idempotent**: Safe to run multiple times - skips existing branches  
✅ **Error Handling**: Exits on errors with clear messages  
✅ **Progress Reporting**: Detailed output for each step  
✅ **Auto-initialization**: Creates git repo and initial commit if needed  
✅ **Validation**: Checks parent branch existence before creating children  

#### Branch Structure Created

The script creates the following branch hierarchy:

```
main (production)
├── develop (integration)
│   ├── feature/section-1-vision-purpose
│   ├── feature/section-2-user-roles-permissions
│   ├── feature/section-3-core-features (parent feature)
│   │   ├── feature/section-3.1-sick-time-accrual
│   │   ├── feature/section-3.2-pto-request-system
│   │   ├── feature/section-3.3-multi-day-absence
│   │   ├── feature/section-3.4-compliance-ai-assistant
│   │   ├── feature/section-3.5-notice-submission
│   │   ├── feature/section-3.6-hours-import
│   │   ├── feature/section-3.7-offboarding-wizard
│   │   ├── feature/section-3.8-document-library
│   │   ├── feature/section-3.9-company-calendar
│   │   ├── feature/section-3.10-reporting-suite
│   │   ├── feature/section-3.11-hr-notes
│   │   └── feature/section-3.12-compliance-certificate
│   ├── feature/section-4-system-architecture (parent feature)
│   │   ├── feature/section-4.1-frontend
│   │   ├── feature/section-4.2-backend
│   │   ├── feature/section-4.3-data-model
│   │   └── feature/section-4.4-security-privacy
│   ├── feature/section-5-workflows (parent feature)
│   │   ├── feature/section-5.1-employer-setup-wizard
│   │   ├── feature/section-5.2-employee-flow
│   │   ├── feature/section-5.3-manager-flow
│   │   └── feature/section-5.4-weekly-automation
│   ├── feature/section-6-uiux-design
│   ├── feature/section-7-legal-compliance
│   ├── feature/section-8-long-term-roadmap
│   ├── feature/section-9-brand-business
│   ├── release/phase-1-mvp
│   ├── release/phase-2
│   ├── release/phase-3
│   ├── release/phase-4
│   └── docs/documentation
└── hotfix/emergency-fixes
```

#### Branch Organization

**Main Branches:**
- `main` - Production-ready code
- `develop` - Integration branch for features

**Feature Branches:**
- Section 1-2: Vision, purpose, and user roles
- Section 3: Core features (with 12 sub-branches for specific features)
- Section 4: System architecture (with 4 sub-branches)
- Section 5: Workflows (with 4 sub-branches)
- Sections 6-9: UI/UX, compliance, roadmap, and business strategy

**Release Branches:**
- `release/phase-1-mvp` - Minimum Viable Product
- `release/phase-2` - Second phase features
- `release/phase-3` - Third phase expansion
- `release/phase-4` - National rollout

**Support Branches:**
- `hotfix/emergency-fixes` - Production hotfixes (from main)
- `docs/documentation` - Documentation updates (from develop)

#### Verification Commands

After running the script, verify the branch structure:

```bash
# List all branches
git branch -a

# View branch count
git branch | wc -l

# View branch graph
git log --graph --oneline --all --decorate

# View specific branch lineage
git log --graph --oneline --decorate feature/section-3-core-features
```

#### Expected Output

When run successfully, you should see:
- ✓ Green checkmarks for successfully created branches
- ⚠ Yellow warnings for branches that already exist (safe to ignore)
- ℹ Blue info messages for progress updates
- Final summary with total branch count (38 branches expected)
- Visual branch tree structure

#### Error Scenarios

The script will exit with an error if:
- Git fails to initialize (if needed)
- Parent branch doesn't exist when creating a child
- Git commands fail for any reason

#### Best Practices

1. **Run from repository root**: Always execute from the repository root directory
2. **Clean working tree**: Commit or stash changes before running
3. **Review output**: Check the summary to ensure all branches were created
4. **Idempotent**: Safe to re-run if interrupted or to verify branch structure

#### Workflow Integration

After creating the branch hierarchy:

1. **Feature Development**: Check out feature branches for specific sections
   ```bash
   git checkout feature/section-3.1-sick-time-accrual
   ```

2. **Merging**: Merge sub-features into parent features, then into develop
   ```bash
   git checkout feature/section-3-core-features
   git merge feature/section-3.1-sick-time-accrual
   ```

3. **Releases**: Create releases from develop when ready
   ```bash
   git checkout release/phase-1-mvp
   git merge develop
   ```

4. **Hotfixes**: Branch from main for critical fixes
   ```bash
   git checkout hotfix/emergency-fixes
   # Make fixes, then merge to both main and develop
   ```

#### Technical Details

- **Language**: Bash (requires bash 4.0+)
- **Dependencies**: Git 2.0+
- **Exit Codes**: 
  - 0: Success
  - 1: Error (see error message for details)
- **Color Output**: Uses ANSI color codes for better readability
- **Safety**: Uses `set -e` to exit on any command failure

#### Contributing

When adding new features or sections:
1. Update the branch structure in the script
2. Follow the existing naming convention: `feature/section-X-description`
3. Update this README with the new branch structure
4. Test the script to ensure idempotency

---

For questions or issues with this script, please refer to the main project documentation or open an issue in the repository.

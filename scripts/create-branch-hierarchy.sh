#!/bin/bash

################################################################################
# ESTA Tracker - Branch Hierarchy Creation Script
################################################################################
# 
# Purpose: Transform the current Git repository into a comprehensive branch tree
#          that supports the full development workflow for the ESTA Tracker project.
#
# Usage: ./scripts/create-branch-hierarchy.sh
#
# Features:
# - Idempotent: Can be run multiple times safely
# - Creates main/develop branches if needed
# - Creates feature branches organized by sections
# - Creates release branches for different phases
# - Creates hotfix and docs branches
# - Detailed progress reporting
# - Error handling and validation
#
# Branch Structure Created:
# - main (production)
# - develop (integration)
# - feature/section-* (feature branches)
# - release/phase-* (release branches)
# - hotfix/ (emergency fixes)
# - docs/ (documentation)
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error handler
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

# Success message
success_msg() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Info message
info_msg() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Warning message
warn_msg() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if branch exists locally
branch_exists() {
    local branch_name="$1"
    git rev-parse --verify "$branch_name" >/dev/null 2>&1
}

# Create branch if it doesn't exist
create_branch() {
    local branch_name="$1"
    local parent_branch="$2"
    
    if branch_exists "$branch_name"; then
        warn_msg "Branch '$branch_name' already exists. Skipping."
        return 0
    fi
    
    info_msg "Creating branch '$branch_name' from '$parent_branch'..."
    
    # Ensure parent branch exists
    if ! branch_exists "$parent_branch"; then
        error_exit "Parent branch '$parent_branch' does not exist. Cannot create '$branch_name'."
    fi
    
    # Create the branch
    git branch "$branch_name" "$parent_branch" || error_exit "Failed to create branch '$branch_name'"
    success_msg "Created branch '$branch_name'"
}

# Print section header
print_header() {
    echo ""
    echo "================================================================================"
    echo -e "${BLUE}$1${NC}"
    echo "================================================================================"
}

################################################################################
# MAIN SCRIPT EXECUTION
################################################################################

print_header "ESTA Tracker - Branch Hierarchy Creation Script"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    warn_msg "Not a git repository. Initializing..."
    git init || error_exit "Failed to initialize git repository"
    success_msg "Git repository initialized"
    
    # Create initial commit if there are no commits
    if ! git rev-parse HEAD >/dev/null 2>&1; then
        info_msg "Creating initial commit..."
        touch .gitkeep
        git add .gitkeep
        git commit -m "Initial commit" || error_exit "Failed to create initial commit"
        success_msg "Initial commit created"
    fi
else
    success_msg "Git repository detected"
fi

# Ensure we have at least one commit
if ! git rev-parse HEAD >/dev/null 2>&1; then
    info_msg "No commits found. Creating initial commit..."
    touch .gitkeep
    git add .gitkeep
    git commit -m "Initial commit" || error_exit "Failed to create initial commit"
    success_msg "Initial commit created"
fi

################################################################################
# Step 1: Create main branch
################################################################################

print_header "Step 1: Creating Main Branch"

if ! branch_exists "main"; then
    info_msg "Creating 'main' branch..."
    # If we're on master or another branch, create main from current HEAD
    git branch main HEAD || error_exit "Failed to create main branch"
    success_msg "Created 'main' branch"
else
    success_msg "'main' branch already exists"
fi

################################################################################
# Step 2: Create develop branch
################################################################################

print_header "Step 2: Creating Develop Branch"

create_branch "develop" "main"

################################################################################
# Step 3: Create Feature Branches (Sections 1-2)
################################################################################

print_header "Step 3: Creating Feature Branches - Sections 1-2"

create_branch "feature/section-1-vision-purpose" "develop"
create_branch "feature/section-2-user-roles-permissions" "develop"

################################################################################
# Step 4: Create Section 3 - Core Features (with sub-branches)
################################################################################

print_header "Step 4: Creating Section 3 - Core Features (Parent + Sub-branches)"

# Create parent feature branch for Section 3
create_branch "feature/section-3-core-features" "develop"

# Create sub-branches for Section 3
info_msg "Creating Section 3 sub-branches (3.1 to 3.12)..."
create_branch "feature/section-3.1-sick-time-accrual" "feature/section-3-core-features"
create_branch "feature/section-3.2-pto-request-system" "feature/section-3-core-features"
create_branch "feature/section-3.3-multi-day-absence" "feature/section-3-core-features"
create_branch "feature/section-3.4-compliance-ai-assistant" "feature/section-3-core-features"
create_branch "feature/section-3.5-notice-submission" "feature/section-3-core-features"
create_branch "feature/section-3.6-hours-import" "feature/section-3-core-features"
create_branch "feature/section-3.7-offboarding-wizard" "feature/section-3-core-features"
create_branch "feature/section-3.8-document-library" "feature/section-3-core-features"
create_branch "feature/section-3.9-company-calendar" "feature/section-3-core-features"
create_branch "feature/section-3.10-reporting-suite" "feature/section-3-core-features"
create_branch "feature/section-3.11-hr-notes" "feature/section-3-core-features"
create_branch "feature/section-3.12-compliance-certificate" "feature/section-3-core-features"

################################################################################
# Step 5: Create Section 4 - System Architecture (with sub-branches)
################################################################################

print_header "Step 5: Creating Section 4 - System Architecture (Parent + Sub-branches)"

# Create parent feature branch for Section 4
create_branch "feature/section-4-system-architecture" "develop"

# Create sub-branches for Section 4
info_msg "Creating Section 4 sub-branches (4.1 to 4.4)..."
create_branch "feature/section-4.1-frontend" "feature/section-4-system-architecture"
create_branch "feature/section-4.2-backend" "feature/section-4-system-architecture"
create_branch "feature/section-4.3-data-model" "feature/section-4-system-architecture"
create_branch "feature/section-4.4-security-privacy" "feature/section-4-system-architecture"

################################################################################
# Step 6: Create Section 5 - Workflows (with sub-branches)
################################################################################

print_header "Step 6: Creating Section 5 - Workflows (Parent + Sub-branches)"

# Create parent feature branch for Section 5
create_branch "feature/section-5-workflows" "develop"

# Create sub-branches for Section 5
info_msg "Creating Section 5 sub-branches (5.1 to 5.4)..."
create_branch "feature/section-5.1-employer-setup-wizard" "feature/section-5-workflows"
create_branch "feature/section-5.2-employee-flow" "feature/section-5-workflows"
create_branch "feature/section-5.3-manager-flow" "feature/section-5-workflows"
create_branch "feature/section-5.4-weekly-automation" "feature/section-5-workflows"

################################################################################
# Step 7: Create Feature Branches (Sections 6-9)
################################################################################

print_header "Step 7: Creating Feature Branches - Sections 6-9"

create_branch "feature/section-6-uiux-design" "develop"
create_branch "feature/section-7-legal-compliance" "develop"
create_branch "feature/section-8-long-term-roadmap" "develop"
create_branch "feature/section-9-brand-business" "develop"

################################################################################
# Step 8: Create Release Branches
################################################################################

print_header "Step 8: Creating Release Branches"

create_branch "release/phase-1-mvp" "develop"
create_branch "release/phase-2" "develop"
create_branch "release/phase-3" "develop"
create_branch "release/phase-4" "develop"

################################################################################
# Step 9: Create Hotfix Branch
################################################################################

print_header "Step 9: Creating Hotfix Branch"

create_branch "hotfix/emergency-fixes" "main"

################################################################################
# Step 10: Create Documentation Branch
################################################################################

print_header "Step 10: Creating Documentation Branch"

create_branch "docs/documentation" "develop"

################################################################################
# Final Summary and Verification
################################################################################

print_header "Branch Creation Complete!"

echo ""
success_msg "All branches have been created successfully!"
echo ""

info_msg "Displaying all branches:"
echo ""
git branch -a
echo ""

info_msg "To view the branch graph, run:"
echo -e "${YELLOW}git log --graph --oneline --all --decorate${NC}"
echo ""

info_msg "Quick verification - Branch count:"
branch_count=$(git branch | wc -l)
echo -e "${GREEN}Total branches created: $branch_count${NC}"
echo ""

# Create a visual branch tree
info_msg "Branch Structure:"
echo ""
echo "main"
echo "├── develop"
echo "│   ├── feature/section-1-vision-purpose"
echo "│   ├── feature/section-2-user-roles-permissions"
echo "│   ├── feature/section-3-core-features"
echo "│   │   ├── feature/section-3.1-sick-time-accrual"
echo "│   │   ├── feature/section-3.2-pto-request-system"
echo "│   │   ├── feature/section-3.3-multi-day-absence"
echo "│   │   ├── feature/section-3.4-compliance-ai-assistant"
echo "│   │   ├── feature/section-3.5-notice-submission"
echo "│   │   ├── feature/section-3.6-hours-import"
echo "│   │   ├── feature/section-3.7-offboarding-wizard"
echo "│   │   ├── feature/section-3.8-document-library"
echo "│   │   ├── feature/section-3.9-company-calendar"
echo "│   │   ├── feature/section-3.10-reporting-suite"
echo "│   │   ├── feature/section-3.11-hr-notes"
echo "│   │   └── feature/section-3.12-compliance-certificate"
echo "│   ├── feature/section-4-system-architecture"
echo "│   │   ├── feature/section-4.1-frontend"
echo "│   │   ├── feature/section-4.2-backend"
echo "│   │   ├── feature/section-4.3-data-model"
echo "│   │   └── feature/section-4.4-security-privacy"
echo "│   ├── feature/section-5-workflows"
echo "│   │   ├── feature/section-5.1-employer-setup-wizard"
echo "│   │   ├── feature/section-5.2-employee-flow"
echo "│   │   ├── feature/section-5.3-manager-flow"
echo "│   │   └── feature/section-5.4-weekly-automation"
echo "│   ├── feature/section-6-uiux-design"
echo "│   ├── feature/section-7-legal-compliance"
echo "│   ├── feature/section-8-long-term-roadmap"
echo "│   ├── feature/section-9-brand-business"
echo "│   ├── release/phase-1-mvp"
echo "│   ├── release/phase-2"
echo "│   ├── release/phase-3"
echo "│   ├── release/phase-4"
echo "│   └── docs/documentation"
echo "└── hotfix/emergency-fixes"
echo ""

success_msg "Branch hierarchy setup complete!"
info_msg "You can now start working on individual feature branches."
echo ""

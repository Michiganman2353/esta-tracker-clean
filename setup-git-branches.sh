#!/bin/bash

################################################################################
# Git Branch Tree Structure Setup Script
# 
# This script creates a complete, hierarchical Git branch structure for the
# ESTA Tracker project. It is idempotent and safe to run multiple times.
#
# Usage: ./setup-git-branches.sh
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

# Function to check if a branch exists
branch_exists() {
    local branch_name="$1"
    if git branch --list "$branch_name" | grep -q "^[* ]*$branch_name$"; then
        return 0
    else
        return 1
    fi
}

# Function to create a branch if it doesn't exist
create_branch_if_needed() {
    local branch_name="$1"
    local source_branch="${2:-HEAD}"
    
    if branch_exists "$branch_name"; then
        print_info "Branch '$branch_name' already exists, skipping"
        return 0
    fi
    
    print_info "Creating branch: $branch_name (from $source_branch)"
    
    # Store current branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    
    # Checkout source branch
    if [ "$source_branch" != "HEAD" ]; then
        git checkout "$source_branch" 2>/dev/null || {
            print_error "Failed to checkout source branch: $source_branch"
            return 1
        }
    fi
    
    # Create new branch
    git checkout -b "$branch_name" 2>/dev/null || {
        print_error "Failed to create branch: $branch_name"
        return 1
    }
    
    print_success "Created branch: $branch_name"
    
    # Return to original branch
    git checkout "$current_branch" 2>/dev/null || true
}

# Function to ensure we have at least one commit
ensure_initial_commit() {
    # Check if we have any commits
    if ! git rev-parse HEAD >/dev/null 2>&1; then
        print_warning "No commits found. Creating initial empty commit..."
        git commit --allow-empty -m "Initial commit for branch structure setup"
        print_success "Initial commit created"
    fi
}

################################################################################
# Main Script Execution
################################################################################

echo ""
echo "========================================================================"
echo "  ESTA Tracker - Git Branch Tree Structure Setup"
echo "========================================================================"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_warning "Not a git repository. Initializing..."
    git init
    print_success "Git repository initialized"
fi

# Ensure we have at least one commit to create branches from
ensure_initial_commit

# Ensure we're on a valid branch
current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [ -z "$current_branch" ] || [ "$current_branch" = "HEAD" ]; then
    git checkout -b main 2>/dev/null || git checkout main 2>/dev/null
    print_success "Switched to main branch"
fi

################################################################################
# Step 1: Create main branch
################################################################################

print_info "=== Step 1: Setting up main branch ==="

if ! branch_exists "main"; then
    # If we're not on main, create it
    if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
        git checkout -b main
        print_success "Created main branch"
    fi
else
    print_info "Main branch already exists"
fi

# Ensure we're on main
git checkout main
print_success "Main branch ready"

################################################################################
# Step 2: Create develop branch from main
################################################################################

print_info "=== Step 2: Setting up develop branch ==="

create_branch_if_needed "develop" "main"

################################################################################
# Step 3: Create feature branches from develop
################################################################################

print_info "=== Step 3: Creating feature branches ==="

# Section 1: Vision & Purpose
create_branch_if_needed "feature/section-1-vision-purpose" "develop"

# Section 2: User Roles & Permissions
create_branch_if_needed "feature/section-2-user-roles-permissions" "develop"

# Section 3: Core Features (Parent)
create_branch_if_needed "feature/section-3-core-features" "develop"

# Section 3 Sub-branches (from section-3-core-features)
print_info "Creating Section 3 sub-branches..."

create_branch_if_needed "feature/section-3.1-sick-time-accrual-engine" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.2-pto-request-system" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.3-multi-day-absence-documentation" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.4-compliance-ai-assistant" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.5-notice-submission-final-review" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.6-hours-import-options" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.7-offboarding-wizard" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.8-document-library" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.9-company-wide-calendar" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.10-advanced-reporting-suite" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.11-hr-notes-incident-logs" "feature/section-3-core-features"
create_branch_if_needed "feature/section-3.12-automated-compliance-certificate" "feature/section-3-core-features"

# Section 4: System Architecture (Parent)
create_branch_if_needed "feature/section-4-system-architecture" "develop"

# Section 4 Sub-branches (from section-4-system-architecture)
print_info "Creating Section 4 sub-branches..."

create_branch_if_needed "feature/section-4.1-frontend" "feature/section-4-system-architecture"
create_branch_if_needed "feature/section-4.2-backend" "feature/section-4-system-architecture"
create_branch_if_needed "feature/section-4.3-data-model" "feature/section-4-system-architecture"
create_branch_if_needed "feature/section-4.4-security-privacy" "feature/section-4-system-architecture"

# Section 5: Workflows (Parent)
create_branch_if_needed "feature/section-5-workflows" "develop"

# Section 5 Sub-branches (from section-5-workflows)
print_info "Creating Section 5 sub-branches..."

create_branch_if_needed "feature/section-5.1-employer-setup-wizard" "feature/section-5-workflows"
create_branch_if_needed "feature/section-5.2-employee-flow" "feature/section-5-workflows"
create_branch_if_needed "feature/section-5.3-manager-flow" "feature/section-5-workflows"
create_branch_if_needed "feature/section-5.4-weekly-automation" "feature/section-5-workflows"

# Section 6: UI/UX Design
create_branch_if_needed "feature/section-6-ui-ux-design" "develop"

# Section 7: Legal Compliance
create_branch_if_needed "feature/section-7-legal-compliance" "develop"

# Section 8: Long-term Roadmap
create_branch_if_needed "feature/section-8-long-term-roadmap" "develop"

# Section 9: Brand & Business Strategy
create_branch_if_needed "feature/section-9-brand-business-strategy" "develop"

################################################################################
# Step 4: Create release branches from develop
################################################################################

print_info "=== Step 4: Creating release branches ==="

create_branch_if_needed "release/phase-1-mvp" "develop"
create_branch_if_needed "release/phase-2" "develop"
create_branch_if_needed "release/phase-3" "develop"
create_branch_if_needed "release/phase-4" "develop"

################################################################################
# Step 5: Create hotfix branch structure from main
################################################################################

print_info "=== Step 5: Creating hotfix branch structure ==="

# Create a base hotfix branch to establish the structure
# Individual hotfix branches would be created as needed (e.g., hotfix/security-vuln)
# We'll create the namespace by creating an example branch that can be deleted later
create_branch_if_needed "hotfix/example-placeholder" "main"

################################################################################
# Step 6: Create docs branch structure from develop
################################################################################

print_info "=== Step 6: Creating docs branch structure ==="

# Create a base docs branch to establish the structure
# Individual docs branches would be created as needed (e.g., docs/readme-enhance)
create_branch_if_needed "docs/example-placeholder" "develop"

################################################################################
# Verification and Completion
################################################################################

print_info "=== Verification ==="

echo ""
print_success "Branch tree structure setup complete!"
echo ""

# Return to main branch
git checkout main 2>/dev/null

print_info "Final branch listing:"
echo ""
git branch -a
echo ""

print_info "Branch tree visualization:"
echo ""
echo "To visualize the branch tree structure, run:"
echo -e "${YELLOW}git log --graph --oneline --all --decorate${NC}"
echo ""

print_success "All branches created successfully!"
print_info "You can now start working on individual features."
echo ""
print_warning "Note: The placeholder branches (hotfix/example-placeholder and docs/example-placeholder)"
print_warning "were created to establish the namespace. You can delete them and create actual"
print_warning "hotfix and docs branches as needed using:"
echo "  git branch -d hotfix/example-placeholder"
echo "  git branch -d docs/example-placeholder"
echo ""

echo "========================================================================"
echo "  Setup Complete!"
echo "========================================================================"
echo ""

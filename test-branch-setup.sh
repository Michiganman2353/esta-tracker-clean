#!/bin/bash

################################################################################
# Test Script for setup-git-branches.sh
#
# This script validates that the branch setup script works correctly
################################################################################

set -e

echo "================================"
echo "Testing Git Branch Setup Script"
echo "================================"
echo ""

# Create a temporary test directory
TEST_DIR=$(mktemp -d)
echo "Created test directory: $TEST_DIR"

# Copy the script to test directory
cp setup-git-branches.sh "$TEST_DIR/"
cd "$TEST_DIR"

echo ""
echo "Test 1: Running script in a new git repository"
echo "----------------------------------------------"

# Initialize a git repository
git init
git config user.email "test@example.com"
git config user.name "Test User"

# Create an initial commit
git commit --allow-empty -m "Initial commit"

# Run the setup script
bash setup-git-branches.sh

echo ""
echo "Test 2: Verifying branch creation"
echo "----------------------------------"

# Check if main branch exists
if git branch --list main | grep -q main; then
    echo "✓ main branch exists"
else
    echo "✗ main branch missing"
    exit 1
fi

# Check if develop branch exists
if git branch --list develop | grep -q develop; then
    echo "✓ develop branch exists"
else
    echo "✗ develop branch missing"
    exit 1
fi

# Check a few feature branches
BRANCHES_TO_CHECK=(
    "feature/section-1-vision-purpose"
    "feature/section-3-core-features"
    "feature/section-3.1-sick-time-accrual-engine"
    "feature/section-4-system-architecture"
    "feature/section-4.1-frontend"
    "release/phase-1-mvp"
)

for branch in "${BRANCHES_TO_CHECK[@]}"; do
    if git branch --list "$branch" | grep -q "$branch"; then
        echo "✓ $branch exists"
    else
        echo "✗ $branch missing"
        exit 1
    fi
done

echo ""
echo "Test 3: Verifying idempotence (running script again)"
echo "-----------------------------------------------------"

# Run the script again
bash setup-git-branches.sh > /dev/null 2>&1

# Verify branches still exist
if git branch --list main | grep -q main; then
    echo "✓ Script is idempotent - branches still exist after second run"
else
    echo "✗ Script failed idempotence test"
    exit 1
fi

echo ""
echo "Test 4: Counting total branches created"
echo "----------------------------------------"

BRANCH_COUNT=$(git branch | wc -l)
echo "Total branches created: $BRANCH_COUNT"

# We expect at least 38 branches (excluding potential master from git init)
if [ "$BRANCH_COUNT" -ge 38 ]; then
    echo "✓ Expected number of branches created"
else
    echo "✗ Too few branches created (expected >= 38, got $BRANCH_COUNT)"
    exit 1
fi

echo ""
echo "================================"
echo "All tests passed! ✓"
echo "================================"
echo ""

# Cleanup
cd /
rm -rf "$TEST_DIR"
echo "Test directory cleaned up"

#!/bin/bash
# Deployment Validation Script for ESTA Tracker
# This script validates the environment before deployment to Vercel

set -e

echo "🔍 Validating deployment requirements..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
ERRORS=0

# Check if required directories exist
echo ""
echo "📁 Checking build output directories..."
if [ ! -d "apps/frontend/dist" ]; then
    echo -e "${RED}❌ Error: apps/frontend/dist directory not found${NC}"
    echo "   Please run 'npm run build' first"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Frontend build output found${NC}"
    # Check for critical files
    if [ ! -f "apps/frontend/dist/index.html" ]; then
        echo -e "${RED}❌ Error: index.html not found in dist${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✅ index.html found${NC}"
        
        # Validate index.html content to prevent blank screen issues
        if grep -q '<div id="root">' apps/frontend/dist/index.html && \
           grep -q '<script type="module"' apps/frontend/dist/index.html && \
           grep -q 'src="/assets/' apps/frontend/dist/index.html; then
            echo -e "${GREEN}✅ index.html contains root element and bundled assets${NC}"
        else
            echo -e "${RED}❌ Error: index.html appears to be missing required content${NC}"
            echo "   The build may have failed - check for script tags and root div"
            ERRORS=$((ERRORS + 1))
        fi
        
        # Check that the assets directory has files
        ASSET_COUNT=$(find apps/frontend/dist/assets -name "*.js" 2>/dev/null | wc -l)
        if [ "$ASSET_COUNT" -eq 0 ]; then
            echo -e "${RED}❌ Error: No JavaScript files found in assets directory${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${GREEN}✅ Found $ASSET_COUNT JavaScript bundles in assets${NC}"
        fi
    fi
fi

# Check for Node.js version
echo ""
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null | grep -oE '[0-9]+' | head -1)
if [ -z "$NODE_VERSION" ]; then
    echo -e "${RED}❌ Error: Could not determine Node.js version${NC}"
    ERRORS=$((ERRORS + 1))
elif [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Error: Node.js version must be 18 or higher (found: $(node -v))${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
fi

# Check if required environment variables are set (for GitHub Actions)
echo ""
echo "🔐 Checking environment variables..."
if [ -n "$GITHUB_ACTIONS" ]; then
    if [ -z "$VERCEL_TOKEN" ] && [ -z "$INPUT_VERCEL_TOKEN" ]; then
        echo -e "${YELLOW}⚠️  Warning: VERCEL_TOKEN not found (this is expected in local environment)${NC}"
    else
        echo -e "${GREEN}✅ VERCEL_TOKEN is set${NC}"
    fi
    
    if [ -z "$VERCEL_ORG_ID" ]; then
        echo -e "${YELLOW}⚠️  Warning: VERCEL_ORG_ID not set${NC}"
    else
        echo -e "${GREEN}✅ VERCEL_ORG_ID is set${NC}"
    fi
    
    if [ -z "$VERCEL_PROJECT_ID" ]; then
        echo -e "${YELLOW}⚠️  Warning: VERCEL_PROJECT_ID not set${NC}"
    else
        echo -e "${GREEN}✅ VERCEL_PROJECT_ID is set${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Not running in GitHub Actions, skipping secret validation${NC}"
fi

# Check package.json exists
echo ""
echo "📄 Checking configuration files..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ package.json found${NC}"
fi

if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Error: vercel.json not found${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ vercel.json found${NC}"
fi

# Validate vercel.json structure
if command -v jq &> /dev/null; then
    echo ""
    echo "🔧 Validating vercel.json structure..."
    
    OUTPUT_DIR=$(jq -r '.outputDirectory' vercel.json 2>/dev/null)
    if [ "$OUTPUT_DIR" != "apps/frontend/dist" ]; then
        echo -e "${YELLOW}⚠️  Warning: outputDirectory in vercel.json might be incorrect${NC}"
        echo "   Expected: apps/frontend/dist, Found: $OUTPUT_DIR"
    else
        echo -e "${GREEN}✅ outputDirectory correctly configured${NC}"
    fi
else
    echo ""
    echo -e "${YELLOW}ℹ️  Note: jq not installed, skipping vercel.json JSON validation${NC}"
    echo "   Install jq for complete validation: sudo apt-get install jq"
fi

# Check if api directory exists
if [ -d "api" ]; then
    echo -e "${GREEN}✅ API directory found${NC}"
    
    # Check for TypeScript files in api
    TS_FILES=$(find api -name "*.ts" | wc -l)
    if [ "$TS_FILES" -gt 0 ]; then
        echo -e "${GREEN}✅ Found $TS_FILES TypeScript API files${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Warning: api directory not found${NC}"
fi

# Summary
echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo "   Ready for deployment"
    exit 0
else
    echo -e "${RED}❌ Validation failed with $ERRORS error(s)${NC}"
    echo "   Please fix the errors before deploying"
    exit 1
fi

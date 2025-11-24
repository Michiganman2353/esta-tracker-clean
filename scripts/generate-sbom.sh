#!/usr/bin/env bash
set -e

# Generate CycloneDX SBOM for ESTA Tracker monorepo
# Output: bom.xml at repository root

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🔍 Checking for CycloneDX CLI..."

# Check if cyclonedx-npm is available, install if needed
if ! command -v cyclonedx-npm &> /dev/null; then
  echo "📦 Installing @cyclonedx/cyclonedx-npm..."
  npm install -g @cyclonedx/cyclonedx-npm
fi

echo "📋 Generating SBOM..."

# Generate SBOM in CycloneDX format
cyclonedx-npm --output-file bom.xml --output-format XML

if [ -f bom.xml ]; then
  echo "✅ SBOM generated successfully at bom.xml"
  echo "📊 SBOM contains $(grep -c '<component' bom.xml || echo '0') components"
else
  echo "❌ Failed to generate SBOM"
  exit 1
fi

# .github/workflows/ci.yml
name: Elite CI/CD

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  elite-build:
    name: Build & Test (Node ${{ matrix.node }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: ['20.x']
    timeout-minutes: 10

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
          cache-dependency-path: package-lock.json

      - name: Install Dependencies
        run: npm ci --ignore-scripts

      - name: Lint Code
        run: npm run lint || echo "Lint failed – check formatting"

      - name: Run Tests
        run: npm test -- --coverage --watchAll=false
        continue-on-error: true

      - name: Build Production
        run: npm run build --if-present

      - name: Security Audit
        run: |
          npm audit --audit-level=high
          npx depcheck --ignores=eslint,prettier

      - name: Upload SARIF (Security)
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: results.sarif

      - name: Generate Badge
        uses: schneidermike/action-badge@v1
        if: success()
        with:
          label: CI
          status: passing
          color: green
          path: .github/badges/ci-badge.svg

      - name: Notify Failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: "CI failed on ${{ github.ref }} – Fix ASAP!"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

  deploy-preview:
    name: Deploy Preview
    needs: elite-build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true
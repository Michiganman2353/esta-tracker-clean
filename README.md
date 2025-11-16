# ESTA Tracker - Michigan Earned Sick Time Act Compliance System

A modern, full-stack TypeScript monorepo application for managing Michigan's Earned Sick Time Act (ESTA) compliance. Built with Vite + React 18 (frontend) and Node.js + Express (backend), with PostgreSQL-ready database architecture.

## 🎯 Features

### Michigan ESTA Compliance
- ✅ **Small Employer Rules** (<10 employees): 40 hours sick time per year, max 40 paid + 32 unpaid hours usage, carryover cap 40 hours
- ✅ **Large Employer Rules** (≥10 employees): 1 hour accrual per 30 hours worked, max 72 paid hours per year, carryover cap 72 hours
- ✅ **Year-to-year carryover** with compliance caps
- ✅ **Usage categories** per Michigan law (illness, medical, preventive care, family care, domestic violence, sexual assault, stalking)
- ✅ **Anti-retaliation protections** with audit trail
- ✅ **3-year compliance audit trail** for state inspections

### Technical Features
- 🏗️ Modern Monorepo Architecture (npm workspaces)
- ⚡ Vite for lightning-fast development
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 🔒 Type-safe end-to-end with TypeScript
- 🧪 Vitest for testing
- 🐘 PostgreSQL-ready data layer

## 🚀 Quick Start

### Prerequisites
- Node.js ≥18.0.0
- npm ≥9.0.0

### Installation

```bash
git clone https://github.com/Michiganman2353/esta-tracker-clean.git
cd esta-tracker-clean
npm install
cp .env.example .env
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

## 📋 Available Scripts

```bash
npm run dev              # Start both frontend and backend
npm run build            # Build all packages
npm run test             # Run tests in all packages
npm run lint             # Lint all packages
```

## 📄 License

MIT License

---

**Built for Michigan ESTA compliance**

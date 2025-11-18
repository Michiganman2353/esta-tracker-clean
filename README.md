# <span style="color:#007BFF;">ESTA Tracker - Master Plan v2 🚀</span>

**<span style="color:#28A745;">"ESTA Tracker: The HR Power Small Businesses Deserve – Without the Department."</span>**

**<span style="color:#FFC107;">Empower Your Business: Automate Compliance!</span>**  
A Complete Strategic, Technical, and Operational Blueprint  
Prepared for Production & Scaffolding Phase

## <span style="color:#6F42C1;">Table of Contents</span>
- [Section 1: Vision & Purpose](#section-1-vision--purpose) 💡
- [Section 2: User Roles & Permissions](#section-2-user-roles--permissions) 🔒
- [Section 3: Core Features (Powerhouse Set)](#section-3-core-features-powerhouse-set) ⚡
- [Section 4: System Architecture](#section-4-system-architecture) 🛠️
- [Section 5: Workflows](#section-5-workflows) 🔄
- [Section 6: UI/UX Design Requirements](#section-6-uiux-design-requirements) 🎨
- [Section 7: Legal Compliance](#section-7-legal-compliance) ⚖️
- [Section 8: Long Term Roadmap](#section-8-long-term-roadmap) 🗺️
- [Section 9: Brand & Business Strategy](#section-9-brand--business-strategy) 📈

## <span style="color:#007BFF;">SECTION 1: VISION & PURPOSE 💡</span>

**<span style="color:#28A745;">Ignite Growth: Turn Compliance into a Competitive Edge!</span>**  

ESTA Tracker is a full stack SaaS platform designed to automate compliance with the Michigan Earned Sick Time Act (2025). It empowers small and medium sized businesses - especially those with no HR department - to remain compliant, track employee accruals, manage PTO requests, automate documentation, and reduce legal risk.

The platform acts as a turnkey HR compliance engine: tracking hours, generating audit logs, notifying administrators of issues, integrating with payroll, and maintaining full legal adherence.

**<span style="color:#FFC107;">Long term vision:</span>**  
- **<span style="color:#DC3545;">Become the national standard tool</span>** for state specific HR compliance.  
- **<span style="color:#DC3545;">Expand to other states</span>** as laws evolve.  
- **<span style="color:#DC3545;">Integrate deeply</span>** with major payroll providers.  
- **<span style="color:#DC3545;">Provide AI powered HR assistance</span>** for small businesses.

## <span style="color:#007BFF;">SECTION 2: USER ROLES & PERMISSIONS 🔒</span>

**<span style="color:#28A745;">Secure Access: Empower Teams Without Compromising Control!</span>**  

**<span style="color:#FFC107;">ROLES:</span>**  
1. **<span style="color:#6F42C1;">Employer Owner</span>** - full control of company, employees, billing, HR settings.  
2. **<span style="color:#6F42C1;">Admin / Manager</span>** - delegated control (approvals, editing hours, team access).  
3. **<span style="color:#6F42C1;">Employee</span>** - can view balances, request paid leave, upload documents.  
4. **<span style="color:#6F42C1;">Auditor (optional)</span>** - restricted, read-only access.

**<span style="color:#FFC107;">PERMISSION HIGHLIGHTS:</span>**  
- **<span style="color:#DC3545;">Data isolation</span>** between tenants.  
- **<span style="color:#DC3545;">Manager level restricted views</span>** (department based).  
- **<span style="color:#DC3545;">Every edit generates</span>** a time stamped audit record.  
- **<span style="color:#DC3545;">Critical edits require</span>** confirmation prompts and notifications.

## <span style="color:#007BFF;">SECTION 3: CORE FEATURES (POWERHOUSE SET) ⚡</span>

**<span style="color:#28A745;">Unleash Efficiency: The Ultimate Toolkit for HR Mastery!</span>**  

**<span style="color:#FFC107;">3.1 Sick Time Accrual Engine</span>**  
- 1 hour per 30 hours worked (Michigan ESTA default).  
- Annual Cap: 72 hours for employers with >50 employees.  
- Annual Cap: 40 hours for small employers (less than 50 employees).  
- Rule versioning for legal updates.  
- Accrual simulation tool for forecasting.

**<span style="color:#FFC107;">3.2 PTO Request System</span>**  
- Employee submits request with:  
  - Date range  
  - ESTA approved reason (dropdown)  
  - Optional doctor s note/photo upload  
- Manager approval workflow.  
- Auto deduction from available balance.  
- Notifications (in app + email + push).

**<span style="color:#FFC107;">3.3 Multi Day Absence Documentation</span>**  
- Photo upload (doctor s notes, medical documents).  
- Stored securely under employee profile.  
- Manager only visibility.

**<span style="color:#FFC107;">3.4 Compliance AI Assistant</span>**  
- Reviews employer settings.  
- Flags possible compliance risks.  
- Interprets ESTA rules.  
- Auto suggests corrections.

**<span style="color:#FFC107;">3.5 Notice Submission & Final Review System</span>**  
- Owner/Admin submits changes or hours.  
- System validates data, checks for errors.  
- Employer receives a final approval prompt.  
- Logs stored for audit protection.

**<span style="color:#FFC107;">3.6 Hours Import Options</span>**  
- Manual entry with validation.  
- CSV upload (bulk import).  
- QuickBooks Time integration (API).  
- Homebase integration (API).  
- Universal payroll API pipeline (expandable).

**<span style="color:#FFC107;">3.7 Offboarding Wizard</span>**  
- Generates final accrual summary.  
- Notes that employers do not need to PAY out ESTA for 120 days.  
- Offers record export for legal compliance.  
- Handles front loaded policy differences.

**<span style="color:#FFC107;">3.8 Document Library</span>**  
- ESTA poster (required by law).  
- Sick leave policy templates.  
- Employee handbook inserts.  
- Compliance checklists.

**<span style="color:#FFC107;">3.9 Company Wide Calendar System</span>**  
- Day / week / month views.  
- Employee availability.  
- Heatmap showing staffing shortages.  
- PTO conflicts and overlaps.

**<span style="color:#FFC107;">3.10 Advanced Reporting Suite</span>**  
- Usage reports.  
- Accrual changes over time.  
- Compliance audit trail.  
- Department level analytics.  
- Export to CSV / PDF / Excel.

**<span style="color:#FFC107;">3.11 HR Notes & Incident Logs</span>**  
- Private employer-only notes.  
- Time-stamped entries.  
- Attachments allowed.  
- AI summary of employee history (optional future phase).

**<span style="color:#FFC107;">3.12 Automated Compliance Certificate</span>**  
- Year end certificate proving ESTA compliance.  
- Helps during audits or insurance reviews.

## <span style="color:#007BFF;">SECTION 4: SYSTEM ARCHITECTURE 🛠️</span>

**<span style="color:#28A745;">Rock-Solid Foundation: Built for Scale, Speed, and Security!</span>**  

**<span style="color:#FFC107;">4.1 Repository Structure</span>**  
The project follows Vercel best practices with a clean, scalable structure:

```
esta-tracker-clean/
├── public/                    # Static assets (served by Vercel)
│   ├── favicon.ico
│   ├── manifest.json
│   └── vite.svg
├── lib/                       # Shared business logic
│   ├── firebase/              # Firebase initialization
│   ├── auth/                  # Authentication service
│   ├── api/                   # API client
│   ├── accrual/               # ESTA accrual calculations
│   └── documents/             # Document upload service
├── types/                     # Shared TypeScript types
│   └── index.ts
├── packages/
│   ├── frontend/              # React application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── contexts/
│   │   │   └── lib/          # Re-exports from root /lib
│   │   └── vite.config.ts
│   └── backend/               # Backend services
├── functions/                 # Firebase Cloud Functions
├── .env.development           # Development environment template
├── .env.production            # Production environment template
├── .env.preview               # Preview environment template
└── vercel.json                # Vercel deployment config
```

**Key Benefits:**
- Root-level `/public` for Vercel static asset optimization
- Shared `/lib` for reusable business logic across frontend/backend
- Centralized `/types` for type safety
- Environment templates for all deployment stages
- Clean separation of concerns

**<span style="color:#FFC107;">4.2 Frontend</span>**  
- React + Vite (Vercel deployment)  
- Component architecture:  
  - Dashboard  
  - Employee List  
  - Calendar  
  - PTO Manager  
  - Reports  
  - Employee Self-Service Portal  
- UI goals: simple, clean, employer friendly.

**<span style="color:#FFC107;">4.3 Backend</span>**  
- Firebase Auth  
- Firestore database  
- Firebase Functions  
- Firebase Storage (documents + uploads)

**<span style="color:#FFC107;">4.4 Data Model (Simplified)</span>**  
```json
TENANTS collection:  
- companyName  
- tier  
- employeeCount  
- complianceSettings  
- createdAt  

EMPLOYEES subcollection:  
- name  
- hireDate  
- accruedHours  
- usedHours  
- department  
- employmentStatus  

PTO_REQUESTS subcollection:  
- employeeId  
- dates  
- reason  
- status  
- approvalLog  
- attachments  

ACCRUAL_LOG:  
- timestamp  
- hoursAdded  
- ruleVersion  

HOUR_IMPORT_LOG:  
- method used (CSV / API / manual)  
- processed records  
- validation results

<span style="color:#FFC107;">4.5 Security & Privacy</span>
•  <span style="color:#DC3545;">Role based Firestore rules.</span>
•  <span style="color:#DC3545;">End to end encryption.</span>
•  <span style="color:#DC3545;">Audit locked logs.</span>
•  <span style="color:#DC3545;">Immutable history of changes.</span>
<span style="color:#007BFF;">SECTION 5: WORKFLOWS 🔄</span>
<span style="color:#28A745;">Streamlined Processes: From Setup to Automation in Minutes!</span>
<span style="color:#FFC107;">5.1 Employer Setup Wizard</span>
1.  Enter company details.
2.  Select size (auto sets accrual rules).
3.  Install/enable integrations.
4.  Upload employees via CSV or manual.
5.  Review compliance settings.
6.  Confirmation + certificate of setup.
<span style="color:#FFC107;">5.2 Employee Flow</span>
•  Login → Dashboard → Request Time Off → Upload note → Track status.
<span style="color:#FFC107;">5.3 Manager Flow</span>
•  Review requests → Approve/deny → Edit hours → Confirm changes.
<span style="color:#FFC107;">5.4 Weekly Automation</span>
•  Audit for errors.
•  Notify employers of missing hours.
•  Generate compliance reminders.
<span style="color:#007BFF;">SECTION 6: UI/UX DESIGN REQUIREMENTS 🎨</span>
<span style="color:#28A745;">Intuitive Interface: Delight Users, Boost Productivity!</span>
<span style="color:#FFC107;">Required Screens:</span>
•  Login
•  Company Setup Wizard
•  Employer Dashboard
•  Employee Dashboard
•  Calendar View (day/week/month)
•  Employee Directory
•  PTO Requests Manager
•  Reports
•  Document Library
•  Compliance Center
•  Profile Settings
•  Notification Center
<span style="color:#FFC107;">General UX Goals:</span>
•  <span style="color:#DC3545;">Minimum clicks</span> to perform core actions.
•  <span style="color:#DC3545;">Everything accessible</span> within 3 layers at most.
•  <span style="color:#DC3545;">Mobile optimized</span> for employees.
<span style="color:#007BFF;">SECTION 7: LEGAL COMPLIANCE ⚖️</span>
<span style="color:#28A745;">Bulletproof Protection: Stay Ahead of Regulations Effortlessly!</span>
This platform must satisfy:
•  <span style="color:#6F42C1;">Michigan Earned Sick Time Act (2025)</span>
•  <span style="color:#6F42C1;">Required employer postings</span>
•  <span style="color:#6F42C1;">Record keeping requirements</span>
•  <span style="color:#6F42C1;">Document protection for sensitive leave</span>
•  <span style="color:#6F42C1;">3 year history retention</span>
•  <span style="color:#6F42C1;">Immutable audit trails</span>
•  <span style="color:#6F42C1;">Optional evidence/documentation uploads</span>
<span style="color:#FFC107;">Front Loading Consideration:</span>
•  System supports:
	•  <span style="color:#DC3545;">Accrual model (default)</span>
	•  <span style="color:#DC3545;">Front load model (40 or 72 hours)</span>
•  Auto adjusts based on employer size.
•  Still benefits front load employers through:
	•  <span style="color:#DC3545;">PTO request workflow</span>
	•  <span style="color:#DC3545;">Document storage</span>
	•  <span style="color:#DC3545;">Compliance tracking</span>
	•  <span style="color:#DC3545;">Audit-ready logs</span>
<span style="color:#007BFF;">SECTION 8: LONG TERM ROADMAP 🗺️</span>
<span style="color:#28A745;">Future-Proof Vision: From MVP to National Dominance!</span>
<span style="color:#FFC107;">PHASE 1 (MVP 1.0):</span>
•  Employer onboarding
•  Accrual engine
•  PTO workflow
•  CSV import
•  Calendar basic version
•  Reporting v1
<span style="color:#FFC107;">PHASE 2:</span>
•  Payroll integrations (QuickBooks Time, Homebase)
•  Mobile app (employee access)
•  Advanced reporting
•  Compliance AI engine
•  Document library
<span style="color:#FFC107;">PHASE 3:</span>
•  Multi state expansion
•  White label offerings
•  Full HR suite (performance, scheduling, onboarding)
<span style="color:#FFC107;">PHASE 4:</span>
•  National HR compliance engine
•  Enterprise partnerships
<span style="color:#007BFF;">SECTION 9: BRAND & BUSINESS STRATEGY 📈</span>
<span style="color:#28A745;">Build an Empire: Monetize Smart, Brand Bold!</span>
<span style="color:#FFC107;">Core Identity:</span>
ESTA Tracker the HR department small businesses don’t have.
<span style="color:#FFC107;">Monetization:</span>
•  Base subscription
•  Tiered per employee pricing
•  Add ons:
	•  Advanced reports
	•  Payroll integrations
	•  White labeling
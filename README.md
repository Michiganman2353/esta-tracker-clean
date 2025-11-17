# ESTA Tracker - Master Plan v2 🚀

**"ESTA Tracker: The HR Power Small Businesses Deserve – Without the Department."**

**Empower Your Business: Automate Compliance, Slash Risks, and Scale Nationally!**  
A Complete Strategic, Technical, and Operational Blueprint  
Prepared for Production & Scaffolding Phase

![Our Dynamic Logo: Symbolizing Checked Compliance and Timely Tracking!](https://cdn.x.ai/attachments/7a6f7761f59a4f5fb9d1d5a4d3b1d5e2/1.png)

## Table of Contents
- [Section 1: Vision & Purpose](#section-1-vision--purpose) 💡
- [Section 2: User Roles & Permissions](#section-2-user-roles--permissions) 🔒
- [Section 3: Core Features (Powerhouse Set)](#section-3-core-features-powerhouse-set) ⚡
- [Section 4: System Architecture](#section-4-system-architecture) 🛠️
- [Section 5: Workflows](#section-5-workflows) 🔄
- [Section 6: UI/UX Design Requirements](#section-6-uiux-design-requirements) 🎨
- [Section 7: Legal Compliance](#section-7-legal-compliance) ⚖️
- [Section 8: Long Term Roadmap](#section-8-long-term-roadmap) 🗺️
- [Section 9: Brand & Business Strategy](#section-9-brand--business-strategy) 📈

## SECTION 1: VISION & PURPOSE 💡

![Visualizing HR Automation: Streamlining Compliance for Small Businesses](https://cdn.x.ai/attachments/7a6f7761f59a4f5fb9d1d5a4d3b1d5e2/0.png)

**Ignite Growth: Turn Compliance into a Competitive Edge!**  

ESTA Tracker is a full stack SaaS platform designed to automate compliance with the Michigan Earned Sick Time Act (2025). It empowers small and medium sized businesses - especially those with no HR department - to remain compliant, track employee accruals, manage PTO requests, automate documentation, and reduce legal risk.

The platform acts as a turnkey HR compliance engine: tracking hours, generating audit logs, notifying administrators of issues, integrating with payroll, and maintaining full legal adherence.

**Long term vision:**  
- **Become the national standard tool** for state specific HR compliance.  
- **Expand to other states** as laws evolve.  
- **Integrate deeply** with major payroll providers.  
- **Provide AI powered HR assistance** for small businesses.

## SECTION 2: USER ROLES & PERMISSIONS 🔒

![User Roles in Action: Secure and Structured Access Control](https://cdn.x.ai/attachments/7a6f7761f59a4f5fb9d1d5a4d3b1d5e2/2.png)

**Secure Access: Empower Teams Without Compromising Control!**  

**ROLES:**  
1. **Employer Owner** - full control of company, employees, billing, HR settings.  
2. **Admin / Manager** - delegated control (approvals, editing hours, team access).  
3. **Employee** - can view balances, request paid leave, upload documents.  
4. **Auditor (optional)** - restricted, read-only access.

**PERMISSION HIGHLIGHTS:**  
- **Data isolation** between tenants.  
- **Manager level restricted views** (department based).  
- **Every edit generates** a time stamped audit record.  
- **Critical edits require** confirmation prompts and notifications.

## SECTION 3: CORE FEATURES (POWERHOUSE SET) ⚡

![Core Features Spotlight: PTO and Accrual Management in View](https://cdn.x.ai/attachments/7a6f7761f59a4f5fb9d1d5a4d3b1d5e2/3.png)

**Unleash Efficiency: The Ultimate Toolkit for HR Mastery!**  

**3.1 Sick Time Accrual Engine**  
- 1 hour per 30 hours worked (Michigan ESTA default).  
- Cap: 72 hours for employers with >50 employees.  
- Cap: 40 hours for small employers (less than 50 employees).  
- Rule versioning for legal updates.  
- Accrual simulation tool for forecasting.

**3.2 PTO Request System**  
- Employee submits request with:  
  - Date range  
  - ESTA approved reason (dropdown)  
  - Optional doctor s note/photo upload  
- Manager approval workflow.  
- Auto deduction from available balance.  
- Notifications (in app + email + push).

**3.3 Multi Day Absence Documentation**  
- Photo upload (doctor s notes, medical documents).  
- Stored securely under employee profile.  
- Manager only visibility.

**3.4 Compliance AI Assistant**  
- Reviews employer settings.  
- Flags possible compliance risks.  
- Interprets ESTA rules.  
- Auto suggests corrections.

**3.5 Notice Submission & Final Review System**  
- Owner/Admin submits changes or hours.  
- System validates data, checks for errors.  
- Employer receives a final approval prompt.  
- Logs stored for audit protection.

**3.6 Hours Import Options**  
- Manual entry with validation.  
- CSV upload (bulk import).  
- QuickBooks Time integration (API).  
- Homebase integration (API).  
- Universal payroll API pipeline (expandable).

**3.7 Offboarding Wizard**  
- Generates final accrual summary.  
- Notes that employers do not need to PAY out ESTA for 120 days.  
- Offers record export for legal compliance.  
- Handles front loaded policy differences.

**3.8 Document Library**  
- ESTA poster (required by law).  
- Sick leave policy templates.  
- Employee handbook inserts.  
- Compliance checklists.

**3.9 Company Wide Calendar System**  
- Day / week / month views.  
- Employee availability.  
- Heatmap showing staffing shortages.  
- PTO conflicts and overlaps.

**3.10 Advanced Reporting Suite**  
- Usage reports.  
- Accrual changes over time.  
- Compliance audit trail.  
- Department level analytics.  
- Export to CSV / PDF / Excel.

**3.11 HR Notes & Incident Logs**  
- Private employer-only notes.  
- Time-stamped entries.  
- Attachments allowed.  
- AI summary of employee history (optional future phase).

**3.12 Automated Compliance Certificate**  
- Year end certificate proving ESTA compliance.  
- Helps during audits or insurance reviews.

## SECTION 4: SYSTEM ARCHITECTURE 🛠️

![Architecture Blueprint: Robust SaaS Infrastructure Overview](https://cdn.x.ai/attachments/7a6f7761f59a4f5fb9d1d5a4d3b1d5e2/4.png)

**Rock-Solid Foundation: Built for Scale, Speed, and Security!**  

**4.1 Frontend**  
- React + Next.js (Vercel deployment)  
- Component architecture:  
  - Dashboard  
  - Employee List  
  - Calendar  
  - PTO Manager  
  - Reports  
  - Employee Self-Service Portal  
- UI goals: simple, clean, employer friendly.

**4.2 Backend**  
- Firebase Auth  
- Firestore database  
- Firebase Functions  
- Firebase Storage (documents + uploads)

**4.3 Data Model (Simplified)**  
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

4.4 Security & Privacy
•  Role based Firestore rules.
•  End to end encryption.
•  Audit locked logs.
•  Immutable history of changes.
SECTION 5: WORKFLOWS 🔄
[Image]
Streamlined Processes: From Setup to Automation in Minutes!
5.1 Employer Setup Wizard
1.  Enter company details.
2.  Select size (auto sets accrual rules).
3.  Install/enable integrations.
4.  Upload employees via CSV or manual.
5.  Review compliance settings.
6.  Confirmation + certificate of setup.
5.2 Employee Flow
•  Login → Dashboard → Request Time Off → Upload note → Track status.
5.3 Manager Flow
•  Review requests → Approve/deny → Edit hours → Confirm changes.
5.4 Weekly Automation
•  Audit for errors.
•  Notify employers of missing hours.
•  Generate compliance reminders.
SECTION 6: UI/UX DESIGN REQUIREMENTS 🎨
[Image]
Intuitive Interface: Delight Users, Boost Productivity!
Required Screens:
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
General UX Goals:
•  Minimum clicks to perform core actions.
•  Everything accessible within 3 layers at most.
•  Mobile optimized for employees.
SECTION 7: LEGAL COMPLIANCE ⚖️
[Image]
Bulletproof Protection: Stay Ahead of Regulations Effortlessly!
This platform must satisfy:
•  Michigan Earned Sick Time Act (2025)
•  Required employer postings
•  Record keeping requirements
•  Document protection for sensitive leave
•  3 year history retention
•  Immutable audit trails
•  Optional evidence/documentation uploads
Front Loading Consideration:
•  System supports:
	•  Accrual model (default)
	•  Front load model (40 or 72 hours)
•  Auto adjusts based on employer size.
•  Still benefits front load employers through:
	•  PTO request workflow
	•  Document storage
	•  Compliance tracking
	•  Audit-ready logs
SECTION 8: LONG TERM ROADMAP 🗺️
[Image]
Future-Proof Vision: From MVP to National Dominance!
PHASE 1 (MVP 1.0):
•  Employer onboarding
•  Accrual engine
•  PTO workflow
•  CSV import
•  Calendar basic version
•  Reporting v1
PHASE 2:
•  Payroll integrations (QuickBooks Time, Homebase)
•  Mobile app (employee access)
•  Advanced reporting
•  Compliance AI engine
•  Document library
PHASE 3:
•  Multi state expansion
•  White label offerings
•  Full HR suite (performance, scheduling, onboarding)
PHASE 4:
•  National HR compliance engine
•  Enterprise partnerships
SECTION 9: BRAND & BUSINESS STRATEGY 📈
[Image]
Build an Empire: Monetize Smart, Brand Bold!
Core Identity:
ESTA Tracker the HR department small businesses don’t have.
Monetization:
•  Base subscription
•  Tiered per employee pricing
•  Add ons:
	•  Advanced reports
	•  Payroll integrations
	•  White labeling
Legal Setup:
•  Form LLC
•  Copyright software
•  Trademark name + logo
•  Draft ToS + privacy policy
•  Secure insurance coverage
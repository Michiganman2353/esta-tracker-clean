# Employer Profile Architecture

## Overview

The Employer Profile system provides a centralized architecture for managing employer accounts and linking employees using unique 4-digit codes. This document describes the data model, workflows, and operational procedures.

## Data Model

### Employer Profile Collection

**Collection:** `employerProfiles/{employerUid}`

Each employer has a single authoritative profile document:

```typescript
{
  id: string;              // Employer user ID (Firebase Auth UID)
  employerCode: string;    // Unique 4-digit code (1000-9999)
  displayName: string;     // Company name for white-label branding
  logoUrl?: string;        // Optional logo URL for branding
  brandColor?: string;     // Optional brand color (hex format)
  size: 'small' | 'large'; // Based on employee count (<10 = small, >=10 = large)
  employeeCount: number;   // Total employee count
  contactEmail: string;    // Primary contact email
  contactPhone?: string;   // Optional phone number
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### Employee Subcollection

**Collection:** `employerProfiles/{employerUid}/employees/{employeeUid}`

Each employee linked to an employer has a record:

```typescript
{
  uid: string;             // Employee user ID
  email: string;           // Employee email
  displayName: string;     // Employee name
  joinDate: Date;          // Date employee linked to employer
  role: 'employee' | 'manager'; // Employee role
  status: 'active' | 'inactive'; // Employment status
}
```

### User Document Updates

The `users/{uid}` collection now includes:

- `employerId`: References the employer profile ID
- For employers: `employerId` is a self-reference (their own UID)
- For employees: `employerId` points to their employer's UID

## Employer Code Lifecycle

### Generation

1. **Format:** 4-digit numeric code (1000-9999)
2. **Uniqueness:** Guaranteed via collision detection
3. **Timing:** Generated during employer registration
4. **Total Capacity:** 9,000 unique codes

### Code Generation Algorithm

```typescript
// Generate random code
const code = Math.floor(Math.random() * 9000) + 1000;

// Check uniqueness in Firestore
const existing = await getEmployerProfileByCode(db, code);
if (existing) {
  // Retry with new code (up to 10 attempts)
}
```

### Code Regeneration

Employers can regenerate their code through a protected action:

**Requirements:**
- Must be authenticated as the employer
- Must explicitly request regeneration
- Old code becomes immediately invalid

**Process:**
1. Generate new unique 4-digit code
2. Update employer profile with new code
3. Notify all linked employees (recommended)
4. Update any printed materials referencing old code

**API Endpoint:**
```typescript
regenerateEmployerCode(db, employerId);
```

**Impact:**
- Employees using old code will fail to register
- Existing employees remain linked (no change to their records)
- Employer should communicate new code to future employees

## Employee Linking Workflow

### Registration Flow (No UI Changes)

1. **Employee enters 4-digit employer code** during existing registration
2. **Validation step inserted** before account creation:
   ```typescript
   const profile = await getEmployerProfileByCode(db, code);
   if (!profile) {
     throw new Error('Invalid employer code');
   }
   ```
3. **On success:**
   - Create Firebase Auth user
   - Create `users/{uid}` document with `employerId`
   - Create employee record in `employerProfiles/{employerId}/employees/{uid}`
   - Maintain backward compatibility with `tenants` collection

4. **Error Handling:**
   - Invalid code: "Invalid employer code. Please check with your employer and try again."
   - Network errors: Standard retry with exponential backoff
   - Display clear error message in existing UI

### Linking API

```typescript
await linkEmployeeToEmployer(db, employeeUid, employerId, {
  email: 'employee@example.com',
  displayName: 'John Doe',
  role: 'employee'
});
```

This function:
- Updates `users/{employeeUid}.employerId`
- Creates `employerProfiles/{employerId}/employees/{employeeUid}`
- Uses transaction to ensure atomicity

## White-Label Branding

### Branding Fields

Employers can customize their profile with:

1. **Display Name:** Company name shown to employees
2. **Logo URL:** Uploaded to Firebase Storage, URL stored in profile
3. **Brand Color:** Hex color code for UI theming

### Setting Branding

**During Registration:**
- Display name set from company name input
- Logo and color optional

**After Registration:**
- Employer settings page allows updates
- Changes immediately reflected for all employees

### Frontend Integration

```typescript
// Fetch employer profile for branding
const profile = await getEmployerProfileById(db, user.employerId);

// Apply branding
document.title = profile.displayName;
if (profile.logoUrl) {
  // Display logo
}
if (profile.brandColor) {
  // Apply theme color
}
```

## Security & Access Control

### Firestore Rules

```
// Employers can create/read/update their own profile
match /employerProfiles/{employerId} {
  allow create: if request.auth.uid == employerId;
  allow read, update: if request.auth.uid == employerId;
  allow read: if belongsToEmployer(employerId); // Employees can read
}

// Employee records
match /employerProfiles/{employerId}/employees/{employeeUid} {
  allow read: if request.auth.uid == employerId || request.auth.uid == employeeUid;
  allow create, update: if request.auth.uid == employerId;
}
```

### Access Patterns

**Employers can:**
- Read/write their own profile
- Read/write all employee records under their profile
- Regenerate their employer code

**Employees can:**
- Read their employer's profile (for branding)
- Read their own employee record
- Cannot modify employer profile or other employees

**No one can:**
- Delete employer profiles
- Delete employee records
- Access other employers' data

## Backwards Compatibility

### Dual System Support

The implementation maintains compatibility with the legacy `tenants` collection:

1. **Employer Registration:**
   - Creates `employerProfiles/{uid}` with 4-digit code
   - Creates `tenants/{tenantId}` with legacy 8-character code
   - Links tenant to employer profile via `employerProfileId` field

2. **Employee Registration:**
   - First checks for 4-digit employer code (new system)
   - Falls back to 8-character tenant code (legacy system)
   - Works with both code formats

### Migration Path

No immediate migration required. System supports:
- New employers → use 4-digit codes
- Legacy employers → continue using 8-character codes
- Gradual migration as employers re-register or request new codes

### Future Migration Script

When ready to fully migrate:

```typescript
// Pseudo-code for migration
for (const tenant of legacyTenants) {
  if (!tenant.employerProfileId) {
    // Create employer profile for legacy tenant
    const profile = await createEmployerProfile(db, tenant.ownerId, {
      displayName: tenant.companyName,
      employeeCount: tenant.employeeCount,
      contactEmail: tenant.ownerEmail,
    });
    
    // Link tenant to profile
    await updateTenant(tenant.id, {
      employerProfileId: profile.id,
      employerCode: profile.employerCode,
    });
  }
}
```

## API Reference

### Core Functions

**Generate Employer Code:**
```typescript
const code = await generateEmployerCode(db);
// Returns: "1234" (unique 4-digit code)
```

**Get Profile by Code:**
```typescript
const profile = await getEmployerProfileByCode(db, "1234");
// Returns: EmployerProfile | null
```

**Get Profile by ID:**
```typescript
const profile = await getEmployerProfileById(db, employerId);
// Returns: EmployerProfile | null
```

**Create Employer Profile:**
```typescript
const profile = await createEmployerProfile(db, uid, {
  displayName: "Acme Corp",
  employeeCount: 25,
  contactEmail: "owner@acme.com",
  logoUrl: "https://...",
  brandColor: "#FF5733",
});
```

**Update Branding:**
```typescript
await updateEmployerBranding(db, employerId, {
  displayName: "New Company Name",
  logoUrl: "https://new-logo.png",
  brandColor: "#0066CC",
});
```

**Link Employee:**
```typescript
await linkEmployeeToEmployer(db, employeeUid, employerId, {
  email: "employee@example.com",
  displayName: "Jane Smith",
  role: "employee",
});
```

**Regenerate Code:**
```typescript
const newCode = await regenerateEmployerCode(db, employerId);
// Returns: "5678" (new unique code)
```

## Testing

### Unit Tests

Located in: `packages/esta-firebase/src/__tests__/employer-profile.test.ts`

Tests cover:
- Code generation and validation
- Uniqueness guarantees
- Profile CRUD operations
- Employee linking
- Error handling

Run tests:
```bash
npm run test -- employer-profile
```

### Integration Tests

End-to-end scenarios:
1. Employer registers → receives code
2. Employee registers with code → successfully linked
3. Employee can view employer branding
4. Access control enforced

### Manual Testing Checklist

- [ ] Employer registration generates valid 4-digit code
- [ ] Code is displayed to employer after registration
- [ ] Employee registration with valid code succeeds
- [ ] Employee registration with invalid code fails with clear error
- [ ] Employee can view employer profile (branding)
- [ ] Employer can view list of employees
- [ ] Employer cannot access other employers' data
- [ ] Employee cannot access other employers' data
- [ ] Code regeneration creates new valid code
- [ ] Old code becomes invalid after regeneration

## Troubleshooting

### Common Issues

**"Invalid employer code" error:**
- Verify code is exactly 4 digits
- Check code hasn't been regenerated
- Confirm employer has completed registration

**Employee not appearing in employer list:**
- Check `employerProfiles/{employerId}/employees/{employeeUid}` exists
- Verify `users/{employeeUid}.employerId` is set correctly
- Check Firestore rules allow employer to read employee collection

**Branding not appearing:**
- Verify employer profile has `displayName`, `logoUrl`, `brandColor` set
- Check employee's `employerId` matches employer's UID
- Ensure frontend is fetching employer profile

**Code collision (rare):**
- System automatically retries up to 10 times
- If persistent, check if nearing 9,000 code capacity
- Consider expanding code range or archiving inactive employers

## Monitoring & Metrics

### Key Metrics to Track

1. **Code Utilization:** % of 9,000 codes in use
2. **Registration Success Rate:** % of employee registrations that succeed
3. **Code Regeneration Frequency:** How often codes are regenerated
4. **Average Employee Link Time:** Time from registration to successful linking

### Alerts

Set up alerts for:
- Code utilization > 80%
- Employee registration failure rate > 5%
- Code collision rate > 1%

## Future Enhancements

### Planned Features

1. **Code Expiration:** Optional TTL for employer codes
2. **Invite Links:** Pre-authenticated registration links with embedded code
3. **Bulk Employee Import:** CSV import with automatic linking
4. **Code Customization:** Allow employers to request specific codes
5. **Multi-Location Support:** Sub-codes for employers with multiple locations

### Scaling Considerations

**Current Capacity:** 9,000 employers

**When approaching capacity:**
- Expand to 5-digit codes (90,000 capacity)
- Implement code archival for inactive employers
- Add region-specific code ranges

## Support & Contact

For issues with employer profiles or employee linking:
- Technical: dev@estatracker.com
- Support: support@estatracker.com
- Documentation: https://docs.estatracker.com/employer-profiles

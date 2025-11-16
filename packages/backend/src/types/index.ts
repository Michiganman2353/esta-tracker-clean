// Michigan ESTA Compliance Types

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'employee' | 'employer' | 'admin';
  employerId?: string;
  employerSize: 'small' | 'large';
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceRules {
  employerSize: 'small' | 'large';
  accrualRate: number;
  maxPaidHoursPerYear: number;
  maxUnpaidHoursPerYear: number;
  carryoverCap: number;
  auditRetentionYears: number;
}

// Michigan ESTA (Earned Sick Time Act) types

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'employer' | 'admin';
  employerId?: string;
  employerSize: 'small' | 'large'; // <10 employees = small, >=10 = large
  status?: 'pending' | 'approved' | 'rejected'; // For manager/employer approval
  createdAt: string;
  updatedAt: string;
}

export interface AccrualBalance {
  userId: string;
  yearlyAccrued: number; // Total accrued this year
  paidHoursUsed: number; // Paid hours used this year
  unpaidHoursUsed: number; // Unpaid hours used (small employers only)
  carryoverHours: number; // Carried over from previous year
  availablePaidHours: number; // Current available paid hours
  availableUnpaidHours: number; // Current available unpaid hours (small employers)
  year: number;
}

export type UsageCategory =
  | 'illness' // Employee's own illness
  | 'medical_appointment' // Medical appointments
  | 'preventive_care' // Preventive care
  | 'family_care' // Care for family member
  | 'domestic_violence' // Domestic violence
  | 'sexual_assault' // Sexual assault
  | 'stalking'; // Stalking

export interface SickTimeRequest {
  id: string;
  userId: string;
  employerId: string;
  hours: number;
  isPaid: boolean;
  category: UsageCategory;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
  denialReason?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface WorkLog {
  id: string;
  userId: string;
  employerId: string;
  hoursWorked: number;
  date: string;
  source: 'manual' | 'quickbooks' | 'adp' | 'paychex';
  accrualAmount: number; // Sick time accrued from this work period
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  employerId: string;
  action:
    | 'accrual'
    | 'usage_request'
    | 'usage_approved'
    | 'usage_denied'
    | 'carryover'
    | 'balance_adjustment'
    | 'retaliation_report';
  details: Record<string, unknown>;
  timestamp: string;
  performedBy?: string;
}

export interface RetaliationReport {
  id: string;
  reporterId: string;
  employerId: string;
  incidentDate: string;
  description: string;
  relatedRequestId?: string;
  status: 'open' | 'investigating' | 'resolved' | 'unfounded';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRules {
  employerSize: 'small' | 'large';
  accrualRate: number; // For large: 1/30, for small: annual 40
  maxPaidHoursPerYear: number; // Small: 40, Large: 72
  maxUnpaidHoursPerYear: number; // Small: 32, Large: 0
  carryoverCap: number; // Small: 40, Large: 72
  auditRetentionYears: number; // Default: 3
}

export interface EmployerSettings {
  id: string;
  name: string;
  size: 'small' | 'large';
  employeeCount: number;
  payrollIntegration?: 'quickbooks' | 'adp' | 'paychex';
  notificationEmail: string;
  enableAntiRetaliationAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

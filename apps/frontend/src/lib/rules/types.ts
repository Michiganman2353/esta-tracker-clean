/**
 * Type definitions for Michigan ESTA compliance rules
 */

export type EmployerSize = 'small' | 'large';

export type AccrualMethod = 'accrual' | 'frontload';

export type UsageCategory =
  | 'illness' // Personal illness or injury
  | 'medical_appointment' // Medical appointment
  | 'preventive_care' // Preventive medical care
  | 'family_care' // Care for family member
  | 'domestic_violence' // Domestic violence
  | 'sexual_assault' // Sexual assault
  | 'stalking'; // Stalking

export interface ComplianceRules {
  employerSize: EmployerSize;
  accrualMethod: AccrualMethod;
  accrualRate: number; // For accrual method: 1 hour per 30 hours worked (large), 0 for small
  maxPaidHoursPerYear: number; // Small: 40, Large: 72
  maxUnpaidHoursPerYear: number; // Small: 32, Large: 0
  carryoverCap: number; // Small: 40, Large: 72
  auditRetentionYears: number; // Default: 3
  frontloadAmount?: number; // For frontload method
}

export interface AccrualCalculation {
  accrued: number;
  cap: number;
  remaining: number;
  capped: boolean;
}

export interface OffboardingBalance {
  paidHoursBalance: number;
  unpaidHoursBalance: number;
  paymentDeferralDays: number; // 120 days per Michigan ESTA
  finalPaymentDate: string;
  notes: string;
}

export interface EditReversionRecord {
  editId: string;
  userId: string;
  originalValue: number;
  editedValue: number;
  timestamp: string;
  approved: boolean;
  revertedAt?: string;
  revertedBy?: string;
}

export interface UsageValidation {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

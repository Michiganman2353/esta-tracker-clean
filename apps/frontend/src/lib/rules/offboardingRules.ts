/**
 * Michigan ESTA Offboarding Rules
 * Handles end-of-employment balance calculations and payment deferral
 */

import { EmployerSize, OffboardingBalance } from './types';

/**
 * Michigan ESTA 120-day payment deferral period
 * Employers do not need to pay out accrued ESTA time for 120 days after termination
 */
export const PAYMENT_DEFERRAL_DAYS = 120;

/**
 * Calculate offboarding balance and payment details
 * @param paidHoursBalance Current paid hours balance
 * @param unpaidHoursBalance Current unpaid hours balance
 * @param employerSize Small or large employer
 * @param terminationDate Date of employment termination
 * @returns Offboarding balance with payment deferral information
 */
export function calculateOffboardingBalance(
  paidHoursBalance: number,
  unpaidHoursBalance: number,
  employerSize: EmployerSize,
  terminationDate: Date
): OffboardingBalance {
  // Calculate final payment date (120 days after termination)
  const finalPaymentDate = new Date(terminationDate);
  finalPaymentDate.setDate(finalPaymentDate.getDate() + PAYMENT_DEFERRAL_DAYS);

  // Generate notes based on employer size and balance
  const notes = generateOffboardingNotes(
    paidHoursBalance,
    unpaidHoursBalance,
    employerSize,
    terminationDate,
    finalPaymentDate
  );

  return {
    paidHoursBalance,
    unpaidHoursBalance,
    paymentDeferralDays: PAYMENT_DEFERRAL_DAYS,
    finalPaymentDate: finalPaymentDate.toISOString(),
    notes,
  };
}

/**
 * Generate offboarding notes with payment information
 * @param paidHours Paid hours balance
 * @param unpaidHours Unpaid hours balance
 * @param employerSize Employer size
 * @param terminationDate Termination date
 * @param finalPaymentDate Final payment date
 * @returns Formatted notes string
 */
function generateOffboardingNotes(
  paidHours: number,
  unpaidHours: number,
  employerSize: EmployerSize,
  terminationDate: Date,
  finalPaymentDate: Date
): string {
  const notes: string[] = [];

  // Header
  notes.push('=== ESTA Offboarding Summary ===\n');

  // Balance information
  notes.push(`Final Paid Sick Time Balance: ${paidHours.toFixed(2)} hours`);
  if (employerSize === 'small' && unpaidHours > 0) {
    notes.push(`Final Unpaid Sick Time Balance: ${unpaidHours.toFixed(2)} hours`);
  }
  notes.push('');

  // Payment deferral information
  notes.push('=== Payment Deferral Period ===');
  notes.push(
    'Under Michigan ESTA, employers are NOT required to pay out accrued sick time immediately upon termination.'
  );
  notes.push(
    `Payment deferral period: ${PAYMENT_DEFERRAL_DAYS} days from termination date`
  );
  notes.push(`Termination date: ${terminationDate.toLocaleDateString()}`);
  notes.push(
    `Final payment due by: ${finalPaymentDate.toLocaleDateString()}`
  );
  notes.push('');

  // Important notes
  notes.push('=== Important Notes ===');
  notes.push(
    '• Employer has up to 120 days to pay out accrued sick time'
  );
  notes.push(
    '• Payment must be made at employee\'s final rate of pay'
  );
  notes.push(
    '• Unpaid sick time does not need to be paid out (small employers only)'
  );
  notes.push(
    '• Keep this record for 3 years for audit purposes'
  );

  return notes.join('\n');
}

/**
 * Calculate payout amount for offboarding
 * @param paidHoursBalance Hours to pay out
 * @param hourlyRate Employee's final hourly rate
 * @returns Payout amount in dollars
 */
export function calculatePayoutAmount(
  paidHoursBalance: number,
  hourlyRate: number
): number {
  return paidHoursBalance * hourlyRate;
}

/**
 * Check if payment deferral period has expired
 * @param terminationDate Date of termination
 * @param currentDate Current date (defaults to today)
 * @returns True if deferral period has expired
 */
export function hasPaymentDeferralExpired(
  terminationDate: Date,
  currentDate: Date = new Date()
): boolean {
  const deferralEndDate = new Date(terminationDate);
  deferralEndDate.setDate(deferralEndDate.getDate() + PAYMENT_DEFERRAL_DAYS);
  return currentDate >= deferralEndDate;
}

/**
 * Calculate days remaining in payment deferral period
 * @param terminationDate Date of termination
 * @param currentDate Current date (defaults to today)
 * @returns Days remaining (0 if expired)
 */
export function getDaysRemainingInDeferral(
  terminationDate: Date,
  currentDate: Date = new Date()
): number {
  const deferralEndDate = new Date(terminationDate);
  deferralEndDate.setDate(deferralEndDate.getDate() + PAYMENT_DEFERRAL_DAYS);
  
  const daysRemaining = Math.ceil(
    (deferralEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return Math.max(0, daysRemaining);
}

/**
 * Generate offboarding record export
 * @param offboardingBalance Offboarding balance information
 * @param employeeName Employee name
 * @param employeeId Employee ID
 * @returns Formatted record for export
 */
export function generateOffboardingRecord(
  offboardingBalance: OffboardingBalance,
  employeeName: string,
  employeeId: string
): string {
  const record: string[] = [];
  
  record.push('=== ESTA OFFBOARDING RECORD ===\n');
  record.push(`Employee: ${employeeName}`);
  record.push(`Employee ID: ${employeeId}`);
  record.push(`Generated: ${new Date().toLocaleString()}\n`);
  
  record.push(offboardingBalance.notes);
  
  record.push('\n=== Record Certification ===');
  record.push(
    'This record has been generated in compliance with Michigan ESTA requirements.'
  );
  record.push('Retain this record for at least 3 years.');
  
  return record.join('\n');
}

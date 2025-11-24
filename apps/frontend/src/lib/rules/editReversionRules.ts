/**
 * Michigan ESTA Edit Reversion Rules
 * Handles accrual reversion for unapproved edits
 */

import { EditReversionRecord } from './types';

/**
 * Create edit reversion record
 * @param editId Unique edit identifier
 * @param userId User ID
 * @param originalValue Original value before edit
 * @param editedValue New value after edit
 * @returns Edit reversion record
 */
export function createEditReversionRecord(
  editId: string,
  userId: string,
  originalValue: number,
  editedValue: number
): EditReversionRecord {
  return {
    editId,
    userId,
    originalValue,
    editedValue,
    timestamp: new Date().toISOString(),
    approved: false,
  };
}

/**
 * Approve edit
 * @param record Edit reversion record
 * @returns Updated record with approval
 */
export function approveEdit(record: EditReversionRecord): EditReversionRecord {
  return {
    ...record,
    approved: true,
  };
}

/**
 * Revert unapproved edit
 * @param record Edit reversion record
 * @param revertedBy User ID who performed reversion
 * @returns Updated record with reversion information
 */
export function revertEdit(
  record: EditReversionRecord,
  revertedBy: string
): EditReversionRecord {
  if (record.approved) {
    throw new Error('Cannot revert an approved edit');
  }

  return {
    ...record,
    revertedAt: new Date().toISOString(),
    revertedBy,
  };
}

/**
 * Check if edit should be reverted
 * @param record Edit reversion record
 * @param approvalTimeoutHours Hours to wait for approval before auto-revert
 * @returns True if edit should be reverted
 */
export function shouldRevertEdit(
  record: EditReversionRecord,
  approvalTimeoutHours: number = 72
): boolean {
  // Already approved - don't revert
  if (record.approved) {
    return false;
  }

  // Already reverted - don't revert again
  if (record.revertedAt) {
    return false;
  }

  // Check if timeout has passed
  const editTime = new Date(record.timestamp).getTime();
  const currentTime = new Date().getTime();
  const hoursElapsed = (currentTime - editTime) / (1000 * 60 * 60);

  return hoursElapsed >= approvalTimeoutHours;
}

/**
 * Calculate value to restore after reversion
 * @param record Edit reversion record
 * @returns Value to restore (original value)
 */
export function getReversionValue(record: EditReversionRecord): number {
  return record.originalValue;
}

/**
 * Validate edit for reversion eligibility
 * @param record Edit reversion record
 * @returns Validation result
 */
export function validateEditForReversion(
  record: EditReversionRecord
): { valid: boolean; error?: string } {
  if (record.approved) {
    return {
      valid: false,
      error: 'Cannot revert an approved edit',
    };
  }

  if (record.revertedAt) {
    return {
      valid: false,
      error: 'Edit has already been reverted',
    };
  }

  return { valid: true };
}

/**
 * Get pending edits that need approval
 * @param records Array of edit reversion records
 * @returns Records that are pending approval
 */
export function getPendingEdits(
  records: EditReversionRecord[]
): EditReversionRecord[] {
  return records.filter(
    record => !record.approved && !record.revertedAt
  );
}

/**
 * Get edits that need auto-reversion
 * @param records Array of edit reversion records
 * @param approvalTimeoutHours Hours to wait for approval
 * @returns Records that should be auto-reverted
 */
export function getEditsNeedingReversion(
  records: EditReversionRecord[],
  approvalTimeoutHours: number = 72
): EditReversionRecord[] {
  return records.filter(record =>
    shouldRevertEdit(record, approvalTimeoutHours)
  );
}

/**
 * Calculate hours difference from edit
 * @param record Edit reversion record
 * @returns Difference in hours (positive if increased, negative if decreased)
 */
export function calculateEditDifference(
  record: EditReversionRecord
): number {
  return record.editedValue - record.originalValue;
}

/**
 * Generate reversion audit message
 * @param record Edit reversion record
 * @returns Formatted audit message
 */
export function generateReversionAuditMessage(
  record: EditReversionRecord
): string {
  const difference = calculateEditDifference(record);
  const action = difference > 0 ? 'increased' : 'decreased';
  const absDifference = Math.abs(difference);

  return `Edit ${record.editId} reverted: ${action} hours by ${absDifference.toFixed(2)} from ${record.originalValue.toFixed(2)} to ${record.editedValue.toFixed(2)}. Reverted by ${record.revertedBy || 'system'} at ${record.revertedAt}`;
}

/**
 * Check if edit requires supervisor approval
 * @param originalValue Original value
 * @param editedValue Edited value
 * @param thresholdHours Threshold for requiring approval
 * @returns True if approval required
 */
export function requiresApproval(
  originalValue: number,
  editedValue: number,
  thresholdHours: number = 8
): boolean {
  const difference = Math.abs(editedValue - originalValue);
  return difference >= thresholdHours;
}

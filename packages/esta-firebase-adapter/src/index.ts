/**
 * ESTA Firebase Adapter
 *
 * This package provides Firebase integration for the ESTA core library.
 * It isolates all Firebase/Firestore interactions from the pure business logic,
 * making the core logic testable and the system boundaries clear.
 */

import * as admin from 'firebase-admin';
import { calculateAccruedHours, calculateCappedAccrual } from '@esta/core';

/**
 * Initialize Firebase Admin SDK.
 * Call this once at application startup.
 *
 * @param appOptions - Optional Firebase app configuration
 */
export function initAdmin(appOptions?: admin.AppOptions): admin.app.App {
  if (!admin.apps.length) {
    return admin.initializeApp(appOptions || {});
  }
  return admin.apps[0] as admin.app.App;
}

/**
 * Get the Firestore database instance.
 */
export function getFirestore(): admin.firestore.Firestore {
  return admin.firestore();
}

/**
 * Get employee hours worked from Firestore.
 *
 * @param employeeId - The unique employee identifier
 * @returns Hours worked, or 0 if employee not found
 */
export async function getEmployeeHours(employeeId: string): Promise<number> {
  const doc = await admin.firestore().doc(`employees/${employeeId}`).get();
  if (!doc.exists) {
    return 0;
  }
  const data = doc.data();
  return data?.hoursWorked ?? 0;
}

/**
 * Compute and store accrual for an employee.
 *
 * @param employeeId - The unique employee identifier
 * @returns The computed accrued hours
 */
export async function computeAndStoreAccrual(
  employeeId: string
): Promise<number> {
  const hours = await getEmployeeHours(employeeId);
  const accrued = calculateAccruedHours(hours);

  await admin
    .firestore()
    .doc(`employees/${employeeId}`)
    .update({ accruedHours: accrued });

  return accrued;
}

/**
 * Compute and store capped accrual based on employer size.
 *
 * @param employeeId - The unique employee identifier
 * @param employeeCount - Number of employees in the organization
 * @returns The computed capped accrued hours
 */
export async function computeAndStoreCappedAccrual(
  employeeId: string,
  employeeCount: number
): Promise<number> {
  const hours = await getEmployeeHours(employeeId);
  const accrued = calculateCappedAccrual(hours, employeeCount);

  await admin
    .firestore()
    .doc(`employees/${employeeId}`)
    .update({ accruedHours: accrued });

  return accrued;
}

// Re-export core functions for convenience
export { calculateAccruedHours, calculateCappedAccrual } from '@esta/core';

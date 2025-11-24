/**
 * Employer Profile Management
 * 
 * This module provides functions for managing employer profiles,
 * including code generation, validation, and employee linking.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type {
  EmployerProfile,
  CreateEmployerProfileInput,
  UpdateEmployerBrandingInput,
  EmployerEmployee,
} from '@esta/shared-types';
import {
  generateRandomEmployerCode,
  isValidEmployerCode,
} from '@esta/shared-types';

/**
 * Generate a unique employer code with collision detection
 * 
 * @param db Firestore instance
 * @param maxAttempts Maximum number of attempts to generate a unique code
 * @returns A unique 4-digit employer code
 * @throws Error if unable to generate unique code after maxAttempts
 */
export async function generateEmployerCode(
  db: Firestore,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRandomEmployerCode();
    
    // Check if code already exists
    const existingProfile = await getEmployerProfileByCode(db, code);
    
    if (!existingProfile) {
      return code;
    }
    
    console.log(`Employer code ${code} already exists, retrying... (attempt ${attempt + 1}/${maxAttempts})`);
  }
  
  throw new Error(`Failed to generate unique employer code after ${maxAttempts} attempts`);
}

/**
 * Get employer profile by 4-digit code
 * 
 * @param db Firestore instance
 * @param code 4-digit employer code
 * @returns EmployerProfile if found, null otherwise
 */
export async function getEmployerProfileByCode(
  db: Firestore,
  code: string
): Promise<EmployerProfile | null> {
  if (!isValidEmployerCode(code)) {
    return null;
  }
  
  const profilesRef = collection(db, 'employerProfiles');
  const q = query(profilesRef, where('employerCode', '==', code));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const docSnap = querySnapshot.docs[0];
  if (!docSnap) {
    return null;
  }
  
  const data = docSnap.data();
  
  return {
    id: docSnap.id,
    employerCode: data.employerCode,
    displayName: data.displayName,
    logoUrl: data.logoUrl,
    brandColor: data.brandColor,
    size: data.size,
    employeeCount: data.employeeCount,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as EmployerProfile;
}

/**
 * Get employer profile by ID
 * 
 * @param db Firestore instance
 * @param employerId Employer profile ID
 * @returns EmployerProfile if found, null otherwise
 */
export async function getEmployerProfileById(
  db: Firestore,
  employerId: string
): Promise<EmployerProfile | null> {
  const docRef = doc(db, 'employerProfiles', employerId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    employerCode: data.employerCode,
    displayName: data.displayName,
    logoUrl: data.logoUrl,
    brandColor: data.brandColor,
    size: data.size,
    employeeCount: data.employeeCount,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as EmployerProfile;
}

/**
 * Create a new employer profile
 * 
 * @param db Firestore instance
 * @param uid User ID of the employer
 * @param input Employer profile creation data
 * @returns Created EmployerProfile
 */
export async function createEmployerProfile(
  db: Firestore,
  uid: string,
  input: CreateEmployerProfileInput
): Promise<EmployerProfile> {
  // Generate unique employer code
  const employerCode = await generateEmployerCode(db);
  
  // Determine employer size
  const size = input.employeeCount >= 10 ? 'large' : 'small';
  
  const profileData = {
    employerCode,
    displayName: input.displayName,
    logoUrl: input.logoUrl ?? null,
    brandColor: input.brandColor ?? null,
    size,
    employeeCount: input.employeeCount,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // Create employer profile document
  const profileRef = doc(db, 'employerProfiles', uid);
  await setDoc(profileRef, profileData);
  
  return {
    id: uid,
    employerCode,
    displayName: input.displayName,
    logoUrl: input.logoUrl,
    brandColor: input.brandColor,
    size,
    employeeCount: input.employeeCount,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update employer profile branding
 * 
 * @param db Firestore instance
 * @param employerId Employer profile ID
 * @param input Branding update data
 */
export async function updateEmployerBranding(
  db: Firestore,
  employerId: string,
  input: UpdateEmployerBrandingInput
): Promise<void> {
  const profileRef = doc(db, 'employerProfiles', employerId);
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  
  if (input.displayName !== undefined) {
    updateData.displayName = input.displayName;
  }
  if (input.logoUrl !== undefined) {
    updateData.logoUrl = input.logoUrl;
  }
  if (input.brandColor !== undefined) {
    updateData.brandColor = input.brandColor;
  }
  
  await setDoc(profileRef, updateData, { merge: true });
}

/**
 * Link an employee to an employer
 * 
 * @param db Firestore instance
 * @param employeeUid Employee user ID
 * @param employerId Employer profile ID
 * @param employeeData Employee information
 */
export async function linkEmployeeToEmployer(
  db: Firestore,
  employeeUid: string,
  employerId: string,
  employeeData: {
    email: string;
    displayName: string;
    role: 'employee' | 'manager';
  }
): Promise<void> {
  // Use transaction to ensure atomicity
  await runTransaction(db, async (transaction) => {
    // Update user document with employerId
    const userRef = doc(db, 'users', employeeUid);
    transaction.update(userRef, {
      employerId,
      updatedAt: serverTimestamp(),
    });
    
    // Create employee record in employer's employees subcollection
    const employeeRef = doc(db, 'employerProfiles', employerId, 'employees', employeeUid);
    transaction.set(employeeRef, {
      uid: employeeUid,
      email: employeeData.email,
      displayName: employeeData.displayName,
      joinDate: serverTimestamp(),
      role: employeeData.role,
      status: 'active',
    });
  });
}

/**
 * Get employee record from employer profile
 * 
 * @param db Firestore instance
 * @param employerId Employer profile ID
 * @param employeeUid Employee user ID
 * @returns EmployerEmployee if found, null otherwise
 */
export async function getEmployerEmployee(
  db: Firestore,
  employerId: string,
  employeeUid: string
): Promise<EmployerEmployee | null> {
  const employeeRef = doc(db, 'employerProfiles', employerId, 'employees', employeeUid);
  const employeeSnap = await getDoc(employeeRef);
  
  if (!employeeSnap.exists()) {
    return null;
  }
  
  const data = employeeSnap.data();
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    joinDate: data.joinDate?.toDate() || new Date(),
    role: data.role,
    status: data.status,
  } as EmployerEmployee;
}

/**
 * Regenerate employer code
 * 
 * @param db Firestore instance
 * @param employerId Employer profile ID
 * @returns New employer code
 */
export async function regenerateEmployerCode(
  db: Firestore,
  employerId: string
): Promise<string> {
  const newCode = await generateEmployerCode(db);
  
  const profileRef = doc(db, 'employerProfiles', employerId);
  await setDoc(profileRef, {
    employerCode: newCode,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  
  return newCode;
}

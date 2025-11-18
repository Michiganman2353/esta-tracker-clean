import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { User } from '../types';

export interface RegisterManagerData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  employeeCount: number;
}

export interface RegisterEmployeeData {
  name: string;
  email: string;
  password: string;
  tenantCode?: string;
  employerEmail?: string;
}

/**
 * Generate a unique tenant code (company code)
 */
function generateTenantCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Register a new manager/employer account
 */
export async function registerManager(data: RegisterManagerData): Promise<{ user: User; needsVerification: boolean }> {
  if (!auth || !db || !isFirebaseConfigured) {
    throw new Error('Firebase not configured. Please check your environment variables.');
  }

  try {
    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const { user: firebaseUser } = userCredential;

    // Generate unique tenant code
    const tenantCode = generateTenantCode();

    // Determine employer size
    const employerSize = data.employeeCount >= 10 ? 'large' : 'small';

    // Create tenant/company document
    const tenantId = `tenant_${firebaseUser.uid}`;
    await setDoc(doc(db, 'tenants', tenantId), {
      id: tenantId,
      companyName: data.companyName,
      tenantCode,
      size: employerSize,
      employeeCount: data.employeeCount,
      ownerId: firebaseUser.uid,
      status: 'pending', // Pending until email verified
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
      email: data.email,
      name: data.name,
      role: 'employer',
      employerId: tenantId,
      employerSize,
      status: 'pending', // Pending until email verified
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      emailVerified: false,
      tenantId,
      tenantCode,
      companyName: data.companyName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create audit log
    await setDoc(doc(collection(db, 'auditLogs')), {
      userId: firebaseUser.uid,
      employerId: tenantId,
      action: 'registration',
      details: {
        role: 'employer',
        companyName: data.companyName,
        employeeCount: data.employeeCount,
        tenantCode,
      },
      timestamp: serverTimestamp(),
    });

    // Send email verification
    await sendEmailVerification(firebaseUser);

    return { user: userData, needsVerification: true };
  } catch (error: unknown) {
    console.error('Manager registration error:', error);
    
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please use a different email or try logging in.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else if (err.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 8 characters.');
    } else {
      throw new Error(err.message || 'Registration failed. Please try again.');
    }
  }
}

/**
 * Register a new employee account
 */
export async function registerEmployee(data: RegisterEmployeeData): Promise<{ user: User; needsVerification: boolean }> {
  if (!auth || !db || !isFirebaseConfigured) {
    throw new Error('Firebase not configured. Please check your environment variables.');
  }

  try {
    // Validate tenant code or employer email
    let tenantId = '';
    let employerSize: 'small' | 'large' = 'small';
    let companyName = '';

    if (data.tenantCode) {
      // Find tenant by code
      const tenantsQuery = query(
        collection(db, 'tenants'),
        where('tenantCode', '==', data.tenantCode.toUpperCase())
      );
      const tenantSnapshot = await getDocs(tenantsQuery);

      if (tenantSnapshot.empty) {
        throw new Error('Invalid company code. Please check with your employer.');
      }

      const tenantDoc = tenantSnapshot.docs[0];
      tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      employerSize = tenantData.size;
      companyName = tenantData.companyName;
    } else if (data.employerEmail) {
      // Find tenant by employer email domain
      const emailDomain = data.employerEmail.split('@')[1];
      const tenantsQuery = query(
        collection(db, 'tenants'),
        where('emailDomain', '==', emailDomain)
      );
      const tenantSnapshot = await getDocs(tenantsQuery);

      if (tenantSnapshot.empty) {
        throw new Error('No company found with this email domain. Please use a company code instead.');
      }

      const tenantDoc = tenantSnapshot.docs[0];
      tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      employerSize = tenantData.size;
      companyName = tenantData.companyName;
    } else {
      throw new Error('Please provide either a company code or employer email.');
    }

    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const { user: firebaseUser } = userCredential;

    // Create user document in Firestore
    const userData: User = {
      id: firebaseUser.uid,
      email: data.email,
      name: data.name,
      role: 'employee',
      employerId: tenantId,
      employerSize,
      status: 'pending', // Pending until email verified
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      emailVerified: false,
      tenantId,
      companyName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create audit log
    await setDoc(doc(collection(db, 'auditLogs')), {
      userId: firebaseUser.uid,
      employerId: tenantId,
      action: 'registration',
      details: {
        role: 'employee',
        tenantId,
        registrationMethod: data.tenantCode ? 'tenantCode' : 'employerEmail',
      },
      timestamp: serverTimestamp(),
    });

    // Send email verification
    await sendEmailVerification(firebaseUser);

    return { user: userData, needsVerification: true };
  } catch (error: unknown) {
    console.error('Employee registration error:', error);
    
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please use a different email or try logging in.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format.');
    } else if (err.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 8 characters.');
    } else {
      throw new Error(err.message || 'Registration failed. Please try again.');
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  if (!auth || !db || !isFirebaseConfigured) {
    throw new Error('Firebase not configured. Please check your environment variables.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user: firebaseUser } = userCredential;

    // Check if email is verified
    if (!firebaseUser.emailVerified) {
      throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
    }

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found. Please contact support.');
    }

    const userData = userDoc.data() as User;

    // Check if account is approved
    if (userData.status === 'pending') {
      throw new Error('Your account is pending approval. You will receive an email once approved.');
    }

    if (userData.status === 'rejected') {
      throw new Error('Your account has been rejected. Please contact support for more information.');
    }

    return userData;
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please try again.');
    } else if (err.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    } else if (err.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else {
      throw error;
    }
  }
}

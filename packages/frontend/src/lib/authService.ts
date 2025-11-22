import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
import { auth, db } from '@/services/firebase';
import { User } from '@/types';
import { 
  isValidEmail, 
  validatePassword, 
  sanitizeInput,
  checkRateLimit,
  sanitizeForLogging 
} from '@/utils/security';

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
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      const err = error as { code?: string };
      if (err.code && [
        'auth/email-already-in-use',
        'auth/invalid-email',
        'auth/weak-password',
        'auth/invalid-credential',
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/too-many-requests',
      ].includes(err.code)) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Register a new manager/employer account
 */
export async function registerManager(data: RegisterManagerData): Promise<{ user: User; needsVerification: boolean }> {
  // Rate limiting check
  const rateCheck = checkRateLimit('manager_registration', 3, 300000); // 3 attempts per 5 minutes
  if (!rateCheck.allowed) {
    const waitMinutes = Math.ceil((rateCheck.resetTime - Date.now()) / 60000);
    throw new Error(`Too many registration attempts. Please wait ${waitMinutes} minutes and try again.`);
  }

  // Pre-flight validation checks
  if (!auth || !db) {
    console.error('Firebase configuration check failed:', sanitizeForLogging({
      auth: !!auth,
      db: !!db,
    }));
    throw new Error('Firebase not configured. Please check your environment variables or contact support.');
  }

  // Store in local variables to satisfy TypeScript
  const firebaseAuth = auth;
  const firebaseDb = db;

  // Validate window.location is available (for action code URL)
  if (typeof window === 'undefined' || !window.location) {
    throw new Error('Window location not available. Please try again.');
  }

  // Validate and sanitize input data
  const sanitizedEmail = sanitizeInput(data.email, 254).toLowerCase();
  if (!isValidEmail(sanitizedEmail)) {
    throw new Error('Invalid email address format. Please enter a valid email.');
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message || 'Invalid password');
  }

  const sanitizedName = sanitizeInput(data.name, 100);
  if (!sanitizedName || sanitizedName.length < 2) {
    throw new Error('Please enter your full name (at least 2 characters)');
  }

  const sanitizedCompanyName = sanitizeInput(data.companyName, 200);
  if (!sanitizedCompanyName || sanitizedCompanyName.length < 2) {
    throw new Error('Please enter a valid company name (at least 2 characters)');
  }

  if (!data.employeeCount || data.employeeCount < 1 || data.employeeCount > 10000) {
    throw new Error('Please enter a valid employee count (1-10000)');
  }

  try {
    console.log('Starting manager registration for:', sanitizedEmail);
    console.log('Registration environment:', sanitizeForLogging({
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
    }));
    
    // Create Firebase Auth user with retry logic
    const userCredential: UserCredential = await retryWithBackoff(async () => {
      return await createUserWithEmailAndPassword(
        firebaseAuth,
        sanitizedEmail,
        data.password
      );
    });

    const { user: firebaseUser } = userCredential;
    console.log('Firebase user created:', firebaseUser.uid);

    // Generate unique tenant code
    const tenantCode = generateTenantCode();

    // Determine employer size
    const employerSize = data.employeeCount >= 10 ? 'large' : 'small';

    // Create tenant/company document with retry
    const tenantId = `tenant_${firebaseUser.uid}`;
    console.log('Creating tenant document:', tenantId);
    
    await retryWithBackoff(async () => {
      await setDoc(doc(firebaseDb, 'tenants', tenantId), {
        id: tenantId,
        companyName: sanitizedCompanyName,
        tenantCode,
        size: employerSize,
        employeeCount: data.employeeCount,
        ownerId: firebaseUser.uid,
        status: 'active', // FIXED: Set to active immediately
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Create user document in Firestore with retry
    console.log('Creating user document in Firestore');
    const userData: User = {
      id: firebaseUser.uid,
      email: sanitizedEmail,
      name: sanitizedName,
      role: 'employer',
      employerId: tenantId,
      employerSize,
      status: 'approved', // FIXED: Set to approved immediately
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await retryWithBackoff(async () => {
      await setDoc(doc(firebaseDb, 'users', firebaseUser.uid), {
        ...userData,
        emailVerified: firebaseUser.emailVerified,
        tenantId,
        tenantCode,
        companyName: sanitizedCompanyName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Create audit log with retry
    await retryWithBackoff(async () => {
      await setDoc(doc(collection(firebaseDb, 'auditLogs')), {
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
    });

    // DISABLED FOR DEVELOPMENT: Email verification temporarily bypassed
    // Send email verification with action code settings and retry
    // Don't fail registration if email sending fails - user can resend later
    console.log('[DEV MODE] Email verification bypassed for:', data.email);
    console.log('[DEV MODE] In production, verification email would be sent to:', data.email);
    
    // Temporarily disabled for development - uncomment to re-enable
    /*
    const actionCodeSettings = {
      url: window.location.origin + '/login?verified=true',
      handleCodeInApp: false,
    };
    console.log('Action code settings:', actionCodeSettings);
    
    try {
      await retryWithBackoff(async () => {
        await sendEmailVerification(firebaseUser, actionCodeSettings);
      }, 2, 2000); // Fewer retries for email, shorter delay
      
      console.log('Email verification sent successfully');
    } catch (emailError) {
      // Log the error but don't fail registration
      console.error('Failed to send verification email (non-fatal):', emailError);
      // User can resend from verification page
    }
    */

    return { user: userData, needsVerification: false }; // FIXED: Email verification is optional, not required
  } catch (error: unknown) {
    console.error('Manager registration error:', error);
    
    const err = error as { code?: string; message?: string };
    
    // Enhanced error messages with actionable guidance
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please use a different email or try logging in.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format. Please check and try again.');
    } else if (err.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 8 characters with letters.');
    } else if (err.code === 'auth/configuration-not-found') {
      throw new Error('Firebase authentication is not properly configured. Please contact support at support@estatracker.com.');
    } else if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again. If the problem persists, contact support.');
    } else if (err.code === 'auth/timeout') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (err.code === 'auth/too-many-requests') {
      throw new Error('Too many registration attempts. Please wait a few minutes and try again.');
    } else if (err.message?.includes('CORS') || err.message?.includes('cors')) {
      throw new Error('Connection error. Please try again or contact support if the problem persists.');
    } else {
      throw new Error(err.message || 'Registration failed. Please try again or contact support at support@estatracker.com.');
    }
  }
}

/**
 * Register a new employee account
 */
export async function registerEmployee(data: RegisterEmployeeData): Promise<{ user: User; needsVerification: boolean }> {
  // Rate limiting check
  const rateCheck = checkRateLimit('employee_registration', 5, 300000); // 5 attempts per 5 minutes
  if (!rateCheck.allowed) {
    const waitMinutes = Math.ceil((rateCheck.resetTime - Date.now()) / 60000);
    throw new Error(`Too many registration attempts. Please wait ${waitMinutes} minutes and try again.`);
  }

  // Pre-flight validation checks
  if (!auth || !db) {
    console.error('Firebase configuration check failed:', sanitizeForLogging({
      auth: !!auth,
      db: !!db,
    }));
    throw new Error('Firebase not configured. Please check your environment variables or contact support.');
  }

  // Store in local variables to satisfy TypeScript
  const firebaseAuth = auth;
  const firebaseDb = db;

  // Validate window.location is available (for action code URL)
  if (typeof window === 'undefined' || !window.location) {
    throw new Error('Window location not available. Please try again.');
  }

  // Validate and sanitize input data
  const sanitizedEmail = sanitizeInput(data.email, 254).toLowerCase();
  if (!isValidEmail(sanitizedEmail)) {
    throw new Error('Invalid email address format. Please enter a valid email.');
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message || 'Invalid password');
  }

  const sanitizedName = sanitizeInput(data.name, 100);
  if (!sanitizedName || sanitizedName.length < 2) {
    throw new Error('Please enter your full name (at least 2 characters)');
  }

  if (!data.tenantCode && !data.employerEmail) {
    throw new Error('Please provide either a company code or employer email');
  }

  try {
    console.log('Starting employee registration for:', sanitizedEmail);
    console.log('Registration environment:', sanitizeForLogging({
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
    }));
    
    // Validate tenant code or employer email
    let tenantId = '';
    let employerSize: 'small' | 'large' = 'small';
    let companyName = '';

    if (data.tenantCode) {
      console.log('Looking up tenant by code:', data.tenantCode);
      // Find tenant by code with retry
      const tenantSnapshot = await retryWithBackoff(async () => {
        const tenantsQuery = query(
          collection(firebaseDb, 'tenants'),
          where('tenantCode', '==', data.tenantCode!.toUpperCase())
        );
        return await getDocs(tenantsQuery);
      });

      if (tenantSnapshot.empty) {
        throw new Error('Invalid company code. Please check with your employer and try again.');
      }

      const tenantDoc = tenantSnapshot.docs[0];
      if (!tenantDoc) {
        throw new Error('Unable to retrieve company information.');
      }
      tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      employerSize = tenantData.size;
      companyName = tenantData.companyName;
      console.log('Found tenant:', tenantId, companyName);
    } else if (data.employerEmail) {
      // Find tenant by employer email domain with retry
      const emailDomain = data.employerEmail.split('@')[1];
      
      if (!emailDomain) {
        throw new Error('Invalid employer email format');
      }
      
      const tenantSnapshot = await retryWithBackoff(async () => {
        const tenantsQuery = query(
          collection(firebaseDb, 'tenants'),
          where('emailDomain', '==', emailDomain)
        );
        return await getDocs(tenantsQuery);
      });

      if (tenantSnapshot.empty) {
        throw new Error('No company found with this email domain. Please use a company code instead or contact your employer.');
      }

      const tenantDoc = tenantSnapshot.docs[0];
      if (!tenantDoc) {
        throw new Error('Unable to retrieve company information.');
      }
      tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      employerSize = tenantData.size;
      companyName = tenantData.companyName;
    } else {
      throw new Error('Please provide either a company code or employer email.');
    }

    // Create Firebase Auth user with retry
    console.log('Creating Firebase auth user for employee');
    const userCredential: UserCredential = await retryWithBackoff(async () => {
      return await createUserWithEmailAndPassword(
        firebaseAuth,
        sanitizedEmail,
        data.password
      );
    });

    const { user: firebaseUser } = userCredential;
    console.log('Firebase user created:', firebaseUser.uid);

    // Create user document in Firestore with retry
    const userData: User = {
      id: firebaseUser.uid,
      email: sanitizedEmail,
      name: sanitizedName,
      role: 'employee',
      employerId: tenantId,
      employerSize,
      status: 'approved', // FIXED: Set to approved immediately
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await retryWithBackoff(async () => {
      await setDoc(doc(firebaseDb, 'users', firebaseUser.uid), {
        ...userData,
        emailVerified: firebaseUser.emailVerified,
        tenantId,
        companyName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Create audit log with retry
    await retryWithBackoff(async () => {
      await setDoc(doc(collection(firebaseDb, 'auditLogs')), {
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
    });

    // DISABLED FOR DEVELOPMENT: Email verification temporarily bypassed
    // Send email verification with action code settings and retry
    // Don't fail registration if email sending fails - user can resend later
    console.log('[DEV MODE] Email verification bypassed for:', data.email);
    console.log('[DEV MODE] In production, verification email would be sent to:', data.email);
    
    // Temporarily disabled for development - uncomment to re-enable
    /*
    const actionCodeSettings = {
      url: window.location.origin + '/login?verified=true',
      handleCodeInApp: false,
    };
    console.log('Action code settings:', actionCodeSettings);
    
    try {
      await retryWithBackoff(async () => {
        await sendEmailVerification(firebaseUser, actionCodeSettings);
      }, 2, 2000); // Fewer retries for email, shorter delay
      
      console.log('Email verification sent successfully');
    } catch (emailError) {
      // Log the error but don't fail registration
      console.error('Failed to send verification email (non-fatal):', emailError);
      // User can resend from verification page
    }
    */

    return { user: userData, needsVerification: false }; // FIXED: Email verification is optional, not required
  } catch (error: unknown) {
    console.error('Employee registration error:', error);
    
    const err = error as { code?: string; message?: string };
    
    // Enhanced error messages with actionable guidance
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please use a different email or try logging in.');
    } else if (err.code === 'auth/invalid-email') {
      throw new Error('Invalid email address format. Please check and try again.');
    } else if (err.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 8 characters with letters.');
    } else if (err.code === 'auth/configuration-not-found') {
      throw new Error('Firebase authentication is not properly configured. Please contact support at support@estatracker.com.');
    } else if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again. If the problem persists, contact support.');
    } else if (err.code === 'auth/timeout') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    } else if (err.code === 'auth/too-many-requests') {
      throw new Error('Too many registration attempts. Please wait a few minutes and try again.');
    } else if (err.message?.includes('CORS') || err.message?.includes('cors')) {
      throw new Error('Connection error. Please try again or contact support if the problem persists.');
    } else {
      throw new Error(err.message || 'Registration failed. Please try again or contact support at support@estatracker.com.');
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  // Rate limiting check
  const rateCheck = checkRateLimit('login', 10, 300000); // 10 attempts per 5 minutes
  if (!rateCheck.allowed) {
    const waitMinutes = Math.ceil((rateCheck.resetTime - Date.now()) / 60000);
    throw new Error(`Too many login attempts. Please wait ${waitMinutes} minutes and try again.`);
  }

  if (!auth || !db) {
    throw new Error('Firebase not configured. Please check your environment variables.');
  }

  // Validate and sanitize input
  const sanitizedEmail = sanitizeInput(email, 254).toLowerCase();
  if (!isValidEmail(sanitizedEmail)) {
    throw new Error('Invalid email address format.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
    const { user: firebaseUser } = userCredential;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found. Please contact support.');
    }

    const userData = userDoc.data() as User;

    // FIXED: Auto-approve users regardless of email verification status
    // Email verification is now optional, not a blocking requirement
    // This allows users to access the system immediately after registration
    if (userData.status === 'pending') {
      console.log('Auto-approving user on first login');
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userData,
          status: 'approved',
          emailVerified: firebaseUser.emailVerified,
          verifiedAt: firebaseUser.emailVerified ? serverTimestamp() : null,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        
        userData.status = 'approved';
        
        // Log the auto-approval
        await setDoc(doc(collection(db, 'auditLogs')), {
          userId: firebaseUser.uid,
          employerId: userData.employerId,
          action: 'auto_approved_on_login',
          details: {
            email: firebaseUser.email,
            role: userData.role,
            emailVerified: firebaseUser.emailVerified,
          },
          timestamp: serverTimestamp(),
        });
      } catch (activationError) {
        console.error('Error auto-approving user:', activationError);
        // Continue - allow login even if approval fails
      }
    }

    // Check if account has been explicitly rejected by an admin
    if (userData.status === 'rejected') {
      throw new Error('Your account has been rejected. Please contact support for more information.');
    }

    return userData;
  } catch (error: unknown) {
    console.error('Sign in error:', sanitizeForLogging(error));
    
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

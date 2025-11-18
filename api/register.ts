import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

interface RegisterManagerRequest {
  name: string;
  email: string;
  password: string;
  companyName: string;
  employeeCount: number;
}

interface RegisterEmployeeRequest {
  name: string;
  email: string;
  password: string;
  tenantCode?: string;
  employerEmail?: string;
}

function generateTenantCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, ...data } = req.body as { type: 'manager' | 'employee' } & (RegisterManagerRequest | RegisterEmployeeRequest);

    if (!type || (type !== 'manager' && type !== 'employee')) {
      return res.status(400).json({ error: 'Invalid registration type' });
    }

    // Validate required fields
    if (!data.email || !data.password || !data.name) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name' });
    }

    if (type === 'manager') {
      const managerData = data as RegisterManagerRequest;
      
      if (!managerData.companyName || !managerData.employeeCount) {
        return res.status(400).json({ error: 'Missing required fields: companyName, employeeCount' });
      }

      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: managerData.email,
        password: managerData.password,
        displayName: managerData.name,
        emailVerified: false,
      });

      // Generate unique tenant code
      const tenantCode = generateTenantCode();
      const employerSize = managerData.employeeCount >= 10 ? 'large' : 'small';
      const tenantId = `tenant_${userRecord.uid}`;

      // Create tenant document
      await db.collection('tenants').doc(tenantId).set({
        id: tenantId,
        companyName: managerData.companyName,
        tenantCode,
        size: employerSize,
        employeeCount: managerData.employeeCount,
        ownerId: userRecord.uid,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create user document
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        email: managerData.email,
        name: managerData.name,
        role: 'employer',
        employerId: tenantId,
        employerSize,
        status: 'pending',
        emailVerified: false,
        tenantId,
        tenantCode,
        companyName: managerData.companyName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create audit log
      await db.collection('auditLogs').add({
        userId: userRecord.uid,
        employerId: tenantId,
        action: 'registration',
        details: {
          role: 'employer',
          companyName: managerData.companyName,
          employeeCount: managerData.employeeCount,
          tenantCode,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Generate email verification link
      const actionCodeSettings = {
        url: `${process.env.APP_URL || 'http://localhost:5173'}/login?verified=true`,
        handleCodeInApp: false,
      };
      
      const verificationLink = await auth.generateEmailVerificationLink(
        managerData.email,
        actionCodeSettings
      );

      return res.status(200).json({
        success: true,
        userId: userRecord.uid,
        tenantCode,
        needsVerification: true,
        verificationLink, // In production, send this via email service
        message: 'Manager account created successfully. Please verify your email.',
      });
    } else {
      // Employee registration
      const employeeData = data as RegisterEmployeeRequest;
      
      if (!employeeData.tenantCode && !employeeData.employerEmail) {
        return res.status(400).json({ 
          error: 'Either tenantCode or employerEmail is required for employee registration' 
        });
      }

      // Find tenant
      let tenantDoc;
      let tenantId = '';
      let tenantData: any;

      if (employeeData.tenantCode) {
        const tenantsQuery = await db.collection('tenants')
          .where('tenantCode', '==', employeeData.tenantCode.toUpperCase())
          .limit(1)
          .get();

        if (tenantsQuery.empty) {
          return res.status(404).json({ error: 'Invalid company code' });
        }

        tenantDoc = tenantsQuery.docs[0];
        tenantId = tenantDoc.id;
        tenantData = tenantDoc.data();
      } else if (employeeData.employerEmail) {
        const emailDomain = employeeData.employerEmail.split('@')[1];
        const tenantsQuery = await db.collection('tenants')
          .where('emailDomain', '==', emailDomain)
          .limit(1)
          .get();

        if (tenantsQuery.empty) {
          return res.status(404).json({ 
            error: 'No company found with this email domain. Please use a company code instead.' 
          });
        }

        tenantDoc = tenantsQuery.docs[0];
        tenantId = tenantDoc.id;
        tenantData = tenantDoc.data();
      }

      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: employeeData.email,
        password: employeeData.password,
        displayName: employeeData.name,
        emailVerified: false,
      });

      // Create user document
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        email: employeeData.email,
        name: employeeData.name,
        role: 'employee',
        employerId: tenantId,
        employerSize: tenantData.size,
        status: 'pending',
        emailVerified: false,
        tenantId,
        companyName: tenantData.companyName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create audit log
      await db.collection('auditLogs').add({
        userId: userRecord.uid,
        employerId: tenantId,
        action: 'registration',
        details: {
          role: 'employee',
          tenantId,
          registrationMethod: employeeData.tenantCode ? 'tenantCode' : 'employerEmail',
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Generate email verification link
      const actionCodeSettings = {
        url: `${process.env.APP_URL || 'http://localhost:5173'}/login?verified=true`,
        handleCodeInApp: false,
      };
      
      const verificationLink = await auth.generateEmailVerificationLink(
        employeeData.email,
        actionCodeSettings
      );

      return res.status(200).json({
        success: true,
        userId: userRecord.uid,
        needsVerification: true,
        verificationLink, // In production, send this via email service
        message: 'Employee account created successfully. Please verify your email.',
      });
    }
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ 
        error: 'This email is already registered. Please use a different email or try logging in.' 
      });
    } else if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email address format.' });
    } else if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak. Please use at least 6 characters.' });
    }

    return res.status(500).json({ 
      error: 'Registration failed. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
